"""Document access and management endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.document import DocumentPresignedUrlResponse
from app.services.auth.auth_service import require_role
from app.services.document.document_service import (
    generate_document_access_url,
    delete_document,
)
from app.services.storage import StorageService, get_storage_service

router = APIRouter(prefix="/documents", tags=["Documents"])

DOCTOR_ROLES = [UserRole.DOCTOR, UserRole.AYUSH_DOCTOR, UserRole.HOSPITAL_ADMIN]


@router.get(
    "/{document_id}/url",
    response_model=DocumentPresignedUrlResponse,
    summary="Generate a short-lived presigned URL to view/download document",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def get_document_url(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
) -> DocumentPresignedUrlResponse:
    """Generates a secure, temporary MinIO presigned URL for an authenticated doctor.
    Never exposes raw MinIO credentials or makes storage public.
    """
    return await generate_document_access_url(db, document_id, storage_service=storage)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document from storage and metadata",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def remove_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
):
    """Deletes the underlying binary object from MinIO and deletes metadata from PostgreSQL."""
    await delete_document(db, document_id, storage_service=storage)
    return None
