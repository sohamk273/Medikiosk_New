"""Pydantic schemas for mobile phone upload interactions."""
from datetime import datetime
from typing import List
from pydantic import BaseModel


class MobileSessionHandshakeResponse(BaseModel):
    """Information returned to the mobile phone when scanning the QR code."""
    session_id: str
    status: str
    allowed_types: List[str]
    max_size_mb: int
    expires_at: datetime


class MobileUploadSuccessResponse(BaseModel):
    """Response returned to the phone when the upload finishes."""
    status: str
    message: str
    file_name: str
    file_size: int
