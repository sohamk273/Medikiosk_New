"""API route handlers for mobile phone upload client."""
import logging
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.upload import (
    MobileSessionHandshakeResponse,
    MobileUploadSuccessResponse,
)
from app.services.session_service import SessionService, get_session_service
from app.services.upload_service import UploadService, get_upload_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["Mobile Client Upload"])


@router.get(
    "/{upload_token}",
    response_model=MobileSessionHandshakeResponse,
    summary="Validate token and handshake with mobile phone",
)
async def mobile_handshake(
    upload_token: str,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
) -> MobileSessionHandshakeResponse:
    """Validates the QR token pre-image and transitions session to CONNECTED."""
    session = await session_service.get_by_token(db, upload_token)
    session = await session_service.mark_connected(db, session)

    max_mb = int(session.max_file_size_bytes / (1024 * 1024))
    return MobileSessionHandshakeResponse(
        session_id=session.id,
        status=session.status,
        allowed_types=session.allowed_mime_types,
        max_size_mb=max_mb,
        expires_at=session.expires_at,
    )


@router.post(
    "/{upload_token}",
    response_model=MobileUploadSuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload document or photo from mobile phone",
)
async def upload_file(
    upload_token: str,
    file: UploadFile = File(..., description="Captured photo or document (PNG, JPEG, PDF)"),
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    upload_service: UploadService = Depends(get_upload_service),
) -> MobileUploadSuccessResponse:
    """Receives binary file from phone, validates size & magic bytes, streams to MinIO, and notifies kiosk."""
    session = await session_service.get_by_token(db, upload_token)
    updated_session = await upload_service.process_mobile_upload(
        db=db,
        session=session,
        file=file,
    )

    return MobileUploadSuccessResponse(
        status=updated_session.status,
        message="Document uploaded successfully! You may now return to the kiosk screen.",
        file_name=updated_session.file_name or "document",
        file_size=updated_session.file_size_bytes or 0,
    )
