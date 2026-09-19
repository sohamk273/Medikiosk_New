"""API route handlers for Kiosk client interactions."""
from datetime import datetime
import logging
from typing import Optional
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import SessionStatus
from app.schemas.session import (
    SessionCreateRequest,
    SessionCreatedResponse,
    SessionDetailResponse,
    SessionConsumeResponse,
    FileMetadata,
    StorageReference,
)
from app.services.event_service import EventBroker, get_event_broker
from app.services.session_service import SessionService, get_session_service
from app.storage.base import StorageProvider
from app.storage.minio_provider import get_storage_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["Kiosk Upload Sessions"])


@router.post(
    "",
    response_model=SessionCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new upload session",
)
async def create_upload_session(
    payload: Optional[SessionCreateRequest] = None,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
) -> SessionCreatedResponse:
    """Initializes a new temporary upload session and returns a QR-compatible upload URL."""
    req = payload or SessionCreateRequest()
    session, _, upload_url = await session_service.create_session(
        db=db,
        ttl_seconds=req.ttl_seconds,
        allowed_types=req.allowed_types,
        max_size_mb=req.max_size_mb,
        metadata=req.metadata,
    )
    ttl = req.ttl_seconds or 600
    return SessionCreatedResponse(
        session_id=session.id,
        status=session.status,
        upload_url=upload_url,
        expires_at=session.expires_at,
        created_at=session.created_at,
        ttl_seconds=ttl,
    )


@router.get(
    "/{session_id}",
    response_model=SessionDetailResponse,
    summary="Get upload session status and file metadata",
)
async def get_session_detail(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
) -> SessionDetailResponse:
    """Retrieves session status and metadata. Automatically marks session EXPIRED if past TTL."""
    session = await session_service.get_by_id(db, session_id)

    file_meta = None
    if session.file_name and session.file_size_bytes and session.file_content_type:
        file_meta = FileMetadata(
            file_name=session.file_name,
            content_type=session.file_content_type,
            file_size=session.file_size_bytes,
            sha256=session.file_sha256 or "",
            uploaded_at=session.updated_at,
        )

    return SessionDetailResponse(
        session_id=session.id,
        status=session.status,
        file_metadata=file_meta,
        expires_at=session.expires_at,
        created_at=session.created_at,
        consumed_at=session.consumed_at,
        error_reason=session.error_reason,
        metadata=session.external_metadata,
    )


@router.get(
    "/{session_id}/events",
    summary="Subscribe to realtime session status updates via SSE",
)
async def stream_session_events(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    broker: EventBroker = Depends(get_event_broker),
):
    """Server-Sent Events (SSE) stream pushing status transitions to the kiosk in real time."""
    session = await session_service.get_by_id(db, session_id)

    initial_payload = {
        "status": session.status,
        "expires_at": session.expires_at.isoformat(),
    }
    if session.status == SessionStatus.UPLOADED.value and session.file_name:
        initial_payload["file_metadata"] = {
            "file_name": session.file_name,
            "content_type": session.file_content_type,
            "file_size": session.file_size_bytes,
            "sha256": session.file_sha256,
        }

    return StreamingResponse(
        broker.event_generator(session_id, initial_data=initial_payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/{session_id}/consume",
    response_model=SessionConsumeResponse,
    summary="Consume and finalize uploaded document",
)
async def consume_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
) -> SessionConsumeResponse:
    """Finalizes the document upload. Permanently revokes the upload token and returns storage coordinates."""
    session = await session_service.get_by_id(db, session_id)
    consumed = await session_service.mark_consumed(db, session)

    storage_ref = StorageReference(
        bucket=consumed.storage_bucket or "",
        object_key=consumed.storage_key or "",
        content_type=consumed.file_content_type or "",
        file_size=consumed.file_size_bytes or 0,
        sha256=consumed.file_sha256 or "",
        file_name=consumed.file_name or "uploaded_document",
    )

    return SessionConsumeResponse(
        session_id=consumed.id,
        status=consumed.status,
        storage_reference=storage_ref,
        metadata=consumed.external_metadata,
        consumed_at=consumed.consumed_at or datetime.utcnow(),
    )


@router.get(
    "/{session_id}/preview-url",
    summary="Generate temporary preview URL for uploaded document",
)
async def get_preview_url(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    storage_provider: StorageProvider = Depends(get_storage_provider),
):
    """Provides a short-lived presigned URL for the kiosk to render an image or PDF preview."""
    session = await session_service.get_by_id(db, session_id)
    if session.status not in [SessionStatus.UPLOADED.value, SessionStatus.CONSUMED.value]:
        return {"url": None, "available": False}

    if not session.storage_key:
        return {"url": None, "available": False}

    url = storage_provider.get_presigned_url(session.storage_key, expires_seconds=300)
    return {
        "url": url,
        "available": True,
        "file_name": session.file_name,
        "content_type": session.file_content_type,
    }


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel upload session",
)
async def cancel_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
):
    """Cancels an active session early."""
    session = await session_service.get_by_id(db, session_id)
    await session_service.mark_failed(db, session, "Cancelled by kiosk operator.")
    return None
