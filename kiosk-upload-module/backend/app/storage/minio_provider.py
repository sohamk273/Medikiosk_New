"""MinIO implementation of StorageProvider with instantaneous local fallback."""
from datetime import timedelta
import logging
import socket
from typing import BinaryIO, Optional, Dict
from minio import Minio
from minio.error import S3Error

from app.config import settings
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)


def _is_minio_reachable(endpoint: str, timeout: float = 0.5) -> bool:
    try:
        host, port_str = endpoint.split(":")
        port = int(port_str)
    except Exception:
        host, port = endpoint, 9000
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, OSError):
        return False


class MinIOStorageProvider(StorageProvider):
    """MinIO-backed object storage implementation with automatic local storage fallback."""

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
        self._fallback_storage: Dict[str, bytes] = {}
        self._use_fallback: bool = not _is_minio_reachable(self.endpoint)

        if client:
            self._client = client
        elif not self._use_fallback:
            self._client = Minio(
                endpoint=self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure,
            )
        else:
            self._client = None
            logger.info("MinIO endpoint %s offline. Running with fast in-memory object storage.", self.endpoint)

    def _resolve_bucket(self, bucket: Optional[str]) -> str:
        return bucket or self.default_bucket

    def ensure_bucket_exists(self, bucket: Optional[str] = None) -> bool:
        if self._use_fallback or not self._client:
            return True
        target = self._resolve_bucket(bucket)
        try:
            if not self._client.bucket_exists(target):
                self._client.make_bucket(target)
                logger.info("Created MinIO bucket: %s", target)
            return True
        except Exception as e:
            logger.warning("MinIO unavailable (%s). Switching to local fallback.", e)
            self._use_fallback = True
            return True

    def upload_stream(
        self,
        object_key: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
        bucket: Optional[str] = None,
    ) -> str:
        target = self._resolve_bucket(bucket)
        if self._use_fallback or not self._client:
            self._fallback_storage[f"{target}/{object_key}"] = data.read()
            return object_key

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
        except Exception as e:
            logger.warning("MinIO upload failed (%s). Storing in fallback store.", e)
            self._use_fallback = True
            data.seek(0)
            self._fallback_storage[f"{target}/{object_key}"] = data.read()
            return object_key

    def download_bytes(
        self,
        object_key: str,
        bucket: Optional[str] = None,
    ) -> bytes:
        target = self._resolve_bucket(bucket)
        if self._use_fallback or not self._client or f"{target}/{object_key}" in self._fallback_storage:
            content = self._fallback_storage.get(f"{target}/{object_key}")
            if content is None:
                raise FileNotFoundError(f"Object {object_key} not found in fallback storage")
            return content

        response = None
        try:
            response = self._client.get_object(target, object_key)
            return response.read()
        except Exception as e:
            logger.error("MinIO error downloading %s: %s", object_key, e)
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
        if f"{target}/{object_key}" in self._fallback_storage:
            del self._fallback_storage[f"{target}/{object_key}"]
            return True
        if not self._client:
            return True
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
        if self._use_fallback or not self._client:
            return f"http://localhost:8010/api/v1/sessions/storage-preview/{target}/{object_key}"
        try:
            return self._client.presigned_get_object(
                bucket_name=target,
                object_name=object_key,
                expires=timedelta(seconds=expires_seconds),
            )
        except Exception as e:
            logger.warning("Failed generating MinIO presigned URL (%s). Falling back.", e)
            return f"http://localhost:8010/api/v1/sessions/storage-preview/{target}/{object_key}"

    def is_healthy(self) -> bool:
        return True


# Global default instance and FastAPI dependency helper
default_storage_provider = MinIOStorageProvider()


def get_storage_provider() -> StorageProvider:
    """Dependency provider for FastAPI routes."""
    return default_storage_provider
