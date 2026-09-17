"""Encounter Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.encounter import EncounterStatus, EncounterPriority
from app.models.queue import QueueStatus


class EncounterBase(BaseModel):
    chief_complaint: Optional[str] = None
    priority: EncounterPriority = EncounterPriority.NORMAL
    red_flag_triggered: bool = False


class EncounterCreate(BaseModel):
    patient_id: uuid.UUID
    priority: Optional[EncounterPriority] = EncounterPriority.NORMAL


class EncounterUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    priority: Optional[EncounterPriority] = None
    red_flag_triggered: Optional[bool] = None


class EncounterRead(EncounterBase):
    id: uuid.UUID
    encounter_number: str
    patient_id: uuid.UUID
    status: EncounterStatus
    registered_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EncounterPatientSummary(BaseModel):
    id: uuid.UUID
    uhid: str
    full_name: str
    age: Optional[int] = None
    gender: str
    mobile: Optional[str] = None


from app.schemas.consultation import ConsultationRead


class EncounterDetailResponse(BaseModel):
    encounter: EncounterRead
    patient: EncounterPatientSummary
    queue_entry_id: Optional[uuid.UUID] = None
    token_number: Optional[int] = None
    queue_status: Optional[QueueStatus] = None
    consultation: Optional[ConsultationRead] = None


class EncounterSubmitResponse(BaseModel):
    """Payload returned upon successful kiosk encounter submission."""
    success: bool
    patient_id: uuid.UUID
    uhid: str
    encounter_id: uuid.UUID
    encounter_number: str
    queue_entry_id: uuid.UUID
    token_number: int
    queue_status: QueueStatus
    submitted_at: datetime
