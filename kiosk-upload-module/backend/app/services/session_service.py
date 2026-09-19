"""Service managing the UploadSession lifecycle, security tokens, and state transitions."""
from datetime import datetime, timedelta, timezone
import hashlib
import logging
import secrets
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.session import UploadSession, SessionStatus
from app.services.event_service import EventBroker, get_event_broker

logger = logging.getLogger(__name__)


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of plaintext token for secure DB storage."""
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


class SessionService:
    """Coordinates upload session state and cryptographic tokens."""

    def __init__(self, broker: Optional[EventBroker] = None):
        self.broker = broker or get_event_broker()

    async def create_session(
        self,
        db: AsyncSession,
        ttl_seconds: Optional[int] = None,
        allowed_types: Optional[List[str]] = None,
        max_size_mb: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[UploadSession, str, str]:
        """Creates an upload session with a high-entropy secret token.
        
        Returns:
            (UploadSession, raw_secret_token, full_upload_url)
        """
        ttl = ttl_seconds or settings.DEFAULT_SESSION_TTL_SECONDS
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)

        mimes = allowed_types or settings.ALLOWED_MIME_TYPES
        size_mb = max_size_mb or settings.MAX_FILE_SIZE_MB
        max_bytes = size_mb * 1024 * 1024

        # Generate 256-bit cryptographically secure token (URL safe)
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)

        session = UploadSession(
            upload_token_hash=token_hash,
            status=SessionStatus.WAITING.value,
            allowed_mime_types=mimes,
            max_file_size_bytes=max_bytes,
            external_metadata=metadata or {},
            expires_at=expires_at,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        # Build public mobile upload URL for the QR code
        base_url = settings.resolved_public_web_url
        upload_url = f"{base_url}/upload/{raw_token}"

        logger.info("Created upload session %s (expires: %s)", session.id, expires_at.isoformat())
        return session, raw_token, upload_url

    async def get_by_id(
        self,
        db: AsyncSession,
        session_id: str,
    ) -> UploadSession:
        """Retrieves session by UUID. Automatically updates status if expired."""
        result = await db.execute(select(UploadSession).where(UploadSession.id == session_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Upload session '{session_id}' not found.",
            )

        # Automatic expiration check
        if session.status in [SessionStatus.WAITING.value, SessionStatus.CONNECTED.value] and session.is_expired:
            session.status = SessionStatus.EXPIRED.value
            await db.commit()
            await db.refresh(session)
            await self.broker.publish(session.id, "status_change", {"status": SessionStatus.EXPIRED.value})

        return session

    async def get_by_token(
        self,
        db: AsyncSession,
        raw_token: str,
    ) -> UploadSession:
        """Finds session by raw token pre-image. Validates expiration and single-use."""
        token_hash = hash_token(raw_token)
        result = await db.execute(select(UploadSession).where(UploadSession.upload_token_hash == token_hash))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or unrecognized upload token.",
            )

        # Check expiration
        if session.is_expired:
            if session.status not in [SessionStatus.CONSUMED.value, SessionStatus.UPLOADED.value]:
                session.status = SessionStatus.EXPIRED.value
                await db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This upload session has expired. Please scan a fresh QR code at the kiosk.",
            )

        # Check if already consumed or uploaded (single-use constraint)
        if session.status == SessionStatus.CONSUMED.value:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This upload session has already been completed and closed.",
            )

        if session.status == SessionStatus.UPLOADED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A document has already been uploaded for this session.",
            )

        return session

    async def mark_connected(
        self,
        db: AsyncSession,
        session: UploadSession,
    ) -> UploadSession:
        """Transitions WAITING -> CONNECTED when phone loads page."""
        if session.status == SessionStatus.WAITING.value:
            session.status = SessionStatus.CONNECTED.value
            await db.commit()
            await db.refresh(session)
            await self.broker.publish(
                session.id,
                "status_change",
                {"status": SessionStatus.CONNECTED.value, "timestamp": datetime.now(timezone.utc).isoformat()},
            )
            logger.info("Session %s: Phone connected", session.id)
        return session

    async def mark_uploading(
        self,
        db: AsyncSession,
        session: UploadSession,
    ) -> UploadSession:
        """Transitions to UPLOADING when binary transfer begins."""
        session.status = SessionStatus.UPLOADING.value
        await db.commit()
        await db.refresh(session)
        await self.broker.publish(
            session.id,
            "status_change",
            {"status": SessionStatus.UPLOADING.value, "timestamp": datetime.now(timezone.utc).isoformat()},
        )
        return session

    async def mark_uploaded(
        self,
        db: AsyncSession,
        session: UploadSession,
        file_name: str,
        content_type: str,
        file_size_bytes: int,
        file_sha256: str,
        storage_bucket: str,
        storage_key: str,
    ) -> UploadSession:
        """Transitions session to UPLOADED and stores file metadata."""
        session.status = SessionStatus.UPLOADED.value
        session.file_name = file_name
        session.file_content_type = content_type
        session.file_size_bytes = file_size_bytes
        session.file_sha256 = file_sha256
        session.storage_bucket = storage_bucket
        session.storage_key = storage_key

        await db.commit()
        await db.refresh(session)

        # Notify kiosk via SSE
        await self.broker.publish(
            session.id,
            "status_change",
            {
                "status": SessionStatus.UPLOADED.value,
                "file_metadata": {
                    "file_name": file_name,
                    "content_type": content_type,
                    "file_size": file_size_bytes,
                    "sha256": file_sha256,
                    "uploaded_at": session.updated_at.isoformat() if session.updated_at else None,
                },
            },
        )
        logger.info("Session %s: File uploaded (%s, %d bytes)", session.id, file_name, file_size_bytes)
        return session

    async def mark_consumed(
        self,
        db: AsyncSession,
        session: UploadSession,
    ) -> UploadSession:
        """Transitions UPLOADED -> CONSUMED, permanently closing the session.
        Idempotent: If already CONSUMED, returns the existing session with storage coordinates.
        """
        if session.status == SessionStatus.CONSUMED.value:
            logger.info("Session %s: Already consumed, returning existing record (idempotent)", session.id)
            return session

        if session.status != SessionStatus.UPLOADED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot consume session in state '{session.status}'. Must be 'UPLOADED'.",
            )

        session.status = SessionStatus.CONSUMED.value
        session.consumed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(session)

        await self.broker.publish(
            session.id,
            "status_change",
            {"status": SessionStatus.CONSUMED.value, "timestamp": session.consumed_at.isoformat()},
        )
        logger.info("Session %s: Consumed by kiosk", session.id)
        return session

    async def mark_failed(
        self,
        db: AsyncSession,
        session: UploadSession,
        reason: str,
    ) -> UploadSession:
        """Transitions session to FAILED state."""
        session.status = SessionStatus.FAILED.value
        session.error_reason = reason
        await db.commit()
        await db.refresh(session)

        await self.broker.publish(
            session.id,
            "status_change",
            {"status": SessionStatus.FAILED.value, "reason": reason},
        )
        logger.warning("Session %s: Failed (%s)", session.id, reason)
        return session


# Global service instance and FastAPI dependency helper
default_session_service = SessionService()


def get_session_service() -> SessionService:
    """Dependency provider for FastAPI routes."""
    return default_session_service
