"""Physician consultation record model persisting clinical notes, diagnoses, and prescriptions."""
import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum, JSON, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConsultationStatus(str, enum.Enum):
    """Lifecycle status of a clinical consultation."""
    DRAFT = "DRAFT"
    FINALIZED = "FINALIZED"


class ConsultationRecord(Base):
    """Immutable/versioned clinical consultation record created by an authenticated doctor."""
    __tablename__ = "consultation_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    encounter_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("encounters.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[ConsultationStatus] = mapped_column(
        Enum(ConsultationStatus, name="consultation_status_enum", native_enum=False),
        nullable=False,
        default=ConsultationStatus.DRAFT,
        index=True,
    )
    findings: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    assessment: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    diagnosis: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    prescription: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
    )
    follow_up: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
    )
    ayush_assessment: Mapped[Optional[dict]] = mapped_column(
        JSON,
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
    finalized_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    encounter: Mapped["Encounter"] = relationship(
        "Encounter",
        back_populates="consultation",
        lazy="selectin",
    )
    doctor: Mapped["User"] = relationship(
        "User",
        lazy="selectin",
    )

    @property
    def doctor_name(self) -> Optional[str]:
        if self.doctor:
            return getattr(self.doctor, "display_name", None) or getattr(self.doctor, "username", None)
        return None

    def __repr__(self) -> str:
        return f"<ConsultationRecord id={self.id} encounter_id={self.encounter_id} doctor_id={self.doctor_id} status={self.status}>"
