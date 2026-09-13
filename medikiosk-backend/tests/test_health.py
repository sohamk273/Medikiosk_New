"""Integration tests for health and readiness endpoints."""
import pytest
from httpx import AsyncClient
from app.main import app as fastapi_app
from app.services.storage import StorageService, get_storage_service
from tests.conftest import FakeStorageProvider


@pytest.mark.asyncio
async def test_liveness_check(client: AsyncClient):
    """Verifies GET /health returns 200 OK and valid metadata."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "MediKiosk" in data["app"]
    assert "environment" in data


@pytest.mark.asyncio
async def test_v1_liveness_check(client: AsyncClient):
    """Verifies GET /api/v1/health returns 200 OK."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_readiness_check_healthy(client: AsyncClient):
    """Verifies GET /health/ready returns 200 OK when database and storage are healthy."""
    response = await client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["components"]["database"]["status"] == "healthy"
    assert data["components"]["storage"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_readiness_check_unhealthy_storage(client: AsyncClient):
    """Verifies GET /health/ready returns 503 Service Unavailable when a component fails."""
    # Override storage service with an unhealthy provider
    unhealthy_storage = StorageService(provider=FakeStorageProvider(healthy=False))
    fastapi_app.dependency_overrides[get_storage_service] = lambda: unhealthy_storage

    response = await client.get("/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "not_ready"
    assert data["components"]["storage"]["status"] == "unhealthy"

    # Clean up override
    del fastapi_app.dependency_overrides[get_storage_service]
