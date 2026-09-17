"""Consultation Pydantic schemas for physician documentation and prescription."""
import uuid
from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field

from app.models.consultation import ConsultationStatus


class ConsultationBase(BaseModel):
    findings: Optional[str] = Field(default="", description="Physical/examination findings")
    assessment: Optional[str] = Field(default="", description="Clinical assessment notes")
    diagnosis: Optional[str] = Field(default="", description="Provisional or confirmed diagnosis")
    notes: Optional[str] = Field(default="", description="Additional clinical consultation notes")
    prescription: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {"items": []},
        description="Prescribed medications, dosages, and instructions",
    )
    follow_up: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {"required": False, "timeframe": "", "instructions": ""},
        description="Follow-up instructions and timeframe",
    )
    ayush_assessment: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional AYUSH clinical assessment fields (prakriti, agni, etc.)",
    )


class ConsultationCreate(ConsultationBase):
    pass


class ConsultationUpdate(ConsultationBase):
    pass


class ConsultationRead(ConsultationBase):
    id: uuid.UUID
    encounter_id: uuid.UUID
    doctor_id: uuid.UUID
    doctor_name: Optional[str] = None
    status: ConsultationStatus
    created_at: datetime
    updated_at: datetime
    finalized_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
