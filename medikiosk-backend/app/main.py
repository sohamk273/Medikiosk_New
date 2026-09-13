"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.core.config import settings
from app.core.logging import logger
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as root_health_router
from app.services.storage import default_storage_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    logger.info("Starting %s v%s in %s environment", settings.APP_NAME, __version__, settings.APP_ENV)

    # Initialize MinIO bucket if storage provider is reachable
    try:
        bucket_ok = default_storage_service.provider.ensure_bucket_exists()
        if bucket_ok:
            logger.info("Storage bucket verification successful: %s", settings.MINIO_BUCKET)
        else:
            logger.warning("Storage bucket verification failed or MinIO is offline. Core APIs will remain operational.")
    except Exception as e:
        logger.warning("MinIO initialization error (non-fatal): %s", e)

    yield

    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    """Creates and configures the FastAPI application instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=__version__,
        description="MediKiosk Core Backend API for Patient Intake, OPD Triage, and Doctor EMR.",
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount root health endpoints (standard probes)
    app.include_router(root_health_router)

    # Mount v1 API endpoints
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
