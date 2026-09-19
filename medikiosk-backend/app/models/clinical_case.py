"""Persistent clinical case record and conversation turn models for Stage 6."""
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey, JSON, func, Uuid, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ClinicalCaseRecord(Base):
    """Durable clinical case record containing structured intake state and doctor handoff summary."""
    __tablename__ = "clinical_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    encounter_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("encounters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="FINALIZED",
        index=True,
    )
    patient_language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="en",
    )
    chief_complaint: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    case_state: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    final_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    structured_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )
    red_flags: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    is_emergency: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    completion_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="COMPLETED",
    )
    intake_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    finalized_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
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

    # Relationships
    turns: Mapped[List["ClinicalTurnRecord"]] = relationship(
        "ClinicalTurnRecord",
        back_populates="clinical_case",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="ClinicalTurnRecord.turn_number",
    )

    def __repr__(self) -> str:
        return f"<ClinicalCaseRecord id={self.id} encounter_id={self.encounter_id} status='{self.status}' emergency={self.is_emergency}>"


class ClinicalTurnRecord(Base):
    """Chronological conversational turn record during kiosk clinical intake."""
    __tablename__ = "clinical_turns"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    clinical_case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("clinical_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    turn_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    question_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="GENERAL",
    )
    patient_transcript: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="en",
    )
    extracted_entities: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship
    clinical_case: Mapped["ClinicalCaseRecord"] = relationship(
        "ClinicalCaseRecord",
        back_populates="turns",
    )

    def __repr__(self) -> str:
        return f"<ClinicalTurnRecord id={self.id} turn={self.turn_number} q_type='{self.question_type}'>"
