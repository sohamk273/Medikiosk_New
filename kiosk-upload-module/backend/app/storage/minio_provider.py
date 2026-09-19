"""MinIO implementation of StorageProvider."""
from datetime import timedelta
import logging
from typing import BinaryIO, Optional
from minio import Minio
from minio.error import S3Error

from app.config import settings
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)


class MinIOStorageProvider(StorageProvider):
    """MinIO-backed object storage implementation."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        secure: Optional[bool] = None,
        default_bucket: Optional[str] = None,
        client: Optional[Minio] = None,
    ):
        self.endpoint = endpoint or settings.MINIO_ENDPOINT
        self.access_key = access_key or settings.MINIO_ACCESS_KEY
        self.secret_key = secret_key or settings.MINIO_SECRET_KEY
        self.secure = secure if secure is not None else settings.MINIO_SECURE
        self.default_bucket = default_bucket or settings.MINIO_BUCKET

        if client:
            self._client = client
        else:
            self._client = Minio(
                endpoint=self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure,
            )

    def _resolve_bucket(self, bucket: Optional[str]) -> str:
        return bucket or self.default_bucket

    def ensure_bucket_exists(self, bucket: Optional[str] = None) -> bool:
        target = self._resolve_bucket(bucket)
        try:
            if not self._client.bucket_exists(target):
                self._client.make_bucket(target)
                logger.info("Created MinIO bucket: %s", target)
            return True
        except Exception as e:
            logger.error("Failed to check/create bucket %s: %s", target, e)
            return False

    def upload_stream(
        self,
        object_key: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
        bucket: Optional[str] = None,
    ) -> str:
        target = self._resolve_bucket(bucket)
        self.ensure_bucket_exists(target)
        try:
            self._client.put_object(
                bucket_name=target,
                object_name=object_key,
                data=data,
                length=length,
                content_type=content_type,
            )
            return object_key
        except S3Error as e:
            logger.error("MinIO S3 error uploading %s: %s", object_key, e)
            raise
        except Exception as e:
            logger.error("Unexpected error uploading %s: %s", object_key, e)
            raise

    def download_bytes(
        self,
        object_key: str,
        bucket: Optional[str] = None,
    ) -> bytes:
        target = self._resolve_bucket(bucket)
        response = None
        try:
            response = self._client.get_object(target, object_key)
            return response.read()
        except S3Error as e:
            logger.error("MinIO S3 error downloading %s: %s", object_key, e)
            raise
        finally:
            if response:
                response.close()
                response.release_conn()

    def delete_object(
        self,
        object_key: str,
        bucket: Optional[str] = None,
    ) -> bool:
        target = self._resolve_bucket(bucket)
        try:
            self._client.remove_object(target, object_key)
            return True
        except Exception as e:
            logger.error("Failed to delete MinIO object %s: %s", object_key, e)
            return False

    def get_presigned_url(
        self,
        object_key: str,
        expires_seconds: int = 900,
        bucket: Optional[str] = None,
    ) -> str:
        target = self._resolve_bucket(bucket)
        try:
            return self._client.presigned_get_object(
                bucket_name=target,
                object_name=object_key,
                expires=timedelta(seconds=expires_seconds),
            )
        except Exception as e:
            logger.error("Failed generating presigned URL for %s: %s", object_key, e)
            raise

    def is_healthy(self) -> bool:
        try:
            self._client.list_buckets()
            return True
        except Exception as e:
            logger.warning("MinIO health probe failed: %s", e)
            return False


# Global default instance and FastAPI dependency helper
default_storage_provider = MinIOStorageProvider()


def get_storage_provider() -> StorageProvider:
    """Dependency provider for FastAPI routes."""
    return default_storage_provider
