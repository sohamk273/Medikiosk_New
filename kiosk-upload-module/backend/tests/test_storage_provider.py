"""Tests for StorageProvider abstraction operations."""
import io
import pytest
from tests.conftest import InMemoryStorageProvider


def test_in_memory_storage_provider():
    provider = InMemoryStorageProvider()
    assert provider.is_healthy() is True

    # 1. Upload stream
    test_data = b"Sample document contents for storage provider test."
    stream = io.BytesIO(test_data)
    key = "uploads/2026/09/19/doc1_test.txt"
    uploaded_key = provider.upload_stream(
        object_key=key,
        data=stream,
        length=len(test_data),
        content_type="text/plain",
        bucket="test-bucket",
    )
    assert uploaded_key == key

    # 2. Download bytes
    downloaded = provider.download_bytes(key, bucket="test-bucket")
    assert downloaded == test_data

    # 3. Presigned URL
    url = provider.get_presigned_url(key, expires_seconds=600, bucket="test-bucket")
    assert key in url
    assert "test-bucket" in url

    # 4. Delete object
    deleted = provider.delete_object(key, bucket="test-bucket")
    assert deleted is True

    # 5. Download after delete raises exception
    with pytest.raises(Exception):
        provider.download_bytes(key, bucket="test-bucket")
