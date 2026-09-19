import io
import re
import uuid
from typing import List, Optional, Union
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.document import Document
from app.models.encounter import Encounter
from app.schemas.document import DocumentPresignedUrlResponse
from app.services.storage import StorageService
from app.services.audit.audit_service import log_audit_event


def sanitize_filename(filename: str) -> str:
    """Sanitizes user-provided filename to prevent directory traversal or unsafe characters."""
    clean = filename.replace("\\", "/").split("/")[-1].strip()
    clean = re.sub(r"[^\w\.\-\_]", "_", clean)
    return clean or "unnamed_document"


def _parse_uuid(val: Union[uuid.UUID, str]) -> Optional[uuid.UUID]:
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except (ValueError, AttributeError):
        return None


async def upload_document(
    db: AsyncSession,
    encounter_id: Union[uuid.UUID, str],
    file: UploadFile,
    document_type: Optional[str] = None,
    storage_service: Optional[StorageService] = None,
) -> Document:
    """Validates, stores in MinIO, and persists document metadata in PostgreSQL."""
    parsed_enc_uuid = _parse_uuid(encounter_id)
    if parsed_enc_uuid:
        condition = Encounter.id == parsed_enc_uuid
    else:
        condition = Encounter.encounter_number == str(encounter_id)

    enc_query = select(Encounter).where(condition)
    enc_res = await db.execute(enc_query)
    encounter = enc_res.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    # Read and validate payload size
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file cannot be empty",
        )

    max_size_bytes = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_DOCUMENT_SIZE_MB}MB",
        )

    # Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in settings.ALLOWED_DOCUMENT_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types: {settings.ALLOWED_DOCUMENT_MIME_TYPES}",
        )

    safe_filename = sanitize_filename(file.filename or "document")
    doc_id = uuid.uuid4()
    patient_id = encounter.patient_id

    storage_key = f"documents/{patient_id}/{encounter.id}/{doc_id}_{safe_filename}"

    if storage_service:
        try:
            storage_service.upload_raw(
                object_name=storage_key,
                data=io.BytesIO(content),
                length=file_size,
                content_type=content_type,
            )
        except Exception as err:
            logger.error("Failed to upload document to storage provider: %s", err)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Storage upload failed: {str(err)}",
            )

    # Persist in DB
    document = Document(
        id=doc_id,
        patient_id=patient_id,
        encounter_id=encounter.id,
        file_name=safe_filename,
        content_type=content_type,
        file_size=file_size,
        storage_key=storage_key,
        document_type=document_type or "OTHER",
        processing_status="UPLOADED",
    )
    db.add(document)
    await db.flush()

    await log_audit_event(
        db=db,
        action="DOCUMENT_UPLOADED",
        entity_type="DOCUMENT",
        entity_id=str(document.id),
        encounter_id=encounter.id,
        patient_id=patient_id,
        details={"file_name": safe_filename, "content_type": content_type, "file_size": file_size},
    )

    try:
        await db.commit()
        await db.refresh(document)
        return document
    except HTTPException:
        raise
    except Exception as commit_err:
        if storage_service:
            try:
                storage_service.delete_file(storage_key)
            except Exception:
                pass
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during document upload: {str(commit_err)}",
        )


async def attach_document_reference(
    db: AsyncSession,
    encounter_id: Union[uuid.UUID, str],
    file_name: str,
    content_type: str,
    file_size: int,
    storage_key: str,
    document_type: Optional[str] = "OTHER",
) -> Document:
    """Attaches a previously uploaded document (e.g. from QR mobile session) to the encounter."""
    parsed_enc_uuid = _parse_uuid(encounter_id)
    if parsed_enc_uuid:
        condition = Encounter.id == parsed_enc_uuid
    else:
        condition = Encounter.encounter_number == str(encounter_id)

    enc_query = select(Encounter).where(condition)
    enc_res = await db.execute(enc_query)
    encounter = enc_res.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    # Basic validations
    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be greater than 0",
        )

    max_size_bytes = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_DOCUMENT_SIZE_MB}MB",
        )

    if content_type not in settings.ALLOWED_DOCUMENT_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types: {settings.ALLOWED_DOCUMENT_MIME_TYPES}",
        )

    safe_filename = sanitize_filename(file_name)
    doc_id = uuid.uuid4()
    patient_id = encounter.patient_id

    document = Document(
        id=doc_id,
        patient_id=patient_id,
        encounter_id=encounter.id,
        file_name=safe_filename,
        content_type=content_type,
        file_size=file_size,
        storage_key=storage_key,
        document_type=document_type or "OTHER",
        processing_status="UPLOADED",
    )
    db.add(document)
    await db.flush()

    await log_audit_event(
        db=db,
        action="DOCUMENT_ATTACHED",
        entity_type="DOCUMENT",
        entity_id=str(document.id),
        encounter_id=encounter.id,
        patient_id=patient_id,
        details={
            "file_name": safe_filename,
            "content_type": content_type,
            "file_size": file_size,
            "storage_key": storage_key,
            "source": "QR_MOBILE_UPLOAD",
        },
    )

    try:
        await db.commit()
        await db.refresh(document)
        return document
    except Exception as commit_err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during document attach: {str(commit_err)}",
        )


async def list_documents_by_encounter(
    db: AsyncSession,
    encounter_id: Union[uuid.UUID, str],
) -> List[Document]:
    """Retrieves all document metadata records associated with an encounter."""
    parsed_enc_uuid = _parse_uuid(encounter_id)
    if parsed_enc_uuid:
        condition = Encounter.id == parsed_enc_uuid
    else:
        condition = Encounter.encounter_number == str(encounter_id)

    enc_query = select(Encounter).where(condition)
    enc_res = await db.execute(enc_query)
    encounter = enc_res.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    query = select(Document).where(Document.encounter_id == encounter.id).order_by(Document.uploaded_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def generate_document_access_url(
    db: AsyncSession,
    document_id: Union[uuid.UUID, str],
    storage_service: StorageService,
    expiry_seconds: int = 3600,
) -> DocumentPresignedUrlResponse:
    """Generates a secure presigned download URL for a medical document."""
    parsed_id = _parse_uuid(document_id)
    if not parsed_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )

    query = select(Document).where(Document.id == parsed_id)
    result = await db.execute(query)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )

    try:
        url = storage_service.get_document_url(
            object_name=document.storage_key,
            expires_seconds=expiry_seconds,
        )
    except Exception as err:
        logger.error("Presigned URL generation error: %s", err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate access URL: {str(err)}",
        )

    return DocumentPresignedUrlResponse(
        document_id=document.id,
        file_name=document.file_name,
        content_type=document.content_type,
        url=url,
        expires_in=expiry_seconds,
    )


generate_presigned_url = generate_document_access_url


async def delete_document(
    db: AsyncSession,
    document_id: Union[uuid.UUID, str],
    storage_service: Optional[StorageService] = None,
) -> bool:
    """Deletes a document record from PostgreSQL and object storage."""
    parsed_id = _parse_uuid(document_id)
    if not parsed_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )

    query = select(Document).where(Document.id == parsed_id)
    result = await db.execute(query)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )

    if storage_service:
        try:
            storage_service.delete_file(document.storage_key)
        except Exception as err:
            logger.warning(f"Storage deletion warning for '{document.storage_key}': {err}")

    await db.delete(document)
    await db.commit()
    return True
