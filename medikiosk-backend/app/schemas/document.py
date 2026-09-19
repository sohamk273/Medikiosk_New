import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    """Base document schema."""
    document_type: Optional[str] = Field(
        None,
        description="Clinical document category (e.g. PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY, OPD_SLIP, OTHER)",
    )


class DocumentCreate(DocumentBase):
    """Document creation input from client form data.
    Note: System-controlled fields (id, patient_id, storage_key, uploaded_at, processing_status)
    are strictly forbidden here and are managed authoritatively by the backend.
    """
    pass


class DocumentAttach(DocumentBase):
    """Document attachment payload for documents uploaded via QR mobile session or external storage."""
    file_name: str = Field(..., description="Original file name")
    content_type: str = Field(..., description="MIME content type")
    file_size: int = Field(..., description="File size in bytes")
    storage_key: str = Field(..., description="MinIO object storage key or URI")
    document_type: Optional[str] = Field("OTHER", description="Clinical document category")


class DocumentRead(DocumentBase):
    """Document metadata read representation returned to clients."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique document UUID")
    patient_id: uuid.UUID = Field(..., description="Associated patient ID")
    encounter_id: uuid.UUID = Field(..., description="Associated encounter ID")
    file_name: str = Field(..., description="Original file name")
    content_type: str = Field(..., description="MIME content type")
    file_size: int = Field(..., description="File size in bytes")
    storage_key: str = Field(..., description="MinIO object storage key")
    processing_status: str = Field(..., description="Storage/document lifecycle status (e.g. UPLOADED)")
    uploaded_at: datetime = Field(..., description="Timestamp when document was uploaded")
    updated_at: datetime = Field(..., description="Timestamp when document was last modified")


class DocumentPresignedUrlResponse(BaseModel):
    """Secure temporary download/preview URL response for doctors."""
    document_id: uuid.UUID
    file_name: str
    content_type: str
    url: str
    expires_in: int = Field(..., description="Expiration window in seconds")
