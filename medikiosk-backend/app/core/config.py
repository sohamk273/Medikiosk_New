"""Application configuration loaded from environment variables."""
import json
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """MediKiosk Backend Settings."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_NAME: str = "MediKiosk Core API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    POSTGRES_PORT: int = 5433
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5433/medikiosk"
    DATABASE_URL_SYNC: str = "postgresql+psycopg://postgres:postgrespassword@localhost:5433/medikiosk"

    # Security & JWT
    JWT_SECRET_KEY: str = "medikiosk-development-super-secret-key-for-jwt-signing-2026-sih"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # MinIO Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"
    MINIO_BUCKET: str = "medikiosk-documents"
    MINIO_SECURE: bool = False

    # Document Upload & Storage Settings
    MAX_DOCUMENT_SIZE_MB: int = 10
    ALLOWED_DOCUMENT_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    ]
    PRESIGNED_URL_EXPIRATION_SECONDS: int = 900  # 15 minutes

    # Speech Recognition & Audio Ingestion Settings
    MAX_AUDIO_SIZE_MB: int = 10
    ALLOWED_AUDIO_MIME_TYPES: List[str] = [
        "audio/wav",
        "audio/x-wav",
        "audio/webm",
        "audio/ogg",
        "audio/mp3",
        "audio/mpeg",
        "audio/mp4",
        "audio/x-m4a",
    ]
    SUPPORTED_SPEECH_LANGUAGES: List[str] = ["en", "hi", "mr"]

    # Provider Toggles (Stage 7)
    SPEECH_PROVIDER: str = "mock"  # "mock" or "bhashini"
    AI_PROVIDER: str = "mock"      # "mock" or "gemini"

    # Bhashini Speech & Language Integration (Stage 2 & Stage 7)
    BHASHINI_USER_ID: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_PIPELINE_ID: str = ""
    BHASHINI_INFERENCE_URL: str = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    BHASHINI_ASR_TIMEOUT_SECONDS: float = 15.0
    ENABLE_LIVE_BHASHINI: bool = False

    # Clinical LLM Intelligence Integration (Stage 1 & Stage 7)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_TIMEOUT_SECONDS: float = 20.0
    LLM_API_KEY: str = ""
    LLM_PROVIDER: str = "gemini"
    ENABLE_LIVE_LLM: bool = False

    @property
    def is_bhashini_enabled(self) -> bool:
        """Returns True if Bhashini speech provider is explicitly selected or enabled."""
        return self.SPEECH_PROVIDER.lower() == "bhashini" or self.ENABLE_LIVE_BHASHINI

    @property
    def is_gemini_enabled(self) -> bool:
        """Returns True if Gemini LLM provider is explicitly selected or enabled."""
        return self.AI_PROVIDER.lower() == "gemini" or self.ENABLE_LIVE_LLM

    @property
    def effective_gemini_key(self) -> str:
        """Returns active Gemini API key from GEMINI_API_KEY or legacy LLM_API_KEY."""
        return self.GEMINI_API_KEY.strip() or self.LLM_API_KEY.strip()

    # CORS configuration
    CORS_ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [i.strip() for i in v_str.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []


settings = Settings()
