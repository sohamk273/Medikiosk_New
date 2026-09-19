"""Security and isolation tests for tokens, expiration, and session boundaries."""
from datetime import datetime, timedelta, timezone
import hashlib
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import UploadSession


@pytest.mark.asyncio
async def test_token_is_hashed_in_database(client: AsyncClient, test_db_session: AsyncSession):
    # 1. Create a session
    res = await client.post("/api/v1/sessions")
    token = res.json()["upload_url"].split("/upload/")[-1]
    session_id = res.json()["session_id"]

    # 2. Inspect raw database record
    stmt = select(UploadSession).where(UploadSession.id == session_id)
    db_res = await test_db_session.execute(stmt)
    sess_row = db_res.scalar_one()

    # Pre-image token must NOT be in DB
    assert sess_row.upload_token_hash != token
    # SHA-256 hash must match
    expected_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    assert sess_row.upload_token_hash == expected_hash


@pytest.mark.asyncio
async def test_invalid_token_returns_404(client: AsyncClient):
    res = await client.get("/api/v1/upload/completely_invalid_random_token_string")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_expired_session_rejected_with_410(client: AsyncClient, test_db_session: AsyncSession):
    # 1. Create session
    res = await client.post("/api/v1/sessions")
    token = res.json()["upload_url"].split("/upload/")[-1]
    session_id = res.json()["session_id"]

    # 2. Fast-forward expiration in DB
    stmt = select(UploadSession).where(UploadSession.id == session_id)
    db_res = await test_db_session.execute(stmt)
    sess_row = db_res.scalar_one()
    sess_row.expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    await test_db_session.commit()

    # 3. Mobile handshake should fail with 410 Gone
    res_handshake = await client.get(f"/api/v1/upload/{token}")
    assert res_handshake.status_code == 410
    assert "expired" in res_handshake.json()["detail"].lower()

    # 4. Upload attempt must also fail with 410 Gone
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    files = {"file": ("test.png", png_bytes, "image/png")}
    res_up = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res_up.status_code == 410


@pytest.mark.asyncio
async def test_single_use_enforcement(client: AsyncClient):
    # 1. Create session and upload file
    res = await client.post("/api/v1/sessions")
    token = res.json()["upload_url"].split("/upload/")[-1]

    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    files = {"file": ("test.png", png_bytes, "image/png")}
    res_first = await client.post(f"/api/v1/upload/{token}", files=files)
    assert res_first.status_code == 200

    # 2. Second upload using the same token must be rejected with 409 Conflict
    files2 = {"file": ("test2.png", png_bytes, "image/png")}
    res_second = await client.post(f"/api/v1/upload/{token}", files=files2)
    assert res_second.status_code == 409
    assert "already been uploaded" in res_second.json()["detail"]
