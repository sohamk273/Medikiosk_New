"""MinIO implementation of StorageProvider."""
from datetime import timedelta
from typing import BinaryIO, Optional
from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.logging import logger
from app.providers.storage.base import StorageProvider


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

    def _resolve_bucket(self, bucket_name: Optional[str]) -> str:
        return bucket_name or self.default_bucket

    def ensure_bucket_exists(self, bucket_name: Optional[str] = None) -> bool:
        bucket = self._resolve_bucket(bucket_name)
        try:
            if not self._client.bucket_exists(bucket):
                self._client.make_bucket(bucket)
                logger.info("Created private MinIO bucket: %s", bucket)
            return True
        except Exception as e:
            logger.error("Failed to check/create MinIO bucket %s: %s", bucket, e)
            return False

    def upload_file(
        self,
        object_name: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
        bucket_name: Optional[str] = None,
    ) -> str:
        bucket = self._resolve_bucket(bucket_name)
        self.ensure_bucket_exists(bucket)
        try:
            self._client.put_object(
                bucket_name=bucket,
                object_name=object_name,
                data=data,
                length=length,
                content_type=content_type,
            )
            return f"{bucket}/{object_name}"
        except S3Error as e:
            logger.error("MinIO S3 error uploading %s: %s", object_name, e)
            raise
        except Exception as e:
            logger.error("Unexpected error uploading %s: %s", object_name, e)
            raise

    def _clean_object_name(self, object_name: str, bucket: str) -> str:
        if object_name.startswith(f"{bucket}/"):
            return object_name[len(bucket) + 1 :]
        return object_name

    def _split_bucket_and_key(self, object_name: str, bucket_name: Optional[str] = None) -> tuple[str, str]:
        if bucket_name:
            bucket = bucket_name
            clean_key = self._clean_object_name(object_name, bucket)
            return bucket, clean_key
        if object_name.startswith("kiosk-uploads/"):
            return "kiosk-uploads", object_name[len("kiosk-uploads/"):]
        if object_name.startswith(f"{self.default_bucket}/"):
            return self.default_bucket, object_name[len(f"{self.default_bucket}/"):]
        return self.default_bucket, object_name

    def download_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None,
    ) -> bytes:
        bucket, cleaned_name = self._split_bucket_and_key(object_name, bucket_name)
        response = None
        try:
            response = self._client.get_object(bucket, cleaned_name)
            return response.read()
        except S3Error as e:
            logger.error("MinIO S3 error downloading %s: %s", cleaned_name, e)
            raise
        finally:
            if response:
                response.close()
                response.release_conn()

    def delete_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None,
    ) -> bool:
        bucket, cleaned_name = self._split_bucket_and_key(object_name, bucket_name)
        try:
            self._client.remove_object(bucket, cleaned_name)
            return True
        except Exception as e:
            logger.error("Failed to delete MinIO object %s: %s", cleaned_name, e)
            return False

    def get_presigned_url(
        self,
        object_name: str,
        expires_seconds: int = 900,
        bucket_name: Optional[str] = None,
    ) -> str:
        bucket, cleaned_name = self._split_bucket_and_key(object_name, bucket_name)
        try:
            return self._client.presigned_get_object(
                bucket_name=bucket,
                object_name=cleaned_name,
                expires=timedelta(seconds=expires_seconds),
            )
        except Exception as e:
            logger.error("Failed generating presigned URL for %s: %s", cleaned_name, e)
            raise

    def is_healthy(self) -> bool:
        try:
            # Listing buckets verifies server reachability and credentials
            self._client.list_buckets()
            return True
        except Exception as e:
            logger.warning("MinIO health check failed: %s", e)
            return False
