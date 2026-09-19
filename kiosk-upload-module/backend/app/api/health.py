"""Health check and readiness endpoints."""
from fastapi import APIRouter, Depends
from app.config import settings
from app.storage.base import StorageProvider
from app.storage.minio_provider import get_storage_provider

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Service health and storage probe")
async def health_check(
    storage: StorageProvider = Depends(get_storage_provider),
):
    storage_ok = storage.is_healthy()
    return {
        "status": "ok" if storage_ok else "degraded",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "storage": {
            "connected": storage_ok,
            "provider": "MinIO",
            "bucket": settings.MINIO_BUCKET,
        },
    }
