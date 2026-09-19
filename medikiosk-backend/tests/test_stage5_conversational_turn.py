"""Tests for Stage 5 Conversational Clinical Case-Taking & Orchestration Engine."""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.clinical.clinical_engine import ClinicalCaseTakingEngine
from app.schemas.clinical import ClinicalCaseState, ClinicalSymptom


@pytest.fixture
def clinical_engine():
    return ClinicalCaseTakingEngine()


@pytest.fixture
def sync_client():
    return TestClient(app)


@pytest.mark.asyncio
async def test_1_first_turn_creates_case(clinical_engine):
    """Verifies Turn 1 initializes chief complaint and identifies next missing inquiry."""
    res = await clinical_engine.process_turn(
        transcript="I have pain.",
        language="en",
        current_case_state=None,
    )
    assert res.success is True
    assert res.case_state.chief_complaint == "pain"
    assert len(res.case_state.symptoms) == 1
    assert res.next_question_type == "LOCATION"
    assert "Where exactly" in res.next_question


@pytest.mark.asyncio
async def test_2_second_turn_preserves_first_turn_data(clinical_engine):
    """Verifies Turn 2 adds location while retaining chief complaint and severity."""
    turn1 = await clinical_engine.process_turn(
        transcript="I have severe pain.",
        language="en",
        current_case_state=None,
    )
    turn2 = await clinical_engine.process_turn(
        transcript="It is on the right side in my lower abdomen.",
        language="en",
        current_case_state=turn1.case_state,
    )
    assert turn2.case_state.chief_complaint == "pain"
    assert turn2.case_state.symptoms[0].severity == "severe"
    assert turn2.case_state.symptoms[0].location == "abdomen"
    assert turn2.next_question_type == "DURATION"
    assert "How long" in turn2.next_question


@pytest.mark.asyncio
async def test_3_third_turn_preserves_all_previous_data(clinical_engine):
    """Verifies Turn 3 accumulates duration without losing Turn 1 & Turn 2 data."""
    turn1 = await clinical_engine.process_turn(
        transcript="I have severe pain.",
        language="en",
        current_case_state=None,
    )
    turn2 = await clinical_engine.process_turn(
        transcript="It is in my lower abdomen.",
        language="en",
        current_case_state=turn1.case_state,
    )
    turn3 = await clinical_engine.process_turn(
        transcript="For three days.",
        language="en",
        current_case_state=turn2.case_state,
    )
    assert turn3.case_state.chief_complaint == "pain"
    assert turn3.case_state.symptoms[0].location == "abdomen"
    assert turn3.case_state.symptoms[0].severity == "severe"
    assert "three days" in turn3.case_state.symptoms[0].duration
    assert turn3.next_question_type in ("CHARACTER", "ASSOCIATED_SYMPTOMS")


@pytest.mark.asyncio
async def test_4_intelligent_skipping_already_provided_info(clinical_engine):
    """Verifies engine skips already provided fields (location, duration, severity)."""
    turn1 = await clinical_engine.process_turn(
        transcript="I have severe right-sided abdominal pain for 3 days.",
        language="en",
        current_case_state=None,
    )
    assert turn1.case_state.chief_complaint == "abdominal pain"
    assert turn1.case_state.symptoms[0].location == "abdomen"
    assert turn1.case_state.symptoms[0].severity == "severe"
    assert "3 days" in turn1.case_state.symptoms[0].duration
    # Neither LOCATION, DURATION, nor SEVERITY should be asked!
    assert turn1.next_question_type not in ("LOCATION", "DURATION", "SEVERITY")
    assert turn1.next_question_type in ("CHARACTER", "ASSOCIATED_SYMPTOMS")


@pytest.mark.asyncio
async def test_5_multi_entity_extraction_from_single_narrative(clinical_engine):
    """Verifies comprehensive multi-entity extraction in a complex single utterance."""
    res = await clinical_engine.process_turn(
        transcript="I have had sharp chest pain for 2 hours with fever, vomiting, and shortness of breath.",
        language="en",
        current_case_state=None,
    )
    assert "chest pain" in res.extracted_entities.symptoms
    assert "chest" in res.extracted_entities.body_locations
    assert "2 hours" in res.extracted_entities.duration
    assert "fever" in res.extracted_entities.associated_symptoms
    assert "vomiting" in res.extracted_entities.associated_symptoms
    assert "difficulty breathing" in res.extracted_entities.associated_symptoms
    assert res.requires_emergency_attention is True


@pytest.mark.asyncio
async def test_6_english_question_generation(clinical_engine):
    """Verifies English question format and prompt accuracy."""
    res = await clinical_engine.process_turn(
        transcript="I have a headache.",
        language="en",
    )
    assert res.language == "en"
    assert res.next_question == "Where exactly is your discomfort or pain located?"
    assert res.next_question_regional == "Where exactly is your discomfort or pain located?"


@pytest.mark.asyncio
async def test_7_hindi_question_generation(clinical_engine):
    """Verifies Hindi Devanagari narrative processing and Hindi question localization."""
    res = await clinical_engine.process_turn(
        transcript="मुझे 3 दिनों से सिर में तेज दर्द है।",
        language="hi",
    )
    assert res.language == "hi"
    assert res.case_state.chief_complaint == "headache"
    assert res.next_question_regional is not None
    assert "दर्द" in res.next_question_regional or "परेशानी" in res.next_question_regional or "शरीर" in res.next_question_regional


@pytest.mark.asyncio
async def test_8_marathi_question_generation(clinical_engine):
    """Verifies Marathi Devanagari narrative processing and Marathi question localization."""
    res = await clinical_engine.process_turn(
        transcript="मला दोन दिवसांपासून पोटात तीव्र वेदना होत आहेत.",
        language="mr",
    )
    assert res.language == "mr"
    assert res.case_state.chief_complaint == "abdominal pain"
    assert res.next_question_regional is not None
    assert "त्रास" in res.next_question_regional or "वेदना" in res.next_question_regional or "भाग" in res.next_question_regional


@pytest.mark.asyncio
async def test_9_emergency_red_flag_halts_routine_questioning(clinical_engine):
    """Verifies emergency red flag immediately triggers emergency alert and stops routine intake."""
    res = await clinical_engine.process_turn(
        transcript="I have sudden crushing chest pain and difficulty breathing.",
        language="en",
    )
    assert res.requires_emergency_attention is True
    assert len(res.red_flags) >= 1
    assert res.next_question_type == "EMERGENCY"
    assert "Immediate clinical attention is advised" in res.next_question


@pytest.mark.asyncio
async def test_10_case_completion_workflow(clinical_engine):
    """Verifies that an intake with all core dimensions marks case as complete."""
    state = ClinicalCaseState(
        chief_complaint="abdominal pain",
        symptoms=[
            ClinicalSymptom(
                name="abdominal pain",
                location="abdomen",
                duration="3 days",
                severity="moderate",
                character="cramping",
                aggravating_factors=["eating food"],
                relieving_factors=["rest / lying down"],
            )
        ],
        associated_symptoms=["nausea"],
        fever=False,
        medications=["none"],
        allergies=["none"],
        medical_history=["none"],
        completed_sections=[
            "CHIEF_COMPLAINT",
            "LOCATION",
            "DURATION",
            "SEVERITY",
            "CHARACTER",
            "ASSOCIATED_SYMPTOMS",
            "AGGRAVATING_FACTORS",
            "RELIEVING_FACTORS",
            "MEDICATIONS",
            "ALLERGIES",
            "MEDICAL_HISTORY",
        ],
        missing_information=[],
    )
    res = await clinical_engine.process_turn(
        transcript="I have no other medical conditions.",
        language="en",
        current_case_state=state,
    )
    assert res.is_case_complete is True
    assert res.next_question_type == "COMPLETED"
    assert "Thank you" in res.next_question


def test_11_api_next_turn_empty_transcript_validation(sync_client):
    """Verifies API returns 422 for empty/blank transcripts."""
    resp = sync_client.post(
        "/api/v1/clinical/next-turn",
        json={"transcript": "   ", "language": "en"},
    )
    assert resp.status_code == 422


def test_12_api_next_turn_unsupported_language_validation(sync_client):
    """Verifies API returns 422 for unsupported language codes."""
    resp = sync_client.post(
        "/api/v1/clinical/next-turn",
        json={"transcript": "I feel unwell", "language": "fr"},
    )
    assert resp.status_code == 422


def test_13_api_next_turn_response_schema_validation(sync_client):
    """Verifies full API response schema compliance on POST /api/v1/clinical/next-turn."""
    payload = {
        "transcript": "I have severe abdominal pain for 3 days.",
        "language": "en",
        "case_state": None,
    }
    resp = sync_client.post("/api/v1/clinical/next-turn", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["language"] == "en"
    assert "extracted_entities" in data
    assert "case_state" in data
    assert "next_question" in data
    assert "next_question_type" in data
    assert data["provider"] == "MOCK_LLM"
