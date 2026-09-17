"""Encounter model representing a clinical visit and patient journey."""
import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey, Enum, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EncounterStatus(str, enum.Enum):
    """Encounter lifecycle status values."""
    WAITING = "WAITING"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"


class EncounterPriority(str, enum.Enum):
    """Triage priority levels."""
    NORMAL = "NORMAL"
    EMERGENCY = "EMERGENCY"


class Encounter(Base):
    """Clinical encounter representing an OPD visit or kiosk intake."""
    __tablename__ = "encounters"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    encounter_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[EncounterStatus] = mapped_column(
        Enum(EncounterStatus, name="encounter_status_enum", native_enum=False),
        nullable=False,
        default=EncounterStatus.WAITING,
        index=True,
    )
    priority: Mapped[EncounterPriority] = mapped_column(
        Enum(EncounterPriority, name="encounter_priority_enum", native_enum=False),
        nullable=False,
        default=EncounterPriority.NORMAL,
        index=True,
    )
    chief_complaint: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    red_flag_triggered: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    # Relationships with selectin loading
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="encounters",
        lazy="selectin",
    )
    queue_entries: Mapped[List["QueueEntry"]] = relationship(
        "QueueEntry",
        back_populates="encounter",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    consent_records: Mapped[List["ConsentRecord"]] = relationship(
        "ConsentRecord",
        back_populates="encounter",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    consultation: Mapped[Optional["ConsultationRecord"]] = relationship(
        "ConsultationRecord",
        back_populates="encounter",
        lazy="selectin",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="encounter",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Encounter id={self.id} num='{self.encounter_number}' status={self.status} red_flag={self.red_flag_triggered}>"
