"""Tests for full upload session state machine lifecycle."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_session_lifecycle_success(client: AsyncClient):
    # 1. Kiosk initiates upload session
    res = await client.post(
        "/api/v1/sessions",
        json={
            "ttl_seconds": 300,
            "allowed_types": ["image/png", "image/jpeg", "application/pdf"],
            "max_size_mb": 10,
            "metadata": {"kiosk_id": "test-kiosk-1", "department": "radiology"},
        },
    )
    assert res.status_code == 201
    data = res.json()
    session_id = data["session_id"]
    upload_url = data["upload_url"]
    assert data["status"] == "WAITING"
    assert "/upload/" in upload_url

    # Extract the raw secret token from the end of the upload_url
    raw_token = upload_url.split("/upload/")[-1]

    # 2. Check initial session state from kiosk
    res_kiosk = await client.get(f"/api/v1/sessions/{session_id}")
    assert res_kiosk.status_code == 200
    assert res_kiosk.json()["status"] == "WAITING"
    assert res_kiosk.json()["file_metadata"] is None

    # 3. Mobile phone scans QR code and performs handshake
    res_handshake = await client.get(f"/api/v1/upload/{raw_token}")
    assert res_handshake.status_code == 200
    assert res_handshake.json()["session_id"] == session_id
    assert res_handshake.json()["status"] == "CONNECTED"
    assert "image/png" in res_handshake.json()["allowed_types"]

    # 4. Kiosk sees status is now CONNECTED
    res_kiosk_conn = await client.get(f"/api/v1/sessions/{session_id}")
    assert res_kiosk_conn.json()["status"] == "CONNECTED"

    # 5. Mobile uploads a valid PNG file
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("xray.png", png_bytes, "image/png")}
    res_upload = await client.post(f"/api/v1/upload/{raw_token}", files=files)
    assert res_upload.status_code == 200
    assert res_upload.json()["status"] == "UPLOADED"
    assert res_upload.json()["file_name"] == "xray.png"

    # 6. Kiosk checks session - now UPLOADED with file metadata
    res_kiosk_up = await client.get(f"/api/v1/sessions/{session_id}")
    assert res_kiosk_up.status_code == 200
    up_data = res_kiosk_up.json()
    assert up_data["status"] == "UPLOADED"
    assert up_data["file_metadata"]["file_name"] == "xray.png"
    assert up_data["file_metadata"]["content_type"] == "image/png"
    assert up_data["file_metadata"]["file_size"] == len(png_bytes)
    assert len(up_data["file_metadata"]["sha256"]) == 64

    # 7. Kiosk requests preview URL
    res_prev = await client.get(f"/api/v1/sessions/{session_id}/preview-url")
    assert res_prev.status_code == 200
    assert res_prev.json()["available"] is True
    assert "mock-minio" in res_prev.json()["url"]

    # 8. Kiosk consumes the uploaded document
    res_consume = await client.post(f"/api/v1/sessions/{session_id}/consume")
    assert res_consume.status_code == 200
    cons_data = res_consume.json()
    assert cons_data["status"] == "CONSUMED"
    assert cons_data["storage_reference"]["bucket"] == "kiosk-uploads"
    assert "xray.png" in cons_data["storage_reference"]["object_key"]
    assert cons_data["metadata"]["kiosk_id"] == "test-kiosk-1"

    # 8b. Test idempotency: Consuming again returns the same storage reference cleanly
    res_consume_idempotent = await client.post(f"/api/v1/sessions/{session_id}/consume")
    assert res_consume_idempotent.status_code == 200
    assert res_consume_idempotent.json()["storage_reference"] == cons_data["storage_reference"]

    # 9. Late mobile attempts are strictly rejected
    res_late_upload = await client.post(f"/api/v1/upload/{raw_token}", files=files)
    assert res_late_upload.status_code == 410  # GONE
