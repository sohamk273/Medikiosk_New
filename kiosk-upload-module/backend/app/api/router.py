"""API router aggregation."""
from fastapi import APIRouter
from app.api.kiosk import router as kiosk_router
from app.api.mobile import router as mobile_router
from app.api.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(kiosk_router)
api_router.include_router(mobile_router)
