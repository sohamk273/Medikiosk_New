"""Pydantic schemas for audit events."""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class AuditEventBase(BaseModel):
    action: str = Field(..., description="Action name e.g. SESSION_CREATED, CONSENT_RECORDED")
    entity_type: str = Field(..., description="Target entity type e.g. ENCOUNTER, PATIENT")
    entity_id: Optional[str] = Field(None, description="Identifier of target entity")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata key-values")
    ip_address: Optional[str] = Field(None, description="Originating client IP")


class AuditEventCreate(AuditEventBase):
    encounter_id: Optional[uuid.UUID] = None
    patient_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None


class AuditEventRead(AuditEventBase):
    id: uuid.UUID
    encounter_id: Optional[uuid.UUID] = None
    patient_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
