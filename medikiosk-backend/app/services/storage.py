"""Storage service managing binary file interactions."""
from typing import BinaryIO, Optional
from app.providers.storage.base import StorageProvider
from app.providers.storage.minio import MinIOStorageProvider


class StorageService:
    """High-level service coordinating object storage operations."""

    def __init__(self, provider: Optional[StorageProvider] = None):
        self.provider = provider or MinIOStorageProvider()

    def upload_raw(
        self,
        object_name: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Uploads raw bytes to a specific storage key."""
        return self.provider.upload_file(
            object_name=object_name,
            data=data,
            length=length,
            content_type=content_type,
        )

    def delete_file(self, object_name: str) -> bool:
        """Deletes an object by its storage key."""
        return self.provider.delete_file(object_name=object_name)

    def upload_document(
        self,
        case_id: str,
        filename: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/pdf",
    ) -> str:
        """Uploads a clinical document under a standardized case folder key."""
        object_name = f"cases/{case_id}/documents/{filename}"
        return self.provider.upload_file(
            object_name=object_name,
            data=data,
            length=length,
            content_type=content_type,
        )

    def upload_audio(
        self,
        case_id: str,
        question_id: str,
        data: BinaryIO,
        length: int,
        content_type: str = "audio/webm",
    ) -> str:
        """Uploads patient voice intake audio."""
        object_name = f"cases/{case_id}/audio/{question_id}.webm"
        return self.provider.upload_file(
            object_name=object_name,
            data=data,
            length=length,
            content_type=content_type,
        )

    def get_document_url(self, object_name: str, expires_seconds: int = 900) -> str:
        """Generates a secure temporary download/preview URL."""
        return self.provider.get_presigned_url(object_name, expires_seconds=expires_seconds)

    def check_health(self) -> bool:
        """Returns True if the underlying storage provider is operational."""
        return self.provider.is_healthy()


# Global default instance for dependency injection
default_storage_service = StorageService()


def get_storage_service() -> StorageService:
    """Dependency provider for FastAPI route handlers."""
    return default_storage_service
