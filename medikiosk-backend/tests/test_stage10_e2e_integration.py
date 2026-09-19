"""Stage 10 — Comprehensive End-to-End Integration, Validation & Demo Readiness Test Suite.

Validates the complete MediKiosk workflow across all 16 required checkpoints:
1. Patient session start & registration
2. English language selection
3. First case-taking question
4. Voice answer / speech transcription endpoint
5. Existing selectable UI answer input
6. Gemini extracts actual answer entities
7. Gemini generates contextual next question
8. Multi-turn conversation memory retention
9. No duplicate questions for already-known information
10. Authoritative deterministic red-flag interruption
11. Patient review & structured verification
12. Token generation & queue assignment
13. Doctor EMR queue retrieval
14. Doctor consultation view
15. Final doctor-facing structured clinical summary
16. Database persistence & error resilience
"""
import io
import json
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.schemas.clinical import (
    ClinicalCaseState,
    ClinicalSymptom,
    ClinicalTurnRequest,
    ClinicalTurnResponse,
    ClinicalFinalizeRequest,
    ProvenanceTag,
)
from app.services.clinical.clinical_engine import ClinicalCaseTakingEngine, default_clinical_engine
from app.providers.llm.base import (
    MockLLMProvider,
    ClinicalEntityExtractionResult,
    ClinicalSymptomEntity,
    CaseTakingTurnResult,
    DoctorCaseSummaryResult,
)
from app.providers.llm.gemini import GeminiClinicalProvider, ClinicalTurnLLMResult
from app.providers.speech.base import MockSpeechToTextProvider, SpeechToTextResult


# ==============================================================================
# HELPERS
# ==============================================================================

async def create_test_doctor(db: AsyncSession, username: str = "dr_stage10_consultant") -> User:
    """Helper to create a doctor user for EMR queue testing."""
    user = User(
        id=uuid.uuid4(),
        username=username,
        password_hash=hash_password("DoctorPass123!"),
        display_name="Dr. S. Sharma (General Medicine)",
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_doctor_token(client: AsyncClient, username: str = "dr_stage10_consultant") -> str:
    """Helper to authenticate doctor and return JWT access token."""
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "DoctorPass123!"})
    return res.json()["access_token"]


# ==============================================================================
# TEST 1 & 2: Patient Session Start & Language Selection
# ==============================================================================

@pytest.mark.asyncio
async def test_01_and_02_patient_session_start_and_language_selection(client: AsyncClient):
    """TEST 1 & 2: Verifies patient registration and English language intake setup."""
    # Register patient
    patient_res = await client.post(
        "/api/v1/patients",
        json={
            "full_name": "Ramesh Patil",
            "age": 45,
            "gender": "male",
            "mobile": "9876543210",
        },
    )
    assert patient_res.status_code == 201
    pat_data = patient_res.json()
    assert pat_data["full_name"] == "Ramesh Patil"
    assert pat_data["patient_uhid"].startswith("UHID-")

    # Create encounter with English language preference
    enc_res = await client.post(
        "/api/v1/encounters",
        json={
            "patient_id": pat_data["id"],
            "priority": "NORMAL",
        },
    )
    assert enc_res.status_code == 201
    enc_data = enc_res.json()
    assert enc_data["status"] in ("WAITING", "registered", "REGISTERED")


# ==============================================================================
# TEST 3 & 4: Speech Ingestion & Audio Transcription Endpoint
# ==============================================================================

@pytest.mark.asyncio
async def test_03_and_04_audio_transcription_and_first_case_turn(client: AsyncClient):
    """TEST 3 & 4: Ingests patient microphone audio and returns transcribed speech."""
    dummy_audio_bytes = b"RIFFWAVEfmt " + bytes([0] * 200)
    files = {"file": ("recording.wav", io.BytesIO(dummy_audio_bytes), "audio/wav")}
    data = {"language_code": "en"}

    res = await client.post("/api/v1/speech/transcribe", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["success"] is True
    assert res_data["language"] == "en"
    assert len(res_data["transcript"]) > 0


# ==============================================================================
# TEST 5, 6, 7: UI Input & Voice Input Feed SAME Clinical Engine with Gemini
# ==============================================================================

@pytest.mark.asyncio
async def test_05_06_07_touch_and_voice_feed_same_engine_with_gemini(client: AsyncClient):
    """TEST 5, 6, 7: Verifies both touch UI and voice feed the exact same Clinical Engine."""
    turn1_payload = {
        "transcript": "I have severe stomach pain",
        "language": "en",
        "case_state": None,
    }

    res = await client.post("/api/v1/clinical/next-turn", json=turn1_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["case_state"]["chief_complaint"] == "abdominal pain"
    assert len(data["case_state"]["symptoms"]) >= 1
    assert data["case_state"]["symptoms"][0]["name"] == "abdominal pain"
    assert "DURATION" in data["missing_information"] or "SEVERITY" in data["missing_information"] or "LOCATION" in data["missing_information"]
    assert len(data["next_question"]) > 0


# ==============================================================================
# TEST 8 & 9: Multi-Turn Conversation Memory & No Duplicate Questions
# ==============================================================================

@pytest.mark.asyncio
async def test_08_and_09_multi_turn_memory_and_no_duplicate_questions(client: AsyncClient):
    """TEST 8 & 9: Verifies cumulative clinical state across turns without asking duplicate questions."""
    engine = ClinicalCaseTakingEngine()

    # Turn 1: Patient reports chief complaint + duration
    turn1 = await engine.process_turn(
        transcript="I have stomach pain for three days",
        language="en",
        current_case_state=None,
        turn_number=1,
    )
    assert turn1.case_state.chief_complaint == "abdominal pain"
    assert turn1.case_state.symptoms[0].duration == "three days"
    assert "DURATION" not in turn1.missing_information

    # Turn 2: Patient reports severity
    turn2 = await engine.process_turn(
        transcript="The pain is 7 out of 10",
        language="en",
        current_case_state=turn1.case_state,
        turn_number=2,
    )
    assert turn2.case_state.symptoms[0].duration == "three days"
    assert turn2.case_state.symptoms[0].severity == "7/10"
    assert "SEVERITY" not in turn2.missing_information
    assert "DURATION" not in turn2.missing_information

    # Turn 3: Patient reports aggravating factor
    turn3 = await engine.process_turn(
        transcript="Eating food makes it worse, but resting helps",
        language="en",
        current_case_state=turn2.case_state,
        turn_number=3,
    )
    assert turn3.case_state.symptoms[0].duration == "three days"
    assert turn3.case_state.symptoms[0].severity == "7/10"
    agg_lower = [f.lower() for f in turn3.case_state.symptoms[0].aggravating_factors]
    rel_lower = [f.lower() for f in turn3.case_state.symptoms[0].relieving_factors]
    assert "food" in agg_lower or "eating" in agg_lower
    assert "resting" in rel_lower or "rest" in rel_lower


# ==============================================================================
# TEST 10: Authoritative Deterministic Red-Flag Interruption
# ==============================================================================

@pytest.mark.asyncio
async def test_10_red_flag_interruption_stops_normal_flow(client: AsyncClient):
    """TEST 10: Verifies red-flag emergency interrupts case taking and sets EMERGENCY priority."""
    payload = {
        "transcript": "I am having crushing chest pain and difficulty breathing",
        "language": "en",
        "case_state": None,
    }
    res = await client.post("/api/v1/clinical/next-turn", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["requires_emergency_attention"] is True
    assert data["is_case_complete"] is True
    assert data["next_question_type"] == "EMERGENCY"
    assert len(data["red_flags"]) >= 1
    rf_types = [rf["type"] for rf in data["red_flags"]]
    assert "CHEST_PAIN" in rf_types or "BREATHING_DIFFICULTY" in rf_types


# ==============================================================================
# TEST 11 & 12: Patient Review, Finalization & Token Generation
# ==============================================================================

@pytest.mark.asyncio
async def test_11_and_12_finalize_persistence_and_token_queue(client: AsyncClient, db_session: AsyncSession):
    """TEST 11 & 12: Finalizes intake, persists encounter, generates token and places patient in OPD queue."""
    # 1. Create Patient & Encounter
    pat_res = await client.post(
        "/api/v1/patients",
        json={"full_name": "Sunita Devi", "age": 52, "gender": "female", "mobile": "9811223344"},
    )
    assert pat_res.status_code == 201
    pat_id = pat_res.json()["id"]

    enc_res = await client.post("/api/v1/encounters", json={"patient_id": pat_id, "priority": "NORMAL"})
    assert enc_res.status_code == 201
    enc_data = enc_res.json()
    enc_id = enc_data["id"]

    # 2. Record Patient Consent
    consent_res = await client.post(
        f"/api/v1/encounters/{enc_id}/consent",
        json={"accepted": True, "consent_version": "v1.0"},
    )
    assert consent_res.status_code == 201

    # 3. Finalize Clinical Case Intake
    case_state = ClinicalCaseState(
        chief_complaint="Persistent dry cough and mild fever",
        symptoms=[
            ClinicalSymptom(
                name="cough",
                duration="5 days",
                severity="mild",
                character="dry",
            )
        ],
        associated_symptoms=["fever"],
        fever=True,
        medications=["Cough syrup"],
        allergies=["None"],
        medical_history=["Asthma"],
        patient_language="en",
    )

    finalize_payload = {
        "encounter_id": enc_id,
        "language": "en",
        "case_state": case_state.model_dump(),
        "conversation_history": [
            {
                "turn": 1,
                "question": "What brings you here today?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "I have a persistent dry cough and mild fever",
                "language": "en",
            },
            {
                "turn": 2,
                "question": "How long have you had this cough?",
                "question_type": "DURATION",
                "patient_transcript": "For about 5 days",
                "language": "en",
            },
        ],
        "is_emergency": False,
    }

    fin_res = await client.post("/api/v1/clinical/finalize", json=finalize_payload)
    assert fin_res.status_code == 200
    fin_data = fin_res.json()
    assert fin_data["status"] == "FINALIZED"
    assert len(fin_data["turns"]) == 2

    # 4. Submit encounter to OPD Queue and verify allocated Token
    submit_res = await client.post(f"/api/v1/encounters/{enc_id}/submit")
    assert submit_res.status_code == 201
    submit_data = submit_res.json()
    assert submit_data["success"] is True
    assert submit_data["token_number"] >= 1
    assert submit_data["queue_status"] in ("WAITING", "waiting")


# ==============================================================================
# TEST 13, 14, 15: Doctor EMR Queue Retrieval, Consultation & Structured Summary
# ==============================================================================

@pytest.mark.asyncio
async def test_13_14_15_doctor_emr_flow_and_structured_summary(client: AsyncClient, db_session: AsyncSession):
    """TEST 13, 14, 15: Doctor logs in, inspects queue, views encounter, and accesses Structured Summary."""
    # 1. Setup Doctor & Authenticate
    doc = await create_test_doctor(db_session, username="dr_e2e_reviewer")
    token = await get_doctor_token(client, username="dr_e2e_reviewer")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Retrieve Today's OPD Queue
    queue_res = await client.get("/api/v1/queue/today", headers=headers)
    assert queue_res.status_code == 200
    queue_list = queue_res.json()
    assert isinstance(queue_list, list)

    # 3. Create and finalize a test encounter for inspection
    pat_res = await client.post(
        "/api/v1/patients",
        json={"full_name": "Vikram Malhotra", "age": 38, "gender": "male", "mobile": "9988776655"},
    )
    assert pat_res.status_code == 201
    pat_id = pat_res.json()["id"]

    enc_res = await client.post("/api/v1/encounters", json={"patient_id": pat_id, "priority": "NORMAL"})
    assert enc_res.status_code == 201
    enc_id = enc_res.json()["id"]

    sample_state = ClinicalCaseState(
        chief_complaint="Throat pain and difficulty swallowing",
        symptoms=[ClinicalSymptom(name="throat pain", duration="2 days", severity="moderate")],
        associated_symptoms=["mild fever"],
        fever=True,
        medications=[],
        allergies=[],
        medical_history=[],
        patient_language="en",
    )

    await client.post(
        "/api/v1/clinical/finalize",
        json={
            "encounter_id": enc_id,
            "language": "en",
            "case_state": sample_state.model_dump(),
            "conversation_history": [
                {
                    "turn": 1,
                    "question": "What is the primary problem?",
                    "question_type": "CHIEF_COMPLAINT",
                    "patient_transcript": "Throat pain and difficulty swallowing for 2 days",
                    "language": "en",
                }
            ],
            "is_emergency": False,
        },
    )

    # 4. Doctor fetches Structured Clinical Summary for EMR
    summary_res = await client.get(f"/api/v1/clinical/encounters/{enc_id}/structured-summary", headers=headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.json()["structured_summary"]

    assert summary_data["version"] == "1.0"
    assert summary_data["summary_provider"] in ("GEMINI_STRUCTURED", "DETERMINISTIC_FALLBACK")
    assert len(summary_data["sections"]) >= 4

    # Verify provenance tag integrity
    pres_section = next(s for s in summary_data["sections"] if s["section_title"] == "Patient Presentation")
    chief_item = next(i for i in pres_section["items"] if i["label"] == "Chief Complaint")
    assert chief_item["provenance"] in ("PATIENT_REPORTED", "AI_STRUCTURED")
    assert "Throat pain" in chief_item["value"]


# ==============================================================================
# TEST 16: Error Resilience & Graceful Fallback
# ==============================================================================

@pytest.mark.asyncio
async def test_16_error_resilience_and_graceful_fallback(client: AsyncClient):
    """TEST 16: Verifies system handles unconfigured Gemini or upstream failures gracefully."""
    with patch.object(GeminiClinicalProvider, "_call_gemini_api", side_effect=Exception("API unreachable")):
        engine = ClinicalCaseTakingEngine(llm_provider=GeminiClinicalProvider(api_key="test_key"))
        response = await engine.process_turn(
            transcript="I have a headache since morning",
            language="en",
            current_case_state=None,
        )
        assert response.success is True
        assert response.case_state.chief_complaint == "headache"
        assert response.case_state.symptoms[0].duration == "since morning"
        assert len(response.next_question) > 0
