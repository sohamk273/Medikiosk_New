"""Database model for storing raw OCR document extractions."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.document import Document


class DocumentExtraction(Base):
    """Raw OCR extraction record for an uploaded medical document.
    
    Contains strictly raw transcription text. No clinical interpretation.
    """
    __tablename__ = "document_extractions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    extraction_type: Mapped[str] = mapped_column(
        String(50),
        default="OCR",
        nullable=False,
        index=True,
    )
    raw_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    page_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        nullable=False,
        index=True,
    )
    engine: Mapped[str] = mapped_column(
        String(50),
        default="PADDLEOCR",
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

    # Relationship back to Document
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="extractions",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<DocumentExtraction id={self.id} doc={self.document_id} "
            f"type='{self.extraction_type}' status='{self.status}' engine='{self.engine}'>"
        )
