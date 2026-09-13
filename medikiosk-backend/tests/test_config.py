"""Unit tests for configuration loading and validation."""
from app.core.config import Settings


def test_default_config():
    """Verifies default settings load with expected attributes."""
    conf = Settings()
    assert conf.APP_NAME == "MediKiosk Core API"
    assert "postgresql" in conf.DATABASE_URL
    assert conf.MINIO_BUCKET == "medikiosk-documents"
    assert conf.MINIO_SECURE is False
    assert len(conf.CORS_ALLOWED_ORIGINS) >= 1


def test_cors_parsing_from_string():
    """Verifies CORS origins can be parsed from comma-separated string."""
    conf = Settings(CORS_ALLOWED_ORIGINS="http://localhost:5173, http://example.com")
    assert "http://localhost:5173" in conf.CORS_ALLOWED_ORIGINS
    assert "http://example.com" in conf.CORS_ALLOWED_ORIGINS
    assert len(conf.CORS_ALLOWED_ORIGINS) == 2


def test_cors_parsing_from_json():
    """Verifies CORS origins can be parsed from JSON array string."""
    conf = Settings(CORS_ALLOWED_ORIGINS='["http://custom-origin.org"]')
    assert conf.CORS_ALLOWED_ORIGINS == ["http://custom-origin.org"]
