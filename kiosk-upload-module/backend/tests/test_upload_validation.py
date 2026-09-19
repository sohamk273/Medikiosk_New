"""Tests for file validation, size limits, and binary integrity guards."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_empty_file_rejected(client: AsyncClient):
    res_sess = await client.post("/api/v1/sessions")
    token = res_sess.json()["upload_url"].split("/upload/")[-1]

    # Attempt uploading 0-byte file
    files = {"file": ("empty.png", b"", "image/png")}
    res = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_oversized_file_rejected(client: AsyncClient):
    # Create session with 1 MB limit
    res_sess = await client.post("/api/v1/sessions", json={"max_size_mb": 1})
    token = res_sess.json()["upload_url"].split("/upload/")[-1]

    # Create 1.5 MB payload
    large_payload = b"\x89PNG\r\n\x1a\n" + (b"0" * (1500 * 1024))
    files = {"file": ("large.png", large_payload, "image/png")}
    res = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res.status_code == 413
    assert "exceeds" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_unsupported_mime_type_rejected(client: AsyncClient):
    res_sess = await client.post(
        "/api/v1/sessions",
        json={"allowed_types": ["image/png", "image/jpeg"]},
    )
    token = res_sess.json()["upload_url"].split("/upload/")[-1]

    # Try uploading a text/plain file
    files = {"file": ("script.py", b"print('hello')", "text/plain")}
    res = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res.status_code == 415


@pytest.mark.asyncio
async def test_magic_byte_mismatch_rejected(client: AsyncClient):
    res_sess = await client.post("/api/v1/sessions")
    token = res_sess.json()["upload_url"].split("/upload/")[-1]

    # Claims to be image/png, but contains ASCII text
    files = {"file": ("fake.png", b"This is not a real PNG file header", "image/png")}
    res = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res.status_code == 400
    assert "header" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_valid_pdf_accepted(client: AsyncClient):
    res_sess = await client.post("/api/v1/sessions")
    token = res_sess.json()["upload_url"].split("/upload/")[-1]

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("report.pdf", pdf_bytes, "application/pdf")}
    res = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res.status_code == 200
    assert res.json()["status"] == "UPLOADED"


@pytest.mark.asyncio
async def test_valid_jpeg_accepted(client: AsyncClient):
    res_sess = await client.post("/api/v1/sessions")
    token = res_sess.json()["upload_url"].split("/upload/")[-1]

    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C"
    files = {"file": ("photo.jpg", jpeg_bytes, "image/jpeg")}
    res = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res.status_code == 200
    assert res.json()["status"] == "UPLOADED"
