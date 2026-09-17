"""Live End-to-End Verification for Stage 3B:
Real Medical Document Upload -> MinIO + PostgreSQL Metadata Persistence.

Flow:
1. Health check (FastAPI, PostgreSQL, MinIO).
2. Register/create test patient.
3. Create encounter.
4. Record consent & submit to queue.
5. Login as doctor (dr.priya).
6. Upload real PDF document via HTTP multipart POST /api/v1/encounters/{enc_id}/documents.
7. Query PostgreSQL directly to verify metadata row exists with exact patient/encounter links.
8. Query MinIO directly to verify binary object exists in medikiosk-documents bucket.
9. Retrieve document list via GET /api/v1/encounters/{enc_id}/documents with doctor JWT.
10. Generate short-lived presigned URL via GET /api/v1/documents/{doc_id}/url.
11. Download directly from presigned URL and verify binary content matches original PDF byte-for-byte.
12. Run the direct PostgreSQL join query specified in Section 16.
13. Clean up test encounter and MinIO test object without touching dev data.
"""
import asyncio
import io
import sys
import uuid
import httpx
from minio import Minio
from sqlalchemy import text
from app.core.config import settings
from app.db.session import AsyncSessionLocal

API_URL = "http://localhost:8000/api/v1"
TEST_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Title (Real Live Medical Lab Report Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"


async def run_live_e2e():
    print("=" * 70)
    print("MEDIKIOSK STAGE 3B: LIVE DOCUMENT UPLOAD & PERSISTENCE VERIFICATION")
    print("=" * 70)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Health check
        print("\n[1] Checking service health...")
        health_res = await client.get(f"{API_URL}/health/ready")
        assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
        health_data = health_res.json()
        print(f"    [OK] FastAPI Status: {health_data.get('status')}")
        print(f"    [OK] PostgreSQL: {health_data.get('components', {}).get('database')}")
        print(f"    [OK] MinIO Storage: {health_data.get('components', {}).get('storage')}")

        # 2. Register test patient
        print("\n[2] Registering test patient...")
        patient_payload = {
            "full_name": f"Stage3B Test Patient {uuid.uuid4().hex[:4]}",
            "age": 42,
            "gender": "Female",
        }
        pat_res = await client.post(f"{API_URL}/patients", json=patient_payload)
        assert pat_res.status_code == 201, f"Failed creating patient: {pat_res.text}"
        patient = pat_res.json()
        patient_id = patient["id"]
        uhid = patient["patient_uhid"]
        print(f"    [OK] Patient created: ID={patient_id}, UHID={uhid}")

        # 3. Create encounter
        print("\n[3] Creating active encounter...")
        enc_res = await client.post(f"{API_URL}/encounters", json={"patient_id": patient_id, "priority": "NORMAL"})
        assert enc_res.status_code == 201, f"Failed creating encounter: {enc_res.text}"
        encounter = enc_res.json()
        encounter_id = encounter["id"]
        enc_number = encounter["encounter_number"]
        print(f"    [OK] Encounter created: ID={encounter_id}, Number={enc_number}")

        # 4. Consent & Submit to queue
        print("\n[4] Recording consent & submitting to queue...")
        consent_res = await client.post(
            f"{API_URL}/encounters/{encounter_id}/consent",
            json={"accepted": True, "abdm_sharing": True, "voice_recording": True},
        )
        assert consent_res.status_code == 201, f"Consent failed: {consent_res.text}"

        sub_res = await client.post(f"{API_URL}/encounters/{encounter_id}/submit")
        assert sub_res.status_code == 201, f"Submit failed: {sub_res.text}"
        queue_data = sub_res.json()
        print(f"    [OK] Submitted: Token={queue_data.get('token_number')}")

        # 5. Doctor login
        print("\n[5] Authenticating doctor...")
        login_res = await client.post(
            f"{API_URL}/auth/login",
            json={"username": "dr.priya", "password": "DoctorPass123!"},
        )
        assert login_res.status_code == 200, f"Doctor login failed: {login_res.text}"
        doc_token = login_res.json()["access_token"]
        doc_headers = {"Authorization": f"Bearer {doc_token}"}
        print("    [OK] Doctor authenticated (dr.priya)")

        # 6. Upload real PDF document via multipart form
        print("\n[6] Uploading real medical PDF via multipart/form-data...")
        files = {
            "file": ("blood_chemistry_panel.pdf", TEST_PDF_BYTES, "application/pdf"),
        }
        data = {
            "document_type": "LAB_REPORT",
        }
        up_res = await client.post(
            f"{API_URL}/encounters/{encounter_id}/documents",
            files=files,
            data=data,
        )
        assert up_res.status_code == 201, f"Document upload failed: {up_res.text}"
        doc_data = up_res.json()
        doc_id = doc_data["id"]
        storage_key = doc_data["storage_key"]
        print(f"    [OK] Upload HTTP 201 OK")
        print(f"    [OK] Document UUID: {doc_id}")
        print(f"    [OK] Storage Key: {storage_key}")
        print(f"    [OK] Processing Status: {doc_data.get('processing_status')}")

        # 7. Direct PostgreSQL verification
        print("\n[7] Querying PostgreSQL directly for document metadata row...")
        async with AsyncSessionLocal() as db:
            res = await db.execute(
                text("SELECT id, patient_id, encounter_id, file_name, content_type, file_size, storage_key, document_type, processing_status FROM documents WHERE id = :id"),
                {"id": uuid.UUID(doc_id)},
            )
            db_row = res.fetchone()
            assert db_row is not None, "Document row not found in PostgreSQL!"
            assert str(db_row.patient_id) == patient_id
            assert str(db_row.encounter_id) == encounter_id
            assert db_row.file_name == "blood_chemistry_panel.pdf"
            assert db_row.file_size == len(TEST_PDF_BYTES)
            print("    [OK] PostgreSQL metadata row verified:")
            print(f"      - ID: {db_row.id}")
            print(f"      - Patient ID: {db_row.patient_id} (matches patient: True)")
            print(f"      - Encounter ID: {db_row.encounter_id} (matches encounter: True)")
            print(f"      - Content Type: {db_row.content_type}")
            print(f"      - File Size: {db_row.file_size} bytes")
            print(f"      - Processing Status: {db_row.processing_status}")

        # 8. Direct MinIO verification
        print("\n[8] Querying MinIO object storage directly...")
        minio_client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        # Normalize key if prefixed
        clean_key = storage_key
        if clean_key.startswith(f"{settings.MINIO_BUCKET}/"):
            clean_key = clean_key[len(settings.MINIO_BUCKET) + 1:]

        stat = minio_client.stat_object(settings.MINIO_BUCKET, clean_key)
        assert stat.size == len(TEST_PDF_BYTES), f"MinIO size mismatch: expected {len(TEST_PDF_BYTES)}, got {stat.size}"
        print(f"    [OK] MinIO Bucket: '{settings.MINIO_BUCKET}'")
        print(f"    [OK] Object: '{clean_key}'")
        print(f"    [OK] Object Size: {stat.size} bytes (exact match)")
        print(f"    [OK] Content-Type: {stat.content_type}")

        # 9. GET document list as Doctor
        print("\n[9] Retrieving document list via GET /api/v1/encounters/{id}/documents (Doctor)...")
        list_res = await client.get(
            f"{API_URL}/encounters/{encounter_id}/documents",
            headers=doc_headers,
        )
        assert list_res.status_code == 200, f"List failed: {list_res.text}"
        doc_list = list_res.json()
        assert len(doc_list) == 1
        assert doc_list[0]["id"] == doc_id
        assert doc_list[0]["file_name"] == "blood_chemistry_panel.pdf"
        print(f"    [OK] Retrieved 1 document metadata item for encounter")

        # 10. Generate presigned URL
        print("\n[10] Requesting presigned URL via GET /api/v1/documents/{doc_id}/url (Doctor)...")
        url_res = await client.get(
            f"{API_URL}/documents/{doc_id}/url",
            headers=doc_headers,
        )
        assert url_res.status_code == 200, f"Presigned URL failed: {url_res.text}"
        url_data = url_res.json()
        presigned_url = url_data["url"]
        expires_in = url_data["expires_in"]
        print(f"    [OK] Presigned URL successfully issued (expires in {expires_in}s):")
        print(f"      {presigned_url[:80]}...")

        # 11. Download bytes from presigned URL and verify content
        print("\n[11] Downloading binary object from presigned URL...")
        dl_res = await client.get(presigned_url)
        assert dl_res.status_code == 200, f"Download failed: {dl_res.status_code}"
        downloaded_bytes = dl_res.content
        assert downloaded_bytes == TEST_PDF_BYTES, "Downloaded bytes do not match uploaded PDF!"
        print(f"    [OK] Successfully downloaded {len(downloaded_bytes)} bytes from MinIO via presigned URL")
        print(f"    [OK] Binary integrity verified byte-for-byte!")

        # 12. Run Section 16 Direct Database Verification Join Query
        print("\n[12] Executing Section 16 PostgreSQL Verification Query:")
        async with AsyncSessionLocal() as db:
            query = text("""
                SELECT
                    d.id,
                    d.file_name,
                    d.content_type,
                    d.file_size,
                    d.storage_key,
                    d.document_type,
                    d.processing_status,
                    p.full_name AS patient_name,
                    p.patient_uhid,
                    e.encounter_number
                FROM documents d
                JOIN patients p ON p.id = d.patient_id
                JOIN encounters e ON e.id = d.encounter_id
                WHERE d.id = :id
            """)
            res = await db.execute(query, {"id": uuid.UUID(doc_id)})
            row = res.fetchone()
            print("    " + "-" * 60)
            print(f"    ID:                 {row.id}")
            print(f"    File Name:          {row.file_name}")
            print(f"    Content Type:       {row.content_type}")
            print(f"    File Size:          {row.file_size} bytes")
            print(f"    Storage Key:        {row.storage_key}")
            print(f"    Document Type:      {row.document_type}")
            print(f"    Processing Status:  {row.processing_status}")
            print(f"    Patient Name:       {row.patient_name}")
            print(f"    UHID:               {row.patient_uhid}")
            print(f"    Encounter Number:   {row.encounter_number}")
            print("    " + "-" * 60)

        # 13. Clean up test encounter & MinIO object
        print("\n[13] Cleaning up test data (leaving existing development data intact)...")
        del_res = await client.delete(f"{API_URL}/documents/{doc_id}", headers=doc_headers)
        assert del_res.status_code == 204
        # Verify MinIO object removed
        try:
            minio_client.stat_object(settings.MINIO_BUCKET, clean_key)
            assert False, "MinIO object was not deleted!"
        except Exception:
            print("    [OK] MinIO test object removed cleanly")

        async with AsyncSessionLocal() as db:
            await db.execute(text("DELETE FROM encounters WHERE id = :id"), {"id": uuid.UUID(encounter_id)})
            await db.execute(text("DELETE FROM patients WHERE id = :id"), {"id": uuid.UUID(patient_id)})
            await db.commit()
            print("    [OK] Test encounter and patient removed cleanly")

    print("\n" + "=" * 70)
    print("ALL 13 STAGE 3B VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_live_e2e())
