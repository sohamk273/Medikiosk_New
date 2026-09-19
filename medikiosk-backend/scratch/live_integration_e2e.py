"""Full end-to-end live integration test verifying:
1. Domain-agnostic session creation (no patient_id)
2. Phone QR scan & file upload to MinIO
3. Idempotent consume
4. Medikiosk document attach to PostgreSQL
5. Second document upload with fresh session
6. Presigned URL generation and binary retrieval from MinIO
"""
import io
import json
import urllib.request
import urllib.parse
import uuid
import httpx

MEDIKIOSK_API = "http://localhost:8000/api/v1"
UPLOAD_MODULE_API = "http://localhost:8010/api/v1"

def run_e2e():
    print("=" * 60)
    print("STARTING LIVE MEDIKIOSK + KIOSK UPLOAD MODULE E2E TEST")
    print("=" * 60)

    # 1. Create Patient & Encounter in Medikiosk
    with httpx.Client(timeout=10.0) as client:
        # Create Patient
        p_res = client.post(f"{MEDIKIOSK_API}/patients", json={
            "full_name": "E2E Test Patient",
            "age": 42,
            "gender": "Female",
        })
        assert p_res.status_code == 201, f"Failed to create patient: {p_res.text}"
        patient = p_res.json()
        patient_id = patient["id"]
        print(f"[OK] Step 1: Created Patient in PostgreSQL: {patient_id}")

        # Create Encounter
        e_res = client.post(f"{MEDIKIOSK_API}/encounters", json={
            "patient_id": patient_id,
            "priority": "NORMAL",
        })
        assert e_res.status_code == 201, f"Failed to create encounter: {e_res.text}"
        encounter = e_res.json()
        encounter_id = encounter["id"]
        print(f"[OK] Step 2: Created Encounter in PostgreSQL: {encounter_id}")

        # 2. Document 1: Prescription
        print("\n--- Testing Document 1: Prescription ---")
        # Kiosk creates domain-agnostic upload session (NO patient_id!)
        sess1_res = client.post(f"{UPLOAD_MODULE_API}/sessions", json={
            "metadata": {
                "document_type": "PRESCRIPTION",
                "parent_reference": encounter_id
            }
        })
        assert sess1_res.status_code == 201, f"Failed session 1 create: {sess1_res.text}"
        sess1 = sess1_res.json()
        sess1_id = sess1.get("session_id") or sess1.get("id")
        upload1_url = sess1["upload_url"]
        token1 = upload1_url.split("/upload/")[-1]
        print(f"[OK] Step 3: Created Prescription Upload Session (Agnostic): {sess1_id}")
        print(f"  Upload URL: {upload1_url}")

        # Phone opens page (mark connected)
        phone1_view = client.get(f"{UPLOAD_MODULE_API}/upload/{token1}")
        assert phone1_view.status_code == 200, f"Phone view failed: {phone1_view.text}"
        print(f"[OK] Step 4: Phone opened QR page. Session marked CONNECTED.")

        # Phone uploads camera photo (sample JPEG bytes)
        fake_jpeg = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00PRESCRIPTION_PHOTO_DATA"
        files1 = {"file": ("rx_camera_photo.jpg", fake_jpeg, "image/jpeg")}
        up1_res = client.post(f"{UPLOAD_MODULE_API}/upload/{token1}", files=files1)
        assert up1_res.status_code == 200, f"Phone upload failed: {up1_res.text}"
        print(f"[OK] Step 5: Phone uploaded rx_camera_photo.jpg ({len(fake_jpeg)} bytes) to MinIO")

        # Kiosk consumes session idempotently
        consume1_res = client.post(f"{UPLOAD_MODULE_API}/sessions/{sess1_id}/consume")
        assert consume1_res.status_code == 200, f"Consume failed: {consume1_res.text}"
        storage_ref1 = consume1_res.json()["storage_reference"]
        print(f"[OK] Step 6: Kiosk consumed session 1: {storage_ref1['object_key']}")

        # Test Idempotency: consume again must succeed with identical reference
        consume1_retry = client.post(f"{UPLOAD_MODULE_API}/sessions/{sess1_id}/consume")
        assert consume1_retry.status_code == 200
        assert consume1_retry.json()["storage_reference"]["object_key"] == storage_ref1["object_key"]
        print(f"[OK] Step 7: Idempotent consume verified. Repeated consume returns existing coordinates.")

        # Kiosk attaches document to Medikiosk PostgreSQL
        fn1 = storage_ref1.get("file_name") or storage_ref1["object_key"].split("/")[-1]
        attach1_payload = {
            "storage_key": storage_ref1["object_key"],
            "file_name": fn1,
            "content_type": storage_ref1["content_type"],
            "file_size": storage_ref1["file_size"],
            "document_type": "PRESCRIPTION",
            "bucket": storage_ref1.get("bucket", "kiosk-uploads")
        }
        attach1_res = client.post(f"{MEDIKIOSK_API}/encounters/{encounter_id}/documents/attach", json=attach1_payload)
        assert attach1_res.status_code == 201, f"Attach failed: {attach1_res.text}"
        doc1 = attach1_res.json()
        doc1_id = doc1["id"]
        print(f"[OK] Step 8: Document 1 attached to Medikiosk PostgreSQL! Document ID: {doc1_id}")

        # 3. Document 2: Lab Report (NEW session per Requirement 5)
        print("\n--- Testing Document 2: Lab Report (NEW Session) ---")
        sess2_res = client.post(f"{UPLOAD_MODULE_API}/sessions", json={
            "metadata": {
                "document_type": "LAB_REPORT",
                "parent_reference": encounter_id
            }
        })
        assert sess2_res.status_code == 201
        sess2 = sess2_res.json()
        sess2_id = sess2.get("session_id") or sess2.get("id")
        token2 = sess2["upload_url"].split("/upload/")[-1]
        assert sess2_id != sess1_id, "New document category must create a brand NEW session!"
        print(f"[OK] Step 9: Created Lab Report Upload Session (Fresh Session B): {sess2_id}")

        # Phone uploads PDF for Lab Report
        fake_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        files2 = {"file": ("blood_test_report.pdf", fake_pdf, "application/pdf")}
        up2_res = client.post(f"{UPLOAD_MODULE_API}/upload/{token2}", files=files2)
        assert up2_res.status_code == 200
        print(f"[OK] Step 10: Phone uploaded blood_test_report.pdf ({len(fake_pdf)} bytes) to MinIO")

        # Kiosk consumes session 2
        consume2_res = client.post(f"{UPLOAD_MODULE_API}/sessions/{sess2_id}/consume")
        assert consume2_res.status_code == 200
        storage_ref2 = consume2_res.json()["storage_reference"]

        # Kiosk attaches document 2
        fn2 = storage_ref2.get("file_name") or storage_ref2["object_key"].split("/")[-1]
        attach2_payload = {
            "storage_key": storage_ref2["object_key"],
            "file_name": fn2,
            "content_type": storage_ref2["content_type"],
            "file_size": storage_ref2["file_size"],
            "document_type": "LAB_REPORT",
            "bucket": storage_ref2.get("bucket", "kiosk-uploads")
        }
        attach2_res = client.post(f"{MEDIKIOSK_API}/encounters/{encounter_id}/documents/attach", json=attach2_payload)
        assert attach2_res.status_code == 201
        doc2 = attach2_res.json()
        doc2_id = doc2["id"]
        print(f"[OK] Step 11: Document 2 attached to Medikiosk PostgreSQL! Document ID: {doc2_id}")

        # 4. Verify Doctor/Review retrieval
        print("\n--- Verifying Clinical Review & MinIO Download ---")
        # Log in as seeded doctor
        login_res = client.post(f"{MEDIKIOSK_API}/auth/login", json={
            "username": "dr.priya",
            "password": "DoctorPass123!"
        })
        assert login_res.status_code == 200, f"Doctor login failed: {login_res.text}"
        doctor_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {doctor_token}"}

        # List documents for encounter
        list_res = client.get(f"{MEDIKIOSK_API}/encounters/{encounter_id}/documents", headers=headers)
        assert list_res.status_code == 200
        docs = list_res.json()
        assert len(docs) == 2, f"Expected 2 documents, found {len(docs)}"
        print(f"[OK] Step 12: Retrieved {len(docs)} documents for Encounter {encounter_id}:")
        for d in docs:
            print(f"   • [{d['document_type']}] {d['file_name']} (Size: {d['file_size']}B, Key: {d['storage_key']})")

        # Generate presigned URL for document 1
        url1_res = client.get(f"{MEDIKIOSK_API}/documents/{doc1_id}/url", headers=headers)
        assert url1_res.status_code == 200
        presigned1 = url1_res.json()["url"]
        print(f"[OK] Step 13: Generated presigned URL for Document 1: {presigned1[:80]}...")

        # Download bytes using presigned URL
        raw_res1 = httpx.get(presigned1, timeout=5.0)
        assert raw_res1.status_code == 200
        assert raw_res1.content == fake_jpeg
        print(f"[OK] Step 14: Successfully downloaded Document 1 binary from MinIO ({len(raw_res1.content)} bytes). Integrity verified!")

        # Generate presigned URL for document 2
        url2_res = client.get(f"{MEDIKIOSK_API}/documents/{doc2_id}/url", headers=headers)
        assert url2_res.status_code == 200
        presigned2 = url2_res.json()["url"]
        raw_res2 = httpx.get(presigned2, timeout=5.0)
        assert raw_res2.status_code == 200
        assert raw_res2.content == fake_pdf
        print(f"[OK] Step 15: Successfully downloaded Document 2 binary from MinIO ({len(raw_res2.content)} bytes). Integrity verified!")

    print("\n" + "=" * 60)
    print("ALL 15 INTEGRATION TEST PHASES PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e()
