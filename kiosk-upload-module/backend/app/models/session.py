"""SQLAlchemy model for upload sessions."""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SessionStatus(str, Enum):
    """Lifecycle states for an upload session."""
    WAITING = "WAITING"
    CONNECTED = "CONNECTED"
    UPLOADING = "UPLOADING"
    UPLOADED = "UPLOADED"
    CONSUMED = "CONSUMED"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"


class UploadSession(Base):
    """Tracks a temporary document upload session initiated by a kiosk."""
    __tablename__ = "upload_sessions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    upload_token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default=SessionStatus.WAITING.value,
        index=True,
        nullable=False,
    )

    # Constraints configured by kiosk
    allowed_mime_types: Mapped[List[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )
    max_file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Uploaded file metadata
    file_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    file_content_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    file_size_bytes: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    file_sha256: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )

    # Object storage coordinates
    storage_bucket: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    storage_key: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Opaque external context from parent application
    external_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    error_reason: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    # Lifecycle timestamps
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    consumed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    @property
    def is_expired(self) -> bool:
        """Returns True if the current time exceeds expires_at."""
        now = datetime.now(self.expires_at.tzinfo) if self.expires_at.tzinfo else datetime.utcnow()
        return now > self.expires_at

    def __repr__(self) -> str:
        return f"<UploadSession id={self.id} status={self.status} expires={self.expires_at}>"
