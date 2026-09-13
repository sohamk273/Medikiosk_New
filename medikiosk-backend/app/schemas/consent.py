"""ConsentRecord Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ConsentCreate(BaseModel):
    """Client consent payload."""
    accepted: bool
    timestamp: Optional[str] = None
    consent_version: Optional[str] = "v1.0"
    abdm_sharing: Optional[bool] = True
    voice_recording: Optional[bool] = True


class ConsentRead(BaseModel):
    """Authoritative consent response."""
    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: Optional[uuid.UUID] = None
    consent_version: str
    granted: bool
    abdm_sharing: bool
    voice_recording: bool
    consented_at: datetime

    model_config = ConfigDict(from_attributes=True)
