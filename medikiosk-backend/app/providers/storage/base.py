"""Abstract StorageProvider interface for binary object storage."""
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageProvider(ABC):
    """Abstract interface for object storage (MinIO, S3, Azure Blob, etc.)."""

    @abstractmethod
    def upload_file(
        self,
        object_name: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
        bucket_name: Optional[str] = None,
    ) -> str:
        """Uploads a file stream to object storage and returns the object key/path."""
        pass

    @abstractmethod
    def download_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None,
    ) -> bytes:
        """Downloads an object from storage and returns raw bytes."""
        pass

    @abstractmethod
    def delete_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None,
    ) -> bool:
        """Deletes an object from storage."""
        pass

    @abstractmethod
    def get_presigned_url(
        self,
        object_name: str,
        expires_seconds: int = 900,
        bucket_name: Optional[str] = None,
    ) -> str:
        """Generates a time-limited secure URL for direct read access."""
        pass

    @abstractmethod
    def ensure_bucket_exists(
        self,
        bucket_name: Optional[str] = None,
    ) -> bool:
        """Verifies that the target private bucket exists or creates it."""
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """Checks connectivity and service health of the storage provider."""
        pass
