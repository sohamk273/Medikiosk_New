"""Document management service coordinating MinIO storage and PostgreSQL metadata persistence."""
import io
import re
import uuid
from typing import List, Optional, Union
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.document import Document
from app.models.encounter import Encounter
from app.schemas.document import DocumentPresignedUrlResponse
from app.services.storage import StorageService


def sanitize_filename(filename: str) -> str:
    """Sanitizes user-provided filename to prevent directory traversal or unsafe characters."""
    # Strip directory paths
    clean = filename.replace("\\", "/").split("/")[-1].strip()
    # Replace non-alphanumeric (except . - _) with underscore
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean)
    # Collapse multiple underscores
    clean = re.sub(r"_+", "_", clean)
    return clean or "document"


def parse_uuid(val: Union[uuid.UUID, str], field_name: str = "ID") -> uuid.UUID:
    """Safely converts string to UUID or raises 400 Bad Request."""
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format: '{val}'. Expected valid UUID.",
        )


async def upload_document(
    db: AsyncSession,
    encounter_id: Union[uuid.UUID, str],
    file: UploadFile,
    document_type: Optional[str] = None,
    storage_service: Optional[StorageService] = None,
) -> Document:
    """Validates file, uploads raw bytes to MinIO, and creates PostgreSQL metadata row atomically.
    
    If MinIO upload succeeds but database commit fails, the MinIO object is deleted to prevent orphans.
    If MinIO upload fails, no database metadata is created.
    """
    enc_uuid = parse_uuid(encounter_id, "encounter_id")

    # 1. Validate encounter exists in database & resolve patient_id
    result = await db.execute(select(Encounter).where(Encounter.id == enc_uuid))
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{enc_uuid}' not found.",
        )

    patient_id = encounter.patient_id

    # 2. Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    # Normalize common content-type aliases
    if content_type.lower() == "image/jpg":
        content_type = "image/jpeg"

    allowed_types = [t.lower() for t in settings.ALLOWED_DOCUMENT_MIME_TYPES]
    if content_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types: {', '.join(settings.ALLOWED_DOCUMENT_MIME_TYPES)}",
        )

    # 3. Read bytes & validate size
    try:
        file_bytes = await file.read()
    except Exception as e:
        logger.error("Failed to read uploaded file stream: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file stream.",
        )

    file_size = len(file_bytes)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    max_bytes = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size of {settings.MAX_DOCUMENT_SIZE_MB}MB.",
        )

    # 4. Generate unique document UUID and collision-safe storage key
    doc_uuid = uuid.uuid4()
    original_filename = file.filename or "document.pdf"
    safe_name = sanitize_filename(original_filename)
    storage_key = f"documents/{patient_id}/{enc_uuid}/{doc_uuid}_{safe_name}"

    if storage_service is None:
        from app.services.storage import get_storage_service
        storage_service = get_storage_service()

    # 5. Upload actual binary bytes to MinIO
    try:
        storage_service.upload_raw(
            object_name=storage_key,
            data=io.BytesIO(file_bytes),
            length=file_size,
            content_type=content_type,
        )
    except Exception as upload_err:
        logger.error("MinIO object upload failed for %s: %s", storage_key, upload_err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store file in object storage: {str(upload_err)}",
        )

    # 6. Create PostgreSQL Document metadata record
    normalized_doc_type = document_type.strip().upper() if document_type and document_type.strip() else None
    document = Document(
        id=doc_uuid,
        patient_id=patient_id,
        encounter_id=enc_uuid,
        file_name=original_filename,
        content_type=content_type,
        file_size=file_size,
        storage_key=storage_key,
        document_type=normalized_doc_type,
        processing_status="UPLOADED",
    )
    db.add(document)

    # 7. Commit metadata; clean up MinIO on failure
    try:
        await db.commit()
        await db.refresh(document)
    except Exception as db_err:
        await db.rollback()
        logger.error("PostgreSQL metadata creation failed for document %s: %s. Cleaning up MinIO object...", doc_uuid, db_err)
        try:
            storage_service.delete_file(storage_key)
            logger.info("Successfully cleaned up orphan MinIO object %s after DB error.", storage_key)
        except Exception as cleanup_err:
            logger.error("Failed to delete orphan MinIO object %s: %s", storage_key, cleanup_err)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document metadata: {str(db_err)}",
        )

    return document


async def list_documents_by_encounter(
    db: AsyncSession,
    encounter_id: Union[uuid.UUID, str],
) -> List[Document]:
    """Retrieves document metadata records for a given encounter, sorted by uploaded_at ascending."""
    enc_uuid = parse_uuid(encounter_id, "encounter_id")

    # Validate encounter exists
    result = await db.execute(select(Encounter).where(Encounter.id == enc_uuid))
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{enc_uuid}' not found.",
        )

    stmt = select(Document).where(Document.encounter_id == enc_uuid).order_by(Document.uploaded_at.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_document_by_id(
    db: AsyncSession,
    document_id: Union[uuid.UUID, str],
) -> Document:
    """Retrieves a single document metadata record by its UUID."""
    doc_uuid = parse_uuid(document_id, "document_id")
    result = await db.execute(select(Document).where(Document.id == doc_uuid))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{doc_uuid}' not found.",
        )
    return document


async def generate_document_access_url(
    db: AsyncSession,
    document_id: Union[uuid.UUID, str],
    storage_service: Optional[StorageService] = None,
    expires_seconds: Optional[int] = None,
) -> DocumentPresignedUrlResponse:
    """Generates a secure short-lived MinIO presigned GET URL for an authorized doctor."""
    document = await get_document_by_id(db, document_id)

    if storage_service is None:
        from app.services.storage import get_storage_service
        storage_service = get_storage_service()

    exp = expires_seconds or settings.PRESIGNED_URL_EXPIRATION_SECONDS

    try:
        presigned_url = storage_service.get_document_url(
            object_name=document.storage_key,
            expires_seconds=exp,
        )
    except Exception as e:
        logger.error("Failed to generate presigned URL for storage key %s: %s", document.storage_key, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate secure document access URL: {str(e)}",
        )

    return DocumentPresignedUrlResponse(
        document_id=document.id,
        file_name=document.file_name,
        content_type=document.content_type,
        url=presigned_url,
        expires_in=exp,
    )


async def delete_document(
    db: AsyncSession,
    document_id: Union[uuid.UUID, str],
    storage_service: Optional[StorageService] = None,
) -> bool:
    """Deletes an object from MinIO and deletes its metadata row from PostgreSQL."""
    document = await get_document_by_id(db, document_id)

    if storage_service is None:
        from app.services.storage import get_storage_service
        storage_service = get_storage_service()

    # 1. Delete from MinIO first
    storage_service.delete_file(document.storage_key)

    # 2. Delete from PostgreSQL
    await db.delete(document)
    await db.commit()
    return True


async def attach_document_reference(
    db: AsyncSession,
    encounter_id: Union[uuid.UUID, str],
    storage_key: str,
    file_name: str,
    content_type: str,
    file_size: int,
    document_type: Optional[str] = None,
    bucket: Optional[str] = "kiosk-uploads",
) -> Document:
    """Registers an externally uploaded document (e.g. from Kiosk Upload Module) into Medikiosk.
    
    Persists document metadata in PostgreSQL linking it to the encounter and patient.
    Does NOT delete the MinIO object on error, ensuring idempotent retry.
    """
    enc_uuid = parse_uuid(encounter_id, "encounter_id")

    # 1. Validate encounter exists in database & resolve patient_id
    result = await db.execute(select(Encounter).where(Encounter.id == enc_uuid))
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{enc_uuid}' not found.",
        )

    patient_id = encounter.patient_id

    # 2. Normalize and construct storage reference
    clean_bucket = (bucket or "kiosk-uploads").strip()
    clean_key = storage_key.strip()
    if clean_bucket and not clean_key.startswith(f"{clean_bucket}/"):
        full_storage_key = f"{clean_bucket}/{clean_key}"
    else:
        full_storage_key = clean_key

    clean_name = sanitize_filename(file_name) if file_name else "uploaded_document"
    normalized_doc_type = document_type.strip().upper() if document_type and document_type.strip() else None

    # 3. Create Document record
    doc_uuid = uuid.uuid4()
    document = Document(
        id=doc_uuid,
        patient_id=patient_id,
        encounter_id=enc_uuid,
        file_name=clean_name,
        content_type=content_type or "application/octet-stream",
        file_size=file_size,
        storage_key=full_storage_key,
        document_type=normalized_doc_type,
        processing_status="UPLOADED",
    )
    db.add(document)

    try:
        await db.commit()
        await db.refresh(document)
    except Exception as db_err:
        await db.rollback()
        logger.error("PostgreSQL metadata creation failed during document attach: %s", db_err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to attach document metadata: {str(db_err)}",
        )

    logger.info("Successfully attached document %s to encounter %s (storage: %s)", doc_uuid, enc_uuid, full_storage_key)
    return document

