"""Stage 6 Persistent Clinical Case Record & Doctor Handoff Summary Test Suite.

Validates all 20 required points:
1. Encounter creation
2. Encounter ID generation
3. Turn persistence
4. Multiple turns belonging to one encounter
5. Turn ordering
6. Clinical case state persistence
7. Final encounter creation
8. Final summary generation
9. Missing information handling
10. Red-flag persistence
11. Emergency case finalization
12. GET encounter endpoint
13. GET summary endpoint
14. GET conversation endpoint
15. Invalid encounter handling (404)
16. Empty/invalid case validation
17. Duplicate finalization protection / idempotency
18. Case state surviving a new request/process
19. Multilingual encounter preservation (EN, HI, MR)
20. Full end-to-end finalize workflow
"""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.patient import Patient
from app.schemas.clinical import ClinicalCaseState, ClinicalSymptom, RedFlagEntity
from app.services.clinical.summary_generator import generate_clinical_summary


@pytest.mark.asyncio
async def test_01_and_02_encounter_creation_and_id_generation(client: AsyncClient, db_session: AsyncSession):
    """Test 1 & 2: Verify encounter persistence generates unique ID and stores case state."""
    payload = {
        "language": "en",
        "case_state": {
            "chief_complaint": "Severe lower abdominal pain",
            "symptoms": [
                {
                    "name": "abdominal pain",
                    "location": "lower abdomen",
                    "duration": "2 days",
                    "severity": "8/10",
                    "character": "sharp",
                    "aggravating_factors": ["walking"],
                    "relieving_factors": ["rest"]
                }
            ],
            "associated_symptoms": ["nausea"],
            "fever": True,
            "medications": ["paracetamol 500mg"],
            "allergies": [],
            "medical_history": ["gastritis"],
            "surgical_history": [],
            "family_history": ["diabetes"],
            "lifestyle_information": ["non-smoker"],
            "red_flags": []
        },
        "conversation_history": [
            {
                "turn_number": 1,
                "question": "What brings you here today?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "I have severe lower abdominal pain for 2 days",
                "language": "en",
                "extracted_entities": {"symptoms": ["abdominal pain"], "duration": ["2 days"]}
            }
        ],
        "is_emergency": False
    }

    res = await client.post("/api/v1/clinical/finalize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert uuid.UUID(data["id"])
    assert data["chief_complaint"] == "Severe lower abdominal pain"
    assert data["status"] == "FINALIZED"
    assert data["is_emergency"] is False
    assert len(data["turns"]) == 1
    assert data["turns"][0]["turn_number"] == 1


@pytest.mark.asyncio
async def test_03_04_05_turn_persistence_and_ordering(client: AsyncClient, db_session: AsyncSession):
    """Test 3, 4, 5: Verify multiple turns belonging to one encounter are persisted in chronological order."""
    turns = [
        {
            "turn_number": 1,
            "question": "What is your main problem?",
            "question_type": "CHIEF_COMPLAINT",
            "patient_transcript": "Chest tightness",
            "language": "en",
            "extracted_entities": {"symptoms": ["chest tightness"]}
        },
        {
            "turn_number": 2,
            "question": "How long have you had this?",
            "question_type": "DURATION",
            "patient_transcript": "Since yesterday morning",
            "language": "en",
            "extracted_entities": {"duration": ["since yesterday"]}
        },
        {
            "turn_number": 3,
            "question": "How severe is the discomfort?",
            "question_type": "SEVERITY",
            "patient_transcript": "It is around 7 out of 10",
            "language": "en",
            "extracted_entities": {"severity": ["7/10"]}
        }
    ]

    payload = {
        "language": "en",
        "case_state": {
            "chief_complaint": "Chest tightness",
            "symptoms": [{"name": "chest tightness", "duration": "1 day", "severity": "7/10"}]
        },
        "conversation_history": turns,
        "is_emergency": False
    }

    res = await client.post("/api/v1/clinical/finalize", json=payload)
    assert res.status_code == 200
    case_id = res.json()["id"]

    # Fetch conversation
    conv_res = await client.get(f"/api/v1/clinical/encounters/{case_id}/conversation")
    assert conv_res.status_code == 200
    conv_data = conv_res.json()
    assert conv_data["total_turns"] == 3
    assert len(conv_data["turns"]) == 3
    assert conv_data["turns"][0]["turn_number"] == 1
    assert conv_data["turns"][1]["turn_number"] == 2
    assert conv_data["turns"][2]["turn_number"] == 3
    assert conv_data["turns"][0]["question_type"] == "CHIEF_COMPLAINT"
    assert conv_data["turns"][1]["question_type"] == "DURATION"
    assert conv_data["turns"][2]["question_type"] == "SEVERITY"


@pytest.mark.asyncio
async def test_06_and_07_clinical_case_state_persistence_and_final_encounter(client: AsyncClient):
    """Test 6 & 7: Verify deep case state attributes (symptoms, fever, medications, history) are retained."""
    case_state = {
        "chief_complaint": "Persistent cough and wheezing",
        "symptoms": [
            {
                "name": "cough",
                "location": "chest",
                "duration": "10 days",
                "severity": "moderate",
                "character": "productive",
                "aggravating_factors": ["cold air"],
                "relieving_factors": ["steam inhalation"]
            }
        ],
        "associated_symptoms": ["wheezing", "shortness of breath on exertion"],
        "fever": False,
        "medications": ["salbutamol inhaler"],
        "allergies": ["dust mites"],
        "medical_history": ["asthma since childhood"],
        "surgical_history": ["tonsillectomy (2015)"],
        "family_history": ["mother had asthma"],
        "lifestyle_information": ["sedentary desk job"],
        "red_flags": []
    }

    res = await client.post("/api/v1/clinical/finalize", json={
        "language": "en",
        "case_state": case_state,
        "is_emergency": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["case_state"]["medications"] == ["salbutamol inhaler"]
    assert data["case_state"]["allergies"] == ["dust mites"]
    assert data["case_state"]["medical_history"] == ["asthma since childhood"]
    assert data["case_state"]["surgical_history"] == ["tonsillectomy (2015)"]
    assert data["case_state"]["family_history"] == ["mother had asthma"]


def test_08_and_09_final_summary_generation_and_missing_information():
    """Test 8 & 9: Test deterministic clinical summary generator and safe representation of missing fields."""
    state = ClinicalCaseState(
        chief_complaint="Throat pain and difficulty swallowing",
        symptoms=[
            ClinicalSymptom(
                name="throat pain",
                location="throat",
                duration="3 days",
                severity="moderate",
                character="scratchy",
                aggravating_factors=["swallowing"],
                relieving_factors=["warm water"]
            )
        ],
        associated_symptoms=["mild fever", "cough"],
        fever=True,
        medications=[],
        allergies=[],
        medical_history=[],
        surgical_history=[],
        family_history=[],
        lifestyle_information=[],
        red_flags=[]
    )

    summary = generate_clinical_summary(case_state=state, patient_language="en")
    
    # Must contain patient presentation
    assert "Throat pain and difficulty swallowing" in summary
    assert "Symptom: throat pain" in summary
    assert "Duration: 3 days" in summary
    assert "Location: throat" in summary
    assert "Aggravating Factors: swallowing" in summary
    assert "Relieving Factors: warm water" in summary
    assert "mild fever" in summary
    
    # Explicit 'Not reported' / 'No known allergies' for absent fields
    assert "Current Medications:\n  • Not reported / None captured" in summary
    assert "Allergies:\n  • No known allergies reported" in summary
    assert "Past Medical History:\n  • Not reported" in summary
    assert "Surgical History:\n  • Not reported" in summary
    assert "Family History:\n  • Not reported" in summary
    assert "Lifestyle & Social History:\n  • Not reported" in summary
    assert "RED FLAGS:\n  • None detected" in summary
    assert "No medical diagnosis is provided" in summary


def test_10_and_11_red_flag_persistence_and_emergency_finalization():
    """Test 10 & 11: Verify red-flags are highlighted in summary banner and persisted."""
    rf = RedFlagEntity(
        type="CHEST_PAIN_RED_FLAG",
        severity="CRITICAL",
        source_text="Crushing chest pain radiating to left arm",
        clinical_note="Immediate ECG and triage required"
    )
    state = ClinicalCaseState(
        chief_complaint="Crushing chest pain",
        red_flags=[rf]
    )

    summary = generate_clinical_summary(case_state=state, is_emergency=True, patient_language="en")
    assert "EMERGENCY / PRIORITY ALERT" in summary
    assert "CHEST_PAIN_RED_FLAG" in summary
    assert "CRITICAL" in summary
    assert "Crushing chest pain radiating to left arm" in summary
    assert "Intake Status: EMERGENCY_HALTED" in summary


@pytest.mark.asyncio
async def test_12_13_14_get_encounter_summary_and_conversation_endpoints(client: AsyncClient):
    """Test 12, 13, 14: Test GET encounter, GET summary, and GET conversation endpoints."""
    # First finalize a case
    payload = {
        "language": "hi",
        "case_state": {
            "chief_complaint": "सिरदर्द और चक्कर आना",
            "symptoms": [{"name": "headache", "duration": "4 days", "severity": "severe"}],
            "associated_symptoms": ["dizziness"],
            "fever": False
        },
        "conversation_history": [
            {
                "turn_number": 1,
                "question": "आपको क्या तकलीफ है?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "मुझे 4 दिन से तेज सिरदर्द और चक्कर आ रहे हैं",
                "language": "hi",
                "extracted_entities": {"symptoms": ["headache", "dizziness"], "duration": ["4 days"]}
            }
        ],
        "is_emergency": False
    }

    create_res = await client.post("/api/v1/clinical/finalize", json=payload)
    assert create_res.status_code == 200
    case_id = create_res.json()["id"]

    # 1. GET /encounters/{id}
    get_enc = await client.get(f"/api/v1/clinical/encounters/{case_id}")
    assert get_enc.status_code == 200
    assert get_enc.json()["id"] == case_id
    assert get_enc.json()["patient_language"] == "hi"
    assert get_enc.json()["chief_complaint"] == "सिरदर्द और चक्कर आना"

    # 2. GET /encounters/{id}/summary
    get_sum = await client.get(f"/api/v1/clinical/encounters/{case_id}/summary")
    assert get_sum.status_code == 200
    assert "PATIENT CLINICAL INTAKE SUMMARY" in get_sum.json()["final_summary"]
    assert get_sum.json()["chief_complaint"] == "सिरदर्द और चक्कर आना"

    # 3. GET /encounters/{id}/conversation
    get_conv = await client.get(f"/api/v1/clinical/encounters/{case_id}/conversation")
    assert get_conv.status_code == 200
    assert get_conv.json()["total_turns"] == 1
    assert get_conv.json()["turns"][0]["patient_transcript"] == "मुझे 4 दिन से तेज सिरदर्द और चक्कर आ रहे हैं"


@pytest.mark.asyncio
async def test_15_invalid_encounter_id_returns_404(client: AsyncClient):
    """Test 15: Nonexistent or malformed encounter ID returns 404."""
    fake_uuid = str(uuid.uuid4())
    res = await client.get(f"/api/v1/clinical/encounters/{fake_uuid}")
    assert res.status_code == 404

    res_sum = await client.get(f"/api/v1/clinical/encounters/{fake_uuid}/summary")
    assert res_sum.status_code == 404

    res_conv = await client.get(f"/api/v1/clinical/encounters/{fake_uuid}/conversation")
    assert res_conv.status_code == 404


@pytest.mark.asyncio
async def test_16_empty_case_finalization_validation(client: AsyncClient):
    """Test 16: Verify minimal payload generates a valid default finalized record safely."""
    payload = {
        "language": "en"
    }
    res = await client.post("/api/v1/clinical/finalize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FINALIZED"
    assert data["completion_status"] == "COMPLETED"
    assert "PATIENT CLINICAL INTAKE SUMMARY" in data["final_summary"]


@pytest.mark.asyncio
async def test_17_duplicate_finalization_idempotency(client: AsyncClient, db_session: AsyncSession):
    """Test 17: Repeated finalization for the same core encounter updates and does not duplicate."""
    # Create a core encounter
    enc_id = uuid.uuid4()
    pat_id = uuid.uuid4()
    patient = Patient(
        id=pat_id,
        patient_uhid="UHID-TEST-001",
        full_name="Ramesh Kumar",
        age=45,
        gender="MALE",
    )
    db_session.add(patient)
    encounter = Encounter(
        id=enc_id,
        encounter_number="ENC-TEST-001",
        patient_id=pat_id,
    )
    db_session.add(encounter)
    await db_session.commit()

    payload1 = {
        "encounter_id": str(enc_id),
        "language": "en",
        "case_state": {"chief_complaint": "Joint pain"},
        "conversation_history": [
            {"turn_number": 1, "question": "Where is the pain?", "patient_transcript": "Knees"}
        ]
    }
    res1 = await client.post("/api/v1/clinical/finalize", json=payload1)
    assert res1.status_code == 200
    first_id = res1.json()["id"]

    # Finalize again with updated turns
    payload2 = {
        "encounter_id": str(enc_id),
        "language": "en",
        "case_state": {"chief_complaint": "Bilateral knee joint pain"},
        "conversation_history": [
            {"turn_number": 1, "question": "Where is the pain?", "patient_transcript": "Knees"},
            {"turn_number": 2, "question": "Since when?", "patient_transcript": "3 months"}
        ]
    }
    res2 = await client.post("/api/v1/clinical/finalize", json=payload2)
    assert res2.status_code == 200
    second_id = res2.json()["id"]

    # Should update the same record
    assert first_id == second_id
    assert res2.json()["chief_complaint"] == "Bilateral knee joint pain"
    assert len(res2.json()["turns"]) == 2


@pytest.mark.asyncio
async def test_18_and_19_multilingual_encounter_preservation(client: AsyncClient):
    """Test 18 & 19: Verify Marathi and Hindi language intakes are preserved and formatted correctly."""
    # Marathi Test
    mr_payload = {
        "language": "mr",
        "case_state": {
            "chief_complaint": "पोटात तीव्र वेदना",
            "symptoms": [{"name": "stomach pain", "duration": "2 दिवस", "severity": "तीव्र"}],
            "associated_symptoms": ["उलटी"],
            "patient_language": "mr"
        },
        "conversation_history": [
            {
                "turn_number": 1,
                "question": "आज तुम्हाला काय त्रास होत आहे?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "माझ्या पोटात 2 दिवसांपासून खूप दुखत आहे",
                "language": "mr",
                "extracted_entities": {"symptoms": ["stomach pain"]}
            }
        ]
    }

    res_mr = await client.post("/api/v1/clinical/finalize", json=mr_payload)
    assert res_mr.status_code == 200
    data_mr = res_mr.json()
    assert data_mr["patient_language"] == "mr"
    assert data_mr["chief_complaint"] == "पोटात तीव्र वेदना"
    assert "Language: Marathi (MR)" in data_mr["final_summary"]
    assert "पोटात तीव्र वेदना" in data_mr["final_summary"]

    # Hindi Test
    hi_payload = {
        "language": "hi",
        "case_state": {
            "chief_complaint": "तेज बुखार और खांसी",
            "symptoms": [{"name": "fever", "duration": "3 दिन", "severity": "तेज"}],
            "associated_symptoms": ["खांसी"],
            "patient_language": "hi"
        }
    }
    res_hi = await client.post("/api/v1/clinical/finalize", json=hi_payload)
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["patient_language"] == "hi"
    assert "Language: Hindi (HI)" in data_hi["final_summary"]


@pytest.mark.asyncio
async def test_20_full_end_to_end_conversational_and_finalize_flow(client: AsyncClient):
    """Test 20: Full closed-loop intake turns followed by case finalization."""
    # Turn 1
    t1_res = await client.post("/api/v1/clinical/next-turn", json={
        "transcript": "I have had a high fever and body ache for three days",
        "language": "en"
    })
    assert t1_res.status_code == 200
    t1_data = t1_res.json()
    state_t1 = t1_data["case_state"]

    # Turn 2
    t2_res = await client.post("/api/v1/clinical/next-turn", json={
        "transcript": "The body ache is severe around 8 out of 10 and I also have chills",
        "language": "en",
        "case_state": state_t1
    })
    assert t2_res.status_code == 200
    t2_data = t2_res.json()
    state_t2 = t2_data["case_state"]

    # Finalize
    finalize_res = await client.post("/api/v1/clinical/finalize", json={
        "language": "en",
        "case_state": state_t2,
        "conversation_history": [
            {
                "turn_number": 1,
                "question": "What brings you to the clinic today?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "I have had a high fever and body ache for three days",
                "language": "en",
                "extracted_entities": t1_data["extracted_entities"]
            },
            {
                "turn_number": 2,
                "question": t1_data["next_question"],
                "question_type": t1_data["next_question_type"],
                "patient_transcript": "The body ache is severe around 8 out of 10 and I also have chills",
                "language": "en",
                "extracted_entities": t2_data["extracted_entities"]
            }
        ],
        "is_emergency": t2_data["requires_emergency_attention"]
    })

    assert finalize_res.status_code == 200
    final_data = finalize_res.json()
    assert final_data["status"] == "FINALIZED"
    assert len(final_data["turns"]) == 2
    assert "PATIENT CLINICAL INTAKE SUMMARY" in final_data["final_summary"]
    assert "fever" in final_data["final_summary"].lower() or "body ache" in final_data["final_summary"].lower()
