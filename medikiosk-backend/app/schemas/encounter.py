"""Encounter Pydantic schemas including complete lifecycle record."""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.encounter import EncounterStatus, EncounterPriority
from app.models.queue import QueueStatus
from app.schemas.consent import ConsentRead
from app.schemas.consultation import ConsultationRead
from app.schemas.document import DocumentRead
from app.schemas.clinical import ClinicalEncounterRead
from app.schemas.ayush import AYUSHAssessmentRead
from app.schemas.audit import AuditEventRead


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
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


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


class EncounterLifecycleResponse(BaseModel):
    """Aggregated full lifecycle clinical record for Doctor EMR & persistence audit."""
    encounter: EncounterRead
    patient: EncounterPatientSummary
    consent: Optional[ConsentRead] = None
    queue_entry_id: Optional[uuid.UUID] = None
    token_number: Optional[int] = None
    queue_status: Optional[QueueStatus] = None
    clinical_case: Optional[ClinicalEncounterRead] = None
    ayush_assessment: Optional[AYUSHAssessmentRead] = None
    documents: List[DocumentRead] = Field(default_factory=list)
    consultation: Optional[ConsultationRead] = None
    audit_trail: List[AuditEventRead] = Field(default_factory=list)
    is_emergency: bool = False
    lifecycle_status: str = "ACTIVE"
