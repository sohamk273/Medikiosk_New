"""OPD Queue Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.encounter import EncounterPriority, EncounterStatus
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


class QueueItemResponse(BaseModel):
    """Enriched queue item for DoctorQueue and Dashboard display."""
    queue_entry_id: uuid.UUID
    encounter_id: uuid.UUID
    patient_id: uuid.UUID
    token_number: int
    encounter_number: str
    patient_name: str
    age: Optional[int] = None
    gender: str
    mobile: Optional[str] = None
    priority: EncounterPriority
    queue_status: QueueStatus
    chief_complaint: Optional[str] = None
    red_flag_triggered: bool = False
    queued_at: datetime
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class QueueCallResponse(BaseModel):
    """Result of calling a patient into consultation."""
    queue_entry_id: uuid.UUID
    encounter_id: uuid.UUID
    queue_status: QueueStatus
    encounter_status: EncounterStatus
    called_at: datetime
