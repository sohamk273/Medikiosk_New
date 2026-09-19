"""Configuration settings for the Kiosk Document Upload Module."""
import json
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_NAME: str = "Kiosk Document Upload Module"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8010
    API_PREFIX: str = "/api/v1"

    # LAN Testing Configuration
    # Set LAN_HOST to your local Wi-Fi IPv4 address (e.g. "192.168.1.100") for physical phone testing
    LAN_HOST: Optional[str] = None
    FRONTEND_PORT: int = 5174

    # Base URL for QR code generation (points to the mobile web upload page)
    # If not explicitly set, automatically computed from LAN_HOST or localhost
    PUBLIC_WEB_URL: Optional[str] = None

    @property
    def resolved_public_web_url(self) -> str:
        """Returns the public web base URL for generating QR code upload links."""
        if self.PUBLIC_WEB_URL and self.PUBLIC_WEB_URL.strip():
            return self.PUBLIC_WEB_URL.rstrip("/")
        if self.LAN_HOST and self.LAN_HOST.strip():
            return f"http://{self.LAN_HOST.strip()}:{self.FRONTEND_PORT}"
        return f"http://localhost:{self.FRONTEND_PORT}"

    # Database: default to SQLite for zero-dependency standalone operation,
    # switchable to PostgreSQL (e.g. postgresql+asyncpg://...) in production
    DATABASE_URL: str = "sqlite+aiosqlite:///./kiosk_upload.db"

    # MinIO Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_PUBLIC_ENDPOINT: Optional[str] = None
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"
    MINIO_BUCKET: str = "kiosk-uploads"
    MINIO_SECURE: bool = False

    # Session & Upload Defaults
    DEFAULT_SESSION_TTL_SECONDS: int = 600  # 10 minutes
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
    ]

    # CORS
    CORS_ALLOWED_ORIGINS: Union[List[str], str] = ["*"]

    @property
    def resolved_cors_origins(self) -> List[str]:
        """Resolves allowed CORS origins including localhost and configured LAN host."""
        origins: List[str] = []
        if isinstance(self.CORS_ALLOWED_ORIGINS, list):
            origins.extend(self.CORS_ALLOWED_ORIGINS)
        elif isinstance(self.CORS_ALLOWED_ORIGINS, str) and self.CORS_ALLOWED_ORIGINS != "*":
            origins.append(self.CORS_ALLOWED_ORIGINS)

        origins.extend([
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            f"http://localhost:{self.PORT}",
            f"http://127.0.0.1:{self.PORT}",
        ])
        if self.LAN_HOST and self.LAN_HOST.strip():
            host = self.LAN_HOST.strip()
            origins.append(f"http://{host}:{self.FRONTEND_PORT}")
            origins.append(f"http://{host}:{self.PORT}")
        return list(dict.fromkeys(origins))

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]


settings = Settings()
