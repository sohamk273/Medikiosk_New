"""Test fixtures and test database configuration."""
import os
import io
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Force testing environment
os.environ["APP_ENV"] = "testing"
os.environ["DEBUG"] = "true"

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app
from app.providers.storage.base import StorageProvider
from app.services.storage import StorageService, get_storage_service
import app.models as _models_registry  # Register models without shadowing fastapi_app


# In-memory SQLite async engine for isolated fast testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class FakeStorageProvider(StorageProvider):
    """In-memory mock storage provider for unit testing without live MinIO."""

    def __init__(self, healthy: bool = True):
        self._storage: dict[str, bytes] = {}
        self._healthy = healthy

    def upload_file(self, object_name: str, data: io.BytesIO, length: int, content_type: str = "application/octet-stream", bucket_name: str = None) -> str:
        content = data.read()
        self._storage[object_name] = content
        return f"test-bucket/{object_name}"

    def download_file(self, object_name: str, bucket_name: str = None) -> bytes:
        if object_name not in self._storage:
            raise FileNotFoundError(f"Object {object_name} not found")
        return self._storage[object_name]

    def delete_file(self, object_name: str, bucket_name: str = None) -> bool:
        if object_name in self._storage:
            del self._storage[object_name]
            return True
        return False

    def get_presigned_url(self, object_name: str, expires_seconds: int = 900, bucket_name: str = None) -> str:
        return f"http://localhost:9000/test-bucket/{object_name}?expires={expires_seconds}"

    def ensure_bucket_exists(self, bucket_name: str = None) -> bool:
        return self._healthy

    def is_healthy(self) -> bool:
        return self._healthy


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a clean database session per test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def fake_storage() -> FakeStorageProvider:
    """Provides a fresh fake storage provider."""
    return FakeStorageProvider()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, fake_storage: FakeStorageProvider) -> AsyncGenerator[AsyncClient, None]:
    """Test client with overridden database and storage dependencies."""
    async def override_get_db():
        yield db_session

    def override_get_storage():
        return StorageService(provider=fake_storage)

    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[get_storage_service] = override_get_storage

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()
