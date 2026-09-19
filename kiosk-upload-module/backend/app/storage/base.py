"""Abstract StorageProvider interface for binary file storage."""
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageProvider(ABC):
    """Abstract interface for object storage (MinIO, S3, Azure Blob, etc.)."""

    @abstractmethod
    def upload_stream(
        self,
        object_key: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
        bucket: Optional[str] = None,
    ) -> str:
        """Uploads a binary stream to object storage and returns the object key."""
        pass

    @abstractmethod
    def download_bytes(
        self,
        object_key: str,
        bucket: Optional[str] = None,
    ) -> bytes:
        """Downloads raw bytes from storage."""
        pass

    @abstractmethod
    def delete_object(
        self,
        object_key: str,
        bucket: Optional[str] = None,
    ) -> bool:
        """Deletes an object from storage."""
        pass

    @abstractmethod
    def get_presigned_url(
        self,
        object_key: str,
        expires_seconds: int = 900,
        bucket: Optional[str] = None,
    ) -> str:
        """Generates a temporary view URL."""
        pass

    @abstractmethod
    def ensure_bucket_exists(
        self,
        bucket: Optional[str] = None,
    ) -> bool:
        """Verifies that the target bucket exists or creates it."""
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """Checks connectivity and operational health of storage."""
        pass
