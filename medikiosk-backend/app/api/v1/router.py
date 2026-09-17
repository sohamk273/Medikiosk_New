"""API v1 router aggregator."""
from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.encounters import router as encounters_router
from app.api.v1.queue import router as queue_router
from app.api.v1.documents import router as documents_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(encounters_router)
api_v1_router.include_router(queue_router)
api_v1_router.include_router(documents_router)
