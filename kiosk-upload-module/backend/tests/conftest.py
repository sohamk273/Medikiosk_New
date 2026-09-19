"""Pytest fixtures for standalone Kiosk Document Upload backend tests."""
import asyncio
from typing import AsyncGenerator, BinaryIO, Optional
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.storage.base import StorageProvider
from app.storage.minio_provider import get_storage_provider


class InMemoryStorageProvider(StorageProvider):
    """Deterministic in-memory storage provider for automated unit tests."""

    def __init__(self):
        self.objects = {}  # (bucket, key) -> bytes

    def upload_stream(
        self,
        object_key: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
        bucket: Optional[str] = None,
    ) -> str:
        b = bucket or "kiosk-uploads"
        self.objects[(b, object_key)] = data.read()
        return object_key

    def download_bytes(self, object_key: str, bucket: Optional[str] = None) -> bytes:
        b = bucket or "kiosk-uploads"
        if (b, object_key) not in self.objects:
            raise Exception("Object not found")
        return self.objects[(b, object_key)]

    def delete_object(self, object_key: str, bucket: Optional[str] = None) -> bool:
        b = bucket or "kiosk-uploads"
        if (b, object_key) in self.objects:
            del self.objects[(b, object_key)]
            return True
        return False

    def get_presigned_url(self, object_key: str, expires_seconds: int = 900, bucket: Optional[str] = None) -> str:
        b = bucket or "kiosk-uploads"
        return f"http://mock-minio/{b}/{object_key}?token=mock_signature"

    def ensure_bucket_exists(self, bucket: Optional[str] = None) -> bool:
        return True

    def is_healthy(self) -> bool:
        return True


@pytest.fixture
async def test_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides an isolated in-memory SQLite database session for each test."""
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture
def mock_storage() -> InMemoryStorageProvider:
    return InMemoryStorageProvider()


@pytest.fixture
async def client(test_db_session: AsyncSession, mock_storage: InMemoryStorageProvider) -> AsyncGenerator[AsyncClient, None]:
    """Configures test HTTP client with in-memory DB and storage overrides."""
    async def override_get_db():
        yield test_db_session

    def override_get_storage():
        return mock_storage

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_storage_provider] = override_get_storage

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c

    app.dependency_overrides.clear()
