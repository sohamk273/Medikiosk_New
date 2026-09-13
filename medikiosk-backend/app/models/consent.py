"""ConsentRecord model persisting patient DPDP/ABDM consent evidence."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConsentRecord(Base):
    """Immutable evidence record of patient consent."""
    __tablename__ = "consent_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    encounter_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("encounters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    consent_version: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="v1.0",
    )
    granted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    abdm_sharing: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    voice_recording: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    consented_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="consent_records",
    )
    encounter: Mapped[Optional["Encounter"]] = relationship(
        "Encounter",
        back_populates="consent_records",
    )

    def __repr__(self) -> str:
        return f"<ConsentRecord id={self.id} patient_id={self.patient_id} granted={self.granted} v={self.consent_version}>"
