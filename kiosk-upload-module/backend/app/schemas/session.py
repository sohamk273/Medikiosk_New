"""Pydantic schemas for kiosk session interactions."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SessionCreateRequest(BaseModel):
    """Payload to initiate a new temporary upload session from the kiosk."""
    ttl_seconds: Optional[int] = Field(default=None, ge=60, le=3600, description="Session TTL in seconds (1 min to 1 hr)")
    allowed_types: Optional[List[str]] = Field(default=None, description="Allowed MIME types (e.g. ['image/jpeg', 'application/pdf'])")
    max_size_mb: Optional[int] = Field(default=None, ge=1, le=50, description="Maximum file size in MB")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Opaque metadata supplied by parent application")


class SessionCreatedResponse(BaseModel):
    """Response returned to kiosk containing the session ID and QR URL."""
    session_id: str
    status: str
    upload_url: str
    expires_at: datetime
    created_at: datetime
    ttl_seconds: int = 600

    model_config = ConfigDict(from_attributes=True)


class FileMetadata(BaseModel):
    """Metadata describing the uploaded file."""
    file_name: str
    content_type: str
    file_size: int
    sha256: str
    uploaded_at: Optional[datetime] = None


class SessionDetailResponse(BaseModel):
    """Detailed session state query response for kiosk status checks."""
    session_id: str
    status: str
    file_metadata: Optional[FileMetadata] = None
    expires_at: datetime
    created_at: datetime
    consumed_at: Optional[datetime] = None
    error_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class StorageReference(BaseModel):
    """Opaque MinIO storage coordinates returned upon consumption."""
    bucket: str
    object_key: str
    content_type: str
    file_size: int
    sha256: str
    file_name: Optional[str] = None


class SessionConsumeResponse(BaseModel):
    """Confirmation returned when the kiosk consumes/finalizes the document."""
    session_id: str
    status: str
    storage_reference: StorageReference
    metadata: Optional[Dict[str, Any]] = None
    consumed_at: datetime
