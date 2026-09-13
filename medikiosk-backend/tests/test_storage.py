"""Unit tests for storage provider abstraction and storage service."""
import io
from app.providers.storage.minio import MinIOStorageProvider
from app.services.storage import StorageService
from tests.conftest import FakeStorageProvider


def test_minio_storage_provider_initialization():
    """Verifies MinIOStorageProvider initializes with configured settings."""
    provider = MinIOStorageProvider(
        endpoint="localhost:9000",
        access_key="testkey",
        secret_key="testsecret",
        secure=False,
        default_bucket="test-bucket",
    )
    assert provider.endpoint == "localhost:9000"
    assert provider.default_bucket == "test-bucket"


def test_storage_service_document_upload():
    """Verifies StorageService coordinates file upload and key generation."""
    fake_provider = FakeStorageProvider(healthy=True)
    service = StorageService(provider=fake_provider)

    dummy_content = b"%PDF-1.4 Mock Clinical Prescription"
    stream = io.BytesIO(dummy_content)

    key = service.upload_document(
        case_id="MEDI-OPD-2026-00042",
        filename="rx_01.pdf",
        data=stream,
        length=len(dummy_content),
        content_type="application/pdf",
    )

    assert "cases/MEDI-OPD-2026-00042/documents/rx_01.pdf" in key

    # Test download from provider
    downloaded = fake_provider.download_file("cases/MEDI-OPD-2026-00042/documents/rx_01.pdf")
    assert downloaded == dummy_content


def test_storage_service_audio_upload():
    """Verifies StorageService stores patient voice intake files under standardized paths."""
    fake_provider = FakeStorageProvider(healthy=True)
    service = StorageService(provider=fake_provider)

    audio_bytes = b"RIFF-WAVE-MOCK-AUDIO-DATA"
    stream = io.BytesIO(audio_bytes)

    key = service.upload_audio(
        case_id="MEDI-OPD-2026-00042",
        question_id="q1_chief_complaint",
        data=stream,
        length=len(audio_bytes),
        content_type="audio/webm",
    )

    assert "cases/MEDI-OPD-2026-00042/audio/q1_chief_complaint.webm" in key


def test_storage_service_presigned_url():
    """Verifies presigned URL generation."""
    fake_provider = FakeStorageProvider(healthy=True)
    service = StorageService(provider=fake_provider)

    url = service.get_document_url("cases/ENC-01/documents/doc.pdf", expires_seconds=600)
    assert "expires=600" in url
    assert "doc.pdf" in url


def test_storage_service_health_check():
    """Verifies storage health inspection reflects provider state."""
    healthy_service = StorageService(provider=FakeStorageProvider(healthy=True))
    assert healthy_service.check_health() is True

    unhealthy_service = StorageService(provider=FakeStorageProvider(healthy=False))
    assert unhealthy_service.check_health() is False
