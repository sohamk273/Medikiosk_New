"""Encounter and QueueEntry Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.encounter import EncounterStatus, EncounterPriority
from app.models.queue import QueueStatus


class QueueEntryRead(BaseModel):
    id: uuid.UUID
    encounter_id: uuid.UUID
    token_number: int
    queue_status: QueueStatus
    priority: EncounterPriority
    queued_at: datetime
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EncounterBase(BaseModel):
    chief_complaint: Optional[str] = None
    priority: EncounterPriority = EncounterPriority.NORMAL
    red_flag_triggered: bool = False


class EncounterCreate(EncounterBase):
    patient_id: uuid.UUID


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
