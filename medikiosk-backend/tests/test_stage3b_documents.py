"""Stage 3B Automated Test Suite: Real Medical Document Upload -> MinIO + PostgreSQL Metadata.

Covers:
1. Authenticated doctor can list documents.
2. Unauthenticated request to list documents is rejected.
3. Unsupported file type rejected.
4. Empty file rejected.
5. Oversized file rejected.
6. Valid PDF upload succeeds.
7. Valid image upload succeeds.
8. PostgreSQL metadata created.
9. MinIO object exists in storage provider.
10. Document is linked to correct patient.
11. Document is linked to correct encounter.
12. Document list returns metadata.
13. Presigned URL endpoint requires authentication.
14. Presigned URL can be generated.
15. Invalid document ID returns 404.
16. Upload failure does not create orphan metadata.
17. Document deletion removes both MinIO object and PostgreSQL metadata.
18. Non-existent encounter ID returns 404 on upload.
"""
import io
import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.core.security import hash_password
from app.models.document import Document
from app.models.encounter import Encounter, EncounterStatus
from app.models.patient import Patient
from app.models.user import User, UserRole
from tests.conftest import FakeStorageProvider


# ==============================================================================
# TEST FIXTURES & HELPERS
# ==============================================================================

async def create_test_doctor(db_session: AsyncSession, username="dr.priya", role=UserRole.DOCTOR) -> User:
    """Creates an active doctor user for testing."""
    user = User(
        username=username,
        password_hash=hash_password("DoctorPass123!"),
        display_name="Dr. Priya Sharma",
        role=role,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def get_doctor_token(client: AsyncClient, username="dr.priya", password="DoctorPass123!") -> str:
    """Logs in doctor and returns access token."""
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


async def setup_patient_and_encounter(db_session: AsyncSession) -> tuple[Patient, Encounter]:
    """Creates a patient and active encounter in database."""
    patient = Patient(
        patient_uhid=f"UHID-TEST-{uuid.uuid4().hex[:8].upper()}",
        full_name="Radha Krishna",
        age=45,
        gender="Female",
    )
    db_session.add(patient)
    await db_session.flush()

    encounter = Encounter(
        encounter_number=f"ENC-TEST-{uuid.uuid4().hex[:8].upper()}",
        patient_id=patient.id,
        status=EncounterStatus.WAITING,
        chief_complaint="Severe abdominal pain and fever",
    )
    db_session.add(encounter)
    await db_session.commit()
    await db_session.refresh(patient)
    await db_session.refresh(encounter)
    return patient, encounter


# ==============================================================================
# TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_upload_valid_pdf_succeeds(client: AsyncClient, db_session: AsyncSession, fake_storage: FakeStorageProvider):
    """Test 6, 8, 9, 10, 11: Valid PDF upload succeeds, persists to PostgreSQL & MinIO, linked to patient & encounter."""
    patient, encounter = await setup_patient_and_encounter(db_session)
    pdf_content = b"%PDF-1.4 sample medical report bytes"

    files = {
        "file": ("blood_report.pdf", pdf_content, "application/pdf"),
    }
    data = {
        "document_type": "LAB_REPORT",
    }

    res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files, data=data)
    assert res.status_code == 201, res.text
    doc_data = res.json()

    # Verify response schema fields
    assert doc_data["file_name"] == "blood_report.pdf"
    assert doc_data["content_type"] == "application/pdf"
    assert doc_data["file_size"] == len(pdf_content)
    assert doc_data["document_type"] == "LAB_REPORT"
    assert doc_data["processing_status"] == "UPLOADED"
    assert doc_data["patient_id"] == str(patient.id)
    assert doc_data["encounter_id"] == str(encounter.id)
    assert "storage_key" in doc_data

    # Verify PostgreSQL row
    doc_id = uuid.UUID(doc_data["id"])
    result = await db_session.execute(select(Document).where(Document.id == doc_id))
    db_doc = result.scalar_one_or_none()
    assert db_doc is not None
    assert db_doc.patient_id == patient.id
    assert db_doc.encounter_id == encounter.id
    assert db_doc.file_size == len(pdf_content)
    assert db_doc.storage_key == doc_data["storage_key"]

    # Verify MinIO fake storage object
    cleaned_key = fake_storage._clean_name(db_doc.storage_key)
    assert cleaned_key in fake_storage._storage
    assert fake_storage._storage[cleaned_key] == pdf_content


@pytest.mark.asyncio
async def test_upload_valid_image_succeeds(client: AsyncClient, db_session: AsyncSession, fake_storage: FakeStorageProvider):
    """Test 7: Valid image upload (PNG/JPEG) succeeds."""
    _, encounter = await setup_patient_and_encounter(db_session)
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"

    files = {
        "file": ("xray.png", png_content, "image/png"),
    }
    data = {
        "document_type": "MEDICAL_RECORD",
    }

    res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files, data=data)
    assert res.status_code == 201
    doc_data = res.json()
    assert doc_data["content_type"] == "image/png"
    assert doc_data["document_type"] == "MEDICAL_RECORD"


@pytest.mark.asyncio
async def test_upload_unsupported_file_type_rejected(client: AsyncClient, db_session: AsyncSession):
    """Test 3: Unsupported file type rejected (e.g. text/plain, exe, zip)."""
    _, encounter = await setup_patient_and_encounter(db_session)
    files = {
        "file": ("malicious.exe", b"MZ\x90\x00", "application/x-msdownload"),
    }
    res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files)
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]


@pytest.mark.asyncio
async def test_upload_empty_file_rejected(client: AsyncClient, db_session: AsyncSession):
    """Test 4: Empty file (0 bytes) rejected."""
    _, encounter = await setup_patient_and_encounter(db_session)
    files = {
        "file": ("empty.pdf", b"", "application/pdf"),
    }
    res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_oversized_file_rejected(client: AsyncClient, db_session: AsyncSession):
    """Test 5: Oversized file exceeding MAX_DOCUMENT_SIZE_MB rejected."""
    _, encounter = await setup_patient_and_encounter(db_session)
    # Simulate oversized file > 10MB (e.g. 11MB)
    oversized = b"0" * (11 * 1024 * 1024)
    files = {
        "file": ("large_scan.pdf", oversized, "application/pdf"),
    }
    res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files)
    assert res.status_code == 400
    assert "exceeds maximum allowed size" in res.json()["detail"]


@pytest.mark.asyncio
async def test_upload_nonexistent_encounter_returns_404(client: AsyncClient):
    """Test 18: Upload with non-existent encounter ID returns 404."""
    random_id = uuid.uuid4()
    files = {
        "file": ("report.pdf", b"%PDF sample", "application/pdf"),
    }
    res = await client.post(f"/api/v1/encounters/{random_id}/documents", files=files)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_authenticated_doctor_can_list_documents(client: AsyncClient, db_session: AsyncSession):
    """Test 1, 12: Authenticated doctor can list encounter documents metadata without binary bytes."""
    doctor = await create_test_doctor(db_session, username="dr.doclist")
    token = await get_doctor_token(client, username="dr.doclist")
    headers = {"Authorization": f"Bearer {token}"}

    _, encounter = await setup_patient_and_encounter(db_session)

    # Upload two documents
    files1 = {"file": ("doc1.pdf", b"%PDF-1", "application/pdf")}
    await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files1, data={"document_type": "PRESCRIPTION"})

    files2 = {"file": ("doc2.png", b"\x89PNG", "image/png")}
    await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files2, data={"document_type": "LAB_REPORT"})

    # Doctor queries document list
    res = await client.get(f"/api/v1/encounters/{encounter.id}/documents", headers=headers)
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) == 2
    assert docs[0]["file_name"] == "doc1.pdf"
    assert docs[0]["document_type"] == "PRESCRIPTION"
    assert docs[1]["file_name"] == "doc2.png"
    assert docs[1]["document_type"] == "LAB_REPORT"
    # Ensure binary content is NOT returned
    assert "binary" not in docs[0]
    assert "data" not in docs[0]


@pytest.mark.asyncio
async def test_unauthenticated_request_to_list_documents_is_rejected(client: AsyncClient, db_session: AsyncSession):
    """Test 2: Unauthenticated request to list encounter documents is rejected (401)."""
    _, encounter = await setup_patient_and_encounter(db_session)
    res = await client.get(f"/api/v1/encounters/{encounter.id}/documents")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_presigned_url_endpoint_requires_auth(client: AsyncClient, db_session: AsyncSession):
    """Test 13: Presigned URL endpoint requires authentication (401 without auth)."""
    _, encounter = await setup_patient_and_encounter(db_session)
    files = {"file": ("doc.pdf", b"%PDF-1", "application/pdf")}
    up_res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files)
    doc_id = up_res.json()["id"]

    res = await client.get(f"/api/v1/documents/{doc_id}/url")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_presigned_url_can_be_generated(client: AsyncClient, db_session: AsyncSession):
    """Test 14: Presigned URL can be generated for authenticated doctor."""
    await create_test_doctor(db_session, username="dr.presigned")
    token = await get_doctor_token(client, username="dr.presigned")
    headers = {"Authorization": f"Bearer {token}"}

    _, encounter = await setup_patient_and_encounter(db_session)
    files = {"file": ("scan.pdf", b"%PDF-1.4 content", "application/pdf")}
    up_res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files)
    doc_id = up_res.json()["id"]

    res = await client.get(f"/api/v1/documents/{doc_id}/url", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["document_id"] == doc_id
    assert "url" in data
    assert "expires_in" in data
    assert "test-bucket" in data["url"]


@pytest.mark.asyncio
async def test_invalid_document_id_returns_404(client: AsyncClient, db_session: AsyncSession):
    """Test 15: Invalid document ID returns 404."""
    await create_test_doctor(db_session, username="dr.notfound")
    token = await get_doctor_token(client, username="dr.notfound")
    headers = {"Authorization": f"Bearer {token}"}

    rand_doc_id = uuid.uuid4()
    res = await client.get(f"/api/v1/documents/{rand_doc_id}/url", headers=headers)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_failure_does_not_create_orphan_metadata(client: AsyncClient, db_session: AsyncSession, fake_storage: FakeStorageProvider):
    """Test 16: DB failure during upload cleans up MinIO and leaves zero orphan metadata."""
    _, encounter = await setup_patient_and_encounter(db_session)
    enc_id = encounter.id
    files = {"file": ("failing.pdf", b"%PDF-test", "application/pdf")}

    # Simulate DB commit failure
    with patch("sqlalchemy.ext.asyncio.AsyncSession.commit", side_effect=RuntimeError("Simulated DB commit error")):
        res = await client.post(f"/api/v1/encounters/{enc_id}/documents", files=files)
        assert res.status_code == 500

    # Verify zero document rows exist
    result = await db_session.execute(select(Document).where(Document.encounter_id == enc_id))
    docs = result.scalars().all()
    assert len(docs) == 0

    # Verify fake storage has zero orphan objects for this encounter
    for key in fake_storage._storage:
        assert str(enc_id) not in key


@pytest.mark.asyncio
async def test_document_deletion_removes_storage_and_metadata(client: AsyncClient, db_session: AsyncSession, fake_storage: FakeStorageProvider):
    """Test 17: Document deletion removes both MinIO object and PostgreSQL record."""
    await create_test_doctor(db_session, username="dr.delete")
    token = await get_doctor_token(client, username="dr.delete")
    headers = {"Authorization": f"Bearer {token}"}

    _, encounter = await setup_patient_and_encounter(db_session)
    files = {"file": ("to_delete.pdf", b"%PDF-delete-me", "application/pdf")}
    up_res = await client.post(f"/api/v1/encounters/{encounter.id}/documents", files=files)
    doc_id = up_res.json()["id"]
    storage_key = up_res.json()["storage_key"]

    cleaned_key = fake_storage._clean_name(storage_key)
    assert cleaned_key in fake_storage._storage

    # Delete document
    del_res = await client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify DB row is gone
    result = await db_session.execute(select(Document).where(Document.id == uuid.UUID(doc_id)))
    assert result.scalar_one_or_none() is None

    # Verify MinIO object is gone
    assert cleaned_key not in fake_storage._storage
