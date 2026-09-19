"""AYUSH Prakriti and Ayurvedic Assessment model."""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import String, DateTime, ForeignKey, JSON, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AYUSHAssessmentRecord(Base):
    """Durable record for patient AYUSH intake answers, computed Prakriti, and doctor assessment."""
    __tablename__ = "ayush_assessments"

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
    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    prakriti_scores: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=lambda: {"vata": 0, "pitta": 0, "kapha": 0},
    )
    dominant_prakriti: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Tridoshaja",
        index=True,
    )
    patient_responses: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    doctor_assessment: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="COMPLETED",
        index=True,
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

    # Relationships
    encounter = relationship("Encounter", lazy="selectin")
    patient = relationship("Patient", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AYUSHAssessmentRecord id={self.id} encounter_id={self.encounter_id} prakriti='{self.dominant_prakriti}'>"
