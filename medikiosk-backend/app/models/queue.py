"""QueueEntry model for PostgreSQL-backed OPD patient queue."""
import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, DateTime, ForeignKey, Enum, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.encounter import EncounterPriority


class QueueStatus(str, enum.Enum):
    """Queue entry progression states."""
    WAITING = "WAITING"
    CALLED = "CALLED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class QueueEntry(Base):
    """Active or historical OPD queue entry for a clinical encounter."""
    __tablename__ = "queue_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    encounter_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("encounters.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )
    queue_status: Mapped[QueueStatus] = mapped_column(
        Enum(QueueStatus, name="queue_status_enum", native_enum=False),
        nullable=False,
        default=QueueStatus.WAITING,
        index=True,
    )
    priority: Mapped[EncounterPriority] = mapped_column(
        Enum(EncounterPriority, name="queue_priority_enum", native_enum=False),
        nullable=False,
        default=EncounterPriority.NORMAL,
        index=True,
    )
    queued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    called_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    encounter: Mapped["Encounter"] = relationship(
        "Encounter",
        back_populates="queue_entries",
    )

    def __repr__(self) -> str:
        return f"<QueueEntry id={self.id} token={self.token_number} status={self.queue_status} priority={self.priority}>"
