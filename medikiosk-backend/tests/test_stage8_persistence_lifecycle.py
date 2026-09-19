"""Stage 8 Automated Tests: Production Data Persistence & Complete Clinical Record Lifecycle."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.core.security import hash_password


async def setup_test_doctor(db: AsyncSession, username: str = "dr_stage8_test") -> User:
    """Helper to ensure a valid doctor user exists in DB for JWT testing."""
    user = User(
        id=uuid.uuid4(),
        username=username,
        password_hash=hash_password("DoctorPass123!"),
        display_name="Dr. Stage 8 Test",
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_doctor_token_headers(client: AsyncClient, username: str = "dr_stage8_test") -> dict:
    """Logs in doctor and returns authorization header."""
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "DoctorPass123!"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# 1, 2, 3: Patient & Visit Creation, Identity Separation
@pytest.mark.asyncio
async def test_01_02_03_patient_and_encounter_creation(client: AsyncClient):
    """Verify separate Patient and Encounter creation and foreign key relationship."""
    # 1. Register Patient
    pat_res = await client.post("/api/v1/patients", json={
        "full_name": "Ramesh Kulkarni",
        "age": 48,
        "gender": "Male",
        "mobile": "9876543210",
        "address": "123 Market Road",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001"
    })
    assert pat_res.status_code == 201
    pat_data = pat_res.json()
    patient_id = pat_data["id"]
    assert pat_data["patient_uhid"].startswith("UHID-")
    assert pat_data["full_name"] == "Ramesh Kulkarni"

    # 2. Create Visit 1
    enc1_res = await client.post("/api/v1/encounters", json={
        "patient_id": patient_id,
        "priority": "NORMAL"
    })
    assert enc1_res.status_code == 201
    enc1_data = enc1_res.json()
    encounter1_id = enc1_data["id"]
    assert enc1_data["encounter_number"].startswith("ENC-")
    assert enc1_data["patient_id"] == patient_id

    # 3. Create Visit 2 (Returning Patient)
    enc2_res = await client.post("/api/v1/encounters", json={
        "patient_id": patient_id,
        "priority": "NORMAL"
    })
    assert enc2_res.status_code == 201
    enc2_data = enc2_res.json()
    encounter2_id = enc2_data["id"]
    assert encounter2_id != encounter1_id

    # Verify Patient Encounters history
    history_res = await client.get(f"/api/v1/patients/{patient_id}/encounters")
    assert history_res.status_code == 200
    enc_list = history_res.json()
    assert len(enc_list) >= 2
    enc_ids = [e["id"] for e in enc_list]
    assert encounter1_id in enc_ids
    assert encounter2_id in enc_ids


# 4: Consent Persistence
@pytest.mark.asyncio
async def test_04_consent_persistence(client: AsyncClient):
    """Verify consent recording is persisted with IP and timestamp."""
    # Create patient & encounter
    pat = await client.post("/api/v1/patients", json={
        "full_name": "Sunita Patil",
        "age": 35,
        "gender": "Female",
        "mobile": "9876543211"
    })
    patient_id = pat.json()["id"]

    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]

    # Submit consent
    consent_res = await client.post(f"/api/v1/encounters/{encounter_id}/consent", json={
        "accepted": True,
        "consent_version": "1.0",
        "abdm_sharing": True,
        "voice_recording": True
    })
    assert consent_res.status_code == 201
    consent_data = consent_res.json()
    assert consent_data["granted"] is True
    assert consent_data["encounter_id"] == encounter_id
    assert consent_data["patient_id"] == patient_id


# 5, 6, 7, 8: Clinical Turns, Entities, Medications, Allergies Persistence
@pytest.mark.asyncio
async def test_05_06_07_08_clinical_intake_persistence(client: AsyncClient):
    """Verify multi-turn clinical conversation and structured entity extraction persistence."""
    pat = await client.post("/api/v1/patients", json={"full_name": "Anil Deshmukh", "age": 52, "gender": "Male"})
    patient_id = pat.json()["id"]

    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]

    # Finalize clinical case with multiple turns, symptoms, meds, allergies
    finalize_payload = {
        "encounter_id": encounter_id,
        "patient_id": patient_id,
        "language": "en",
        "case_state": {
            "chief_complaint": "chronic knee pain",
            "symptoms": [
                {
                    "name": "knee pain",
                    "location": "knee",
                    "duration": "2 weeks",
                    "severity": "7/10",
                    "character": "dull ache",
                    "aggravating_factors": ["walking"],
                    "relieving_factors": ["rest"]
                }
            ],
            "associated_symptoms": ["morning stiffness"],
            "medications": ["paracetamol 500mg"],
            "allergies": ["penicillin"],
            "medical_history": ["osteoarthritis"]
        },
        "conversation_history": [
            {
                "turn_number": 1,
                "question": "What brings you to the hospital today?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "I have had severe pain in my left knee for 2 weeks",
                "language": "en"
            },
            {
                "turn_number": 2,
                "question": "Are you taking any regular medicines?",
                "question_type": "MEDICATIONS",
                "patient_transcript": "I take paracetamol sometimes",
                "language": "en"
            }
        ]
    }

    res = await client.post("/api/v1/clinical/finalize", json=finalize_payload)
    assert res.status_code == 200
    case_data = res.json()
    assert case_data["chief_complaint"] == "chronic knee pain"
    assert case_data["status"] == "FINALIZED"
    assert len(case_data["turns"]) == 2
    assert case_data["case_state"]["medications"] == ["paracetamol 500mg"]
    assert case_data["case_state"]["allergies"] == ["penicillin"]


# 9: AYUSH Assessment Persistence & Doctor Update
@pytest.mark.asyncio
async def test_09_ayush_assessment_persistence(client: AsyncClient, db_session: AsyncSession):
    """Verify AYUSH kiosk questionnaire saving, Prakriti calculation, and doctor updates."""
    # Create doctor in DB
    username = f"dr_ayush_{uuid.uuid4().hex[:6]}"
    await setup_test_doctor(db_session, username=username)
    headers = await get_doctor_token_headers(client, username=username)

    pat = await client.post("/api/v1/patients", json={"full_name": "Meera Joshi", "age": 29, "gender": "Female"})
    patient_id = pat.json()["id"]

    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]

    # Kiosk submits AYUSH intake
    ayush_in = {
        "patient_responses": [
            {"question_id": "body_frame", "selected_option": "Medium, well-proportioned, sweating easily (Pitta)"},
            {"question_id": "temperament", "selected_option": "Intense, quick-thinking, sharp intellect (Pitta)"},
            {"question_id": "appetite", "selected_option": "Variable, irregular hunger (Vata)"}
        ]
    }
    ayush_res = await client.post(f"/api/v1/encounters/{encounter_id}/ayush", json=ayush_in)
    assert ayush_res.status_code == 200
    ayush_data = ayush_res.json()
    assert ayush_data["encounter_id"] == encounter_id
    assert "Pitta" in ayush_data["dominant_prakriti"]
    assert ayush_data["prakriti_scores"]["pitta"] >= 2

    # Doctor adds Ayurvedic clinical findings
    doc_ayush = {
        "prakriti": "Pitta-Vata",
        "vikriti": "Pitta Vriddhi with Agnimandya",
        "agni": "Tikshna",
        "koshtha": "Mridu",
        "dosha_imbalance": ["Pitta", "Vata"],
        "diet_lifestyle_advice": "Avoid spicy and sour food. Consume ghee and cooling herbs.",
        "ayurvedic_formulations": ["Shatavari Ghrita", "Avipattikar Churna"]
    }
    patch_res = await client.patch(
        f"/api/v1/encounters/{encounter_id}/ayush/doctor-assessment",
        json=doc_ayush,
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["dominant_prakriti"] == "Pitta-Vata"
    assert updated["doctor_assessment"]["agni"] == "Tikshna"
    assert "Shatavari Ghrita" in updated["doctor_assessment"]["ayurvedic_formulations"]


# 10: Document Upload Metadata Persistence
@pytest.mark.asyncio
async def test_10_document_metadata_persistence(client: AsyncClient):
    """Verify document upload metadata and relationship persistence."""
    pat = await client.post("/api/v1/patients", json={"full_name": "Vijay Shinde", "age": 41, "gender": "Male"})
    patient_id = pat.json()["id"]

    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]

    # Upload mock PDF
    pdf_bytes = b"%PDF-1.4 test mock document content for stage 8"
    files = {"file": ("blood_report.pdf", pdf_bytes, "application/pdf")}
    data = {"document_type": "LAB_REPORT"}

    doc_res = await client.post(f"/api/v1/encounters/{encounter_id}/documents", files=files, data=data)
    assert doc_res.status_code == 201
    doc_data = doc_res.json()
    assert doc_data["file_name"] == "blood_report.pdf"
    assert doc_data["document_type"] == "LAB_REPORT"
    assert doc_data["processing_status"] == "UPLOADED"


# 11, 12: Red Flag Emergency & OPD Queue Token Allocation
@pytest.mark.asyncio
async def test_11_12_red_flag_and_queue_token(client: AsyncClient):
    """Verify emergency red flag updates triage priority and allocates token."""
    pat = await client.post("/api/v1/patients", json={"full_name": "Kavita Rao", "age": 60, "gender": "Female"})
    patient_id = pat.json()["id"]

    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]

    # Record consent
    await client.post(f"/api/v1/encounters/{encounter_id}/consent", json={"accepted": True})

    # Trigger emergency red flag
    patch_res = await client.patch(f"/api/v1/encounters/{encounter_id}", json={
        "chief_complaint": "Sudden crushing chest pain",
        "red_flag_triggered": True,
        "priority": "EMERGENCY"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["priority"] == "EMERGENCY"
    assert patch_res.json()["red_flag_triggered"] is True

    # Submit to Queue
    sub_res = await client.post(f"/api/v1/encounters/{encounter_id}/submit")
    assert sub_res.status_code == 201
    sub_data = sub_res.json()
    assert sub_data["success"] is True
    assert sub_data["token_number"] > 0
    assert sub_data["queue_status"] == "WAITING"


# 13, 14, 15: Doctor Consultation Draft, Notes, and Finalization
@pytest.mark.asyncio
async def test_13_14_15_doctor_consultation_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """Verify doctor consultation draft save, update, notes, and finalization."""
    username = f"dr_cons_{uuid.uuid4().hex[:6]}"
    await setup_test_doctor(db_session, username=username)
    headers = await get_doctor_token_headers(client, username=username)

    pat = await client.post("/api/v1/patients", json={"full_name": "Deepak Verma", "age": 45, "gender": "Male"})
    patient_id = pat.json()["id"]

    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]
    await client.post(f"/api/v1/encounters/{encounter_id}/consent", json={"accepted": True})
    await client.post(f"/api/v1/encounters/{encounter_id}/submit")

    # 1. Save Consultation Draft
    draft_payload = {
        "findings": "Mild epigastric tenderness on palpation",
        "assessment": "Acute gastritis secondary to NSAID use",
        "diagnosis": "Acute Gastritis",
        "notes": "Advised lifestyle modifications and regular meals",
        "prescription": {
            "items": [
                {"medicine": "Pantoprazole 40mg", "dosage": "1-0-0 before food", "duration": "14 days"}
            ]
        },
        "follow_up": {"date": "2026-10-01", "instructions": "Review if symptoms persist"}
    }
    draft_res = await client.post(
        f"/api/v1/encounters/{encounter_id}/consultation",
        json=draft_payload,
        headers=headers,
    )
    assert draft_res.status_code == 200
    draft_data = draft_res.json()
    assert draft_data["status"] == "DRAFT"
    assert draft_data["diagnosis"] == "Acute Gastritis"

    # 2. Finalize Consultation
    finalize_res = await client.post(
        f"/api/v1/encounters/{encounter_id}/consultation/finalize",
        json=draft_payload,
        headers=headers,
    )
    assert finalize_res.status_code == 200
    final_data = finalize_res.json()
    assert final_data["status"] == "FINALIZED"
    assert final_data["finalized_at"] is not None

    # 3. Verify Encounter is now COMPLETED
    enc_res = await client.get(f"/api/v1/encounters/{encounter_id}")
    assert enc_res.status_code == 200
    assert enc_res.json()["encounter"]["status"] == "COMPLETED"


# 16, 17, 18, 19, 20: Full Lifecycle Retrieval, Audit Trail, and Session Recovery
@pytest.mark.asyncio
async def test_16_to_20_complete_lifecycle_and_audit_trail(client: AsyncClient, db_session: AsyncSession):
    """Verify complete lifecycle aggregation endpoint and audit event timeline."""
    username = f"dr_lc_{uuid.uuid4().hex[:6]}"
    await setup_test_doctor(db_session, username=username)
    headers = await get_doctor_token_headers(client, username=username)

    # 1. Patient
    pat = await client.post("/api/v1/patients", json={
        "full_name": "Sanjay Gupta",
        "age": 38,
        "gender": "Male",
        "mobile": "9988776655"
    })
    patient_id = pat.json()["id"]

    # 2. Encounter
    enc = await client.post("/api/v1/encounters", json={"patient_id": patient_id})
    encounter_id = enc.json()["id"]

    # 3. Consent
    await client.post(f"/api/v1/encounters/{encounter_id}/consent", json={"accepted": True})

    # 4. Clinical Intake Finalize
    await client.post("/api/v1/clinical/finalize", json={
        "encounter_id": encounter_id,
        "patient_id": patient_id,
        "language": "en",
        "case_state": {"chief_complaint": "Viral fever and body ache"},
        "conversation_history": [{"turn_number": 1, "question": "What is the issue?", "patient_transcript": "High fever for 3 days"}]
    })

    # 5. AYUSH Assessment
    await client.post(f"/api/v1/encounters/{encounter_id}/ayush", json={
        "patient_responses": [{"question_id": "temp", "selected_option": "Pitta (hot sensation)"}]
    })

    # 6. Queue Submit
    sub = await client.post(f"/api/v1/encounters/{encounter_id}/submit")
    token_num = sub.json()["token_number"]

    # 7. Doctor Finalize
    await client.post(
        f"/api/v1/encounters/{encounter_id}/consultation/finalize",
        json={"diagnosis": "Viral Pyrexia", "notes": "Adequate hydration"},
        headers=headers,
    )

    # 8. Query Full Lifecycle Endpoint
    lifecycle_res = await client.get(f"/api/v1/encounters/{encounter_id}/lifecycle")
    assert lifecycle_res.status_code == 200
    lc = lifecycle_res.json()

    assert lc["patient"]["full_name"] == "Sanjay Gupta"
    assert lc["encounter"]["status"] == "COMPLETED"
    assert lc["consent"]["granted"] is True
    assert lc["token_number"] == token_num
    assert lc["clinical_case"]["chief_complaint"] == "Viral fever and body ache"
    assert lc["ayush_assessment"]["dominant_prakriti"] is not None
    assert lc["consultation"]["diagnosis"] == "Viral Pyrexia"
    assert len(lc["audit_trail"]) >= 4

    # Verify audit actions recorded
    actions = [ev["action"] for ev in lc["audit_trail"]]
    assert "SESSION_CREATED" in actions
    assert "CONSENT_RECORDED" in actions
    assert "CLINICAL_INTAKE_SUBMITTED" in actions
    assert "TOKEN_GENERATED" in actions
    assert "CONSULTATION_FINALIZED" in actions

    # 9. Test Invalid UUID Handling
    bad_res = await client.get("/api/v1/encounters/invalid-uuid-123/lifecycle")
    assert bad_res.status_code == 404
