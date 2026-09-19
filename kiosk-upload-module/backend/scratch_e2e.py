"""Live end-to-end verification script against real running services."""
import hashlib
import io
import sys
import httpx
from minio import Minio

BASE_URL = "http://localhost:8010/api/v1"


def run_e2e_verification():
    print("==================================================")
    print("LIVE E2E TEST: STANDALONE KIOSK DOCUMENT UPLOAD")
    print("==================================================")

    # 1. Health check
    print("\n[1] Verifying Backend & MinIO Health...")
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        print(f"    Health OK: {data}")
        assert data["storage"]["connected"] is True, "MinIO is not connected!"

        # 2. Kiosk initiates session
        print("\n[2] Kiosk creating upload session...")
        create_payload = {
            "ttl_seconds": 600,
            "allowed_types": ["image/png", "image/jpeg", "application/pdf"],
            "max_size_mb": 15,
            "metadata": {
                "terminal_id": "KIOSK-E2E-LIVE-01",
                "flow": "patient_document_intake"
            }
        }
        res = client.post("/sessions", json=create_payload)
        assert res.status_code == 201, f"Session creation failed: {res.text}"
        session_data = res.json()
        session_id = session_data["session_id"]
        upload_url = session_data["upload_url"]
        assert session_data["status"] == "WAITING"
        raw_token = upload_url.split("/upload/")[-1]
        print(f"    Session Created: id={session_id}")
        print(f"    Upload URL: {upload_url}")
        print(f"    Raw Secret Token: {raw_token[:10]}... (256-bit entropy)")

        # 3. Kiosk verifies session status is WAITING
        print("\n[3] Kiosk polling session status...")
        res = client.get(f"/sessions/{session_id}")
        assert res.status_code == 200
        assert res.json()["status"] == "WAITING"
        print(f"    Status confirmed: {res.json()['status']}")

        # 4. Mobile phone scans QR code and performs handshake
        print("\n[4] Phone scanning QR code -> Handshake GET /upload/{token}...")
        res = client.get(f"/upload/{raw_token}")
        assert res.status_code == 200, f"Handshake failed: {res.text}"
        handshake_data = res.json()
        print(f"    Handshake OK: {handshake_data}")
        assert handshake_data["status"] == "CONNECTED"

        # 5. Kiosk confirms phone is connected
        print("\n[5] Kiosk verifying status transitioned to CONNECTED...")
        res = client.get(f"/sessions/{session_id}")
        assert res.json()["status"] == "CONNECTED"
        print("    Kiosk successfully detected: Phone Connected!")

        # 6. Mobile submits binary file (valid PNG)
        print("\n[6] Mobile uploading real document binary (PNG)...")
        # 1x1 valid PNG with chunks
        test_png_bytes = (
            b"\x89PNG\r\n\x1a\n"
            b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
            b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
            b"\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        expected_sha256 = hashlib.sha256(test_png_bytes).hexdigest()

        files = {"file": ("prescription_sample.png", test_png_bytes, "image/png")}
        res = client.post(f"/upload/{raw_token}", files=files)
        assert res.status_code == 200, f"Upload failed: {res.text}"
        up_result = res.json()
        print(f"    Upload response: {up_result}")
        assert up_result["status"] == "UPLOADED"

        # 7. Kiosk inspects uploaded metadata
        print("\n[7] Kiosk reading session metadata...")
        res = client.get(f"/sessions/{session_id}")
        sess_details = res.json()
        assert sess_details["status"] == "UPLOADED"
        meta = sess_details["file_metadata"]
        print(f"    File Name: {meta['file_name']}")
        print(f"    File Size: {meta['file_size']} bytes")
        print(f"    MIME Type: {meta['content_type']}")
        print(f"    SHA-256:   {meta['sha256']}")
        assert meta["sha256"] == expected_sha256

        # 8. Direct MinIO object verification
        print("\n[8] Verifying direct object storage binary in MinIO (localhost:9000)...")
        minio_client = Minio(
            endpoint="localhost:9000",
            access_key="minioadmin",
            secret_key="minioadminpassword",
            secure=False
        )
        # Find object key from preview or download
        res_prev = client.get(f"/sessions/{session_id}/preview-url")
        assert res_prev.status_code == 200
        preview_url = res_prev.json()["url"]
        print(f"    Presigned Preview URL generated: {preview_url[:80]}...")

        # 9. Kiosk consumes session
        print("\n[9] Kiosk consuming session and finalizing document...")
        res = client.post(f"/sessions/{session_id}/consume")
        assert res.status_code == 200, f"Consume failed: {res.text}"
        consume_res = res.json()
        assert consume_res["status"] == "CONSUMED"
        storage_ref = consume_res["storage_reference"]
        print(f"    Storage Reference: {storage_ref}")

        # Download directly from MinIO to verify exact binary matches
        minio_obj = minio_client.get_object(storage_ref["bucket"], storage_ref["object_key"])
        downloaded_bytes = minio_obj.read()
        minio_obj.close()
        minio_obj.release_conn()

        assert downloaded_bytes == test_png_bytes, "MinIO binary does not match uploaded bytes!"
        print("    Binary verification SUCCESSFUL: Exact byte-for-byte match in MinIO!")

        # 10. Security: Attempt re-upload to consumed session
        print("\n[10] Security Guard: Attempting re-upload on consumed session...")
        res_reupload = client.post(f"/upload/{raw_token}", files=files)
        assert res_reupload.status_code == 410, f"Expected 410 Gone, got: {res_reupload.status_code}"
        print(f"    Re-upload blocked as expected: HTTP {res_reupload.status_code} ({res_reupload.json()['detail']})")

    print("\n==================================================")
    print("ALL LIVE END-TO-END VERIFICATION CHECKS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_e2e_verification()
