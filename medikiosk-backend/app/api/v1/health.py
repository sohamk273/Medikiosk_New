"""Health and readiness check endpoints."""
import time
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app import __version__
from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.schemas.health import HealthResponse, ReadinessResponse, ComponentStatus
from app.services.storage import StorageService, get_storage_service

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Liveness probe",
)
async def liveness_check() -> HealthResponse:
    """Basic liveness check verifying the application process is running."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version=__version__,
        environment=settings.APP_ENV,
    )


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    summary="Readiness probe",
)
async def readiness_check(
    response: Response,
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
) -> ReadinessResponse:
    """Deep readiness probe verifying database and object storage infrastructure."""
    components = {}
    is_ready = True

    # 1. Database Check
    db_start = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        db_latency = round((time.perf_counter() - db_start) * 1000, 2)
        components["database"] = ComponentStatus(
            status="healthy",
            latency_ms=db_latency,
            details={"type": "PostgreSQL"},
        )
    except Exception as e:
        logger.error("Readiness check: Database connection failed: %s", e)
        is_ready = False
        components["database"] = ComponentStatus(
            status="unhealthy",
            details={"error": "Database connection unavailable"},
        )

    # 2. Object Storage (MinIO) Check
    storage_start = time.perf_counter()
    try:
        storage_ok = storage.check_health()
        storage_latency = round((time.perf_counter() - storage_start) * 1000, 2)
        if storage_ok:
            components["storage"] = ComponentStatus(
                status="healthy",
                latency_ms=storage_latency,
                details={"provider": "MinIO", "bucket": settings.MINIO_BUCKET},
            )
        else:
            components["storage"] = ComponentStatus(
                status="unhealthy",
                details={"error": "Storage provider health check returned false"},
            )
            # In MediKiosk, degraded storage still allows core queueing, but readiness flags it
            is_ready = False
    except Exception as e:
        logger.error("Readiness check: Storage check failed: %s", e)
        is_ready = False
        components["storage"] = ComponentStatus(
            status="unhealthy",
            details={"error": "Storage service unreachable"},
        )

    overall_status = "ready" if is_ready else "not_ready"
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessResponse(
        status=overall_status,
        components=components,
    )
