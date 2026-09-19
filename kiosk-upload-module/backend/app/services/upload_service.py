"""Service for validating uploaded files, calculating hashes, and streaming to MinIO."""
from datetime import datetime, timezone
import hashlib
import io
import logging
import re
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.session import UploadSession
from app.services.session_service import SessionService, get_session_service
from app.storage.base import StorageProvider
from app.storage.minio_provider import get_storage_provider

logger = logging.getLogger(__name__)

# Magic byte signatures for strict binary validation
MAGIC_BYTES = {
    "application/pdf": b"%PDF-",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/jpeg": b"\xff\xd8\xff",
    "image/jpg": b"\xff\xd8\xff",
}


def sanitize_filename(filename: str) -> str:
    """Strips directory traversal sequences and special characters."""
    clean = filename.replace("\\", "/").split("/")[-1].strip()
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean)
    clean = re.sub(r"_+", "_", clean)
    return clean or "upload"


def verify_magic_bytes(data: bytes, content_type: str) -> bool:
    """Inspects the initial file header bytes against known magic signatures."""
    expected = MAGIC_BYTES.get(content_type.lower())
    if not expected:
        return True  # If no signature configured, rely on MIME
    return data.startswith(expected)


class UploadService:
    """Coordinates file ingestion, backend security validation, and MinIO storage."""

    def __init__(
        self,
        session_service: Optional[SessionService] = None,
        storage_provider: Optional[StorageProvider] = None,
    ):
        self.session_service = session_service or get_session_service()
        self.storage_provider = storage_provider or get_storage_provider()

    async def process_mobile_upload(
        self,
        db: AsyncSession,
        session: UploadSession,
        file: UploadFile,
    ) -> UploadSession:
        """Validates incoming binary, streams to MinIO, and records metadata."""
        await self.session_service.mark_uploading(db, session)

        # 1. Read binary stream
        try:
            file_bytes = await file.read()
        except Exception as e:
            logger.error("Failed to read upload stream for session %s: %s", session.id, e)
            await self.session_service.mark_failed(db, session, "Failed to read upload stream.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to read uploaded file.",
            )

        file_size = len(file_bytes)
        if file_size == 0:
            await self.session_service.mark_failed(db, session, "Uploaded file was empty.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        # 2. Validate size limit
        if file_size > session.max_file_size_bytes:
            max_mb = session.max_file_size_bytes / (1024 * 1024)
            await self.session_service.mark_failed(db, session, f"File exceeds {max_mb}MB limit.")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds the allowed limit of {max_mb:.1f} MB.",
            )

        # 3. Validate Content-Type
        raw_mime = file.content_type or "application/octet-stream"
        normalized_mime = "image/jpeg" if raw_mime.lower() == "image/jpg" else raw_mime.lower()

        allowed_normalized = [m.lower() for m in session.allowed_mime_types]
        if normalized_mime not in allowed_normalized:
            await self.session_service.mark_failed(db, session, f"MIME type '{normalized_mime}' not permitted.")
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File type '{raw_mime}' is not permitted for this session.",
            )

        # 4. Strict Magic Byte Verification
        if not verify_magic_bytes(file_bytes, normalized_mime):
            logger.warning("Magic byte mismatch for session %s: claims %s", session.id, raw_mime)
            await self.session_service.mark_failed(db, session, "File binary header does not match claimed MIME type.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content header does not match its file extension or MIME type.",
            )

        # 5. Compute SHA-256 checksum
        sha256 = hashlib.sha256(file_bytes).hexdigest()

        # 6. Generate collision-safe, date-partitioned MinIO object key
        now = datetime.now(timezone.utc)
        safe_name = sanitize_filename(file.filename or "document")
        object_key = f"uploads/{now.strftime('%Y/%m/%d')}/{session.id}_{safe_name}"
        bucket = settings.MINIO_BUCKET

        # 7. Upload to MinIO
        try:
            self.storage_provider.upload_stream(
                object_key=object_key,
                data=io.BytesIO(file_bytes),
                length=file_size,
                content_type=normalized_mime,
                bucket=bucket,
            )
        except Exception as storage_err:
            logger.error("Storage upload failed for session %s: %s", session.id, storage_err)
            await self.session_service.mark_failed(db, session, "Object storage write error.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist file in storage service.",
            )

        # 8. Update session state to UPLOADED
        try:
            updated = await self.session_service.mark_uploaded(
                db=db,
                session=session,
                file_name=file.filename or safe_name,
                content_type=normalized_mime,
                file_size_bytes=file_size,
                file_sha256=sha256,
                storage_bucket=bucket,
                storage_key=object_key,
            )
            return updated
        except Exception as db_err:
            logger.error("DB update failed after MinIO upload for session %s: %s", session.id, db_err)
            # Prevent orphaned files in storage if database commit fails
            try:
                self.storage_provider.delete_object(object_key, bucket=bucket)
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record upload metadata.",
            )


from fastapi import Depends


def get_upload_service(
    session_service: SessionService = Depends(get_session_service),
    storage_provider: StorageProvider = Depends(get_storage_provider),
) -> UploadService:
    """Dependency provider for FastAPI routes."""
    return UploadService(session_service=session_service, storage_provider=storage_provider)
