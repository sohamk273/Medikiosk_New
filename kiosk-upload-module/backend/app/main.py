"""Main entry point for the Kiosk Document Upload FastAPI backend."""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database import init_db
from app.storage.minio_provider import default_storage_provider

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kiosk_upload")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes tables and ensures MinIO bucket exists on startup."""
    logger.info("Initializing %s...", settings.APP_NAME)
    # 1. Initialize SQLite / PostgreSQL tables
    await init_db()
    logger.info("Database tables verified.")

    # 2. Verify / create MinIO bucket
    default_storage_provider.ensure_bucket_exists()
    logger.info("MinIO bucket '%s' verified.", settings.MINIO_BUCKET)

    yield

    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description="Standalone, decoupled service for kiosk document & photo acquisition via mobile phone.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS with resolved origins and LAN regex pattern
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.resolved_cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "operational",
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
