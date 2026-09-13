"""Patient and PatientIdentity Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.identity import IdentityType


class PatientIdentityBase(BaseModel):
    identity_type: IdentityType
    identity_value: str = Field(..., min_length=1, max_length=50)


class PatientIdentityCreate(PatientIdentityBase):
    is_verified: bool = False


class PatientIdentityRead(PatientIdentityBase):
    id: uuid.UUID
    patient_id: uuid.UUID
    is_verified: bool
    verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: str = Field(..., max_length=20)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=10)


class PatientCreate(PatientBase):
    patient_uhid: Optional[str] = None
    identities: Optional[List[PatientIdentityCreate]] = []


class PatientRead(PatientBase):
    id: uuid.UUID
    patient_uhid: str
    created_at: datetime
    updated_at: datetime
    identities: List[PatientIdentityRead] = []

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def uhid(self) -> str:
        """Alias for patient_uhid for frontend convenience."""
        return self.patient_uhid


class PatientLookupResponse(BaseModel):
    patient: PatientRead
