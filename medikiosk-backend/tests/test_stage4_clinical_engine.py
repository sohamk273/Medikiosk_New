"""Stage 4 Automated Tests: Clinical Case-Taking Intelligence & Turn Orchestration."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.clinical import ClinicalCaseState
from app.services.clinical.clinical_engine import ClinicalCaseTakingEngine


@pytest.fixture
def clinical_engine():
    return ClinicalCaseTakingEngine()


@pytest.mark.asyncio
async def test_basic_transcript_processing(clinical_engine):
    """Verifies that basic symptoms are extracted and next question is generated."""
    result = await clinical_engine.process_turn(
        transcript="I have abdominal pain.",
        language="en",
    )
    assert result.success is True
    assert "abdominal pain" in result.extracted_entities.symptoms
    assert result.case_state.chief_complaint == "abdominal pain"
    assert result.next_question_type in ["LOCATION", "DURATION", "SEVERITY"]
    assert result.provider == "MOCK_LLM"


@pytest.mark.asyncio
async def test_duration_extraction(clinical_engine):
    """Verifies duration parsing from narrative."""
    result = await clinical_engine.process_turn(
        transcript="I have had this pain for 3 days.",
        language="en",
    )
    assert len(result.extracted_entities.duration) > 0
    assert "3 days" in result.extracted_entities.duration[0]


@pytest.mark.asyncio
async def test_severity_extraction(clinical_engine):
    """Verifies severity scale parsing from narrative."""
    result = await clinical_engine.process_turn(
        transcript="The pain is 8 out of 10 and very severe.",
        language="en",
    )
    assert len(result.extracted_entities.severity) > 0
    assert any("8" in s or "severe" in s for s in result.extracted_entities.severity)


@pytest.mark.asyncio
async def test_associated_symptom_extraction(clinical_engine):
    """Verifies associated symptoms like fever/vomiting are captured."""
    result = await clinical_engine.process_turn(
        transcript="I have stomach pain and I also have fever and vomiting.",
        language="en",
    )
    assert "fever" in result.extracted_entities.associated_symptoms
    assert "vomiting" in result.extracted_entities.associated_symptoms
    assert result.case_state.fever is True


@pytest.mark.asyncio
async def test_multi_turn_accumulation(clinical_engine):
    """Verifies multi-turn accumulation preserves previously collected fields."""
    # Turn 1: Chief complaint & symptom
    t1 = await clinical_engine.process_turn(
        transcript="I have abdominal pain in my lower abdomen.",
        language="en",
    )
    assert t1.case_state.chief_complaint == "abdominal pain"
    assert t1.case_state.symptoms[0].location == "abdomen"

    # Turn 2: Duration
    t2 = await clinical_engine.process_turn(
        transcript="It started 3 days ago.",
        language="en",
        current_case_state=t1.case_state,
    )
    assert t2.case_state.chief_complaint == "abdominal pain"
    assert t2.case_state.symptoms[0].location == "abdomen"
    assert "3 days" in t2.case_state.symptoms[0].duration

    # Turn 3: Severity
    t3 = await clinical_engine.process_turn(
        transcript="The pain is 8 out of 10.",
        language="en",
        current_case_state=t2.case_state,
    )
    assert t3.case_state.chief_complaint == "abdominal pain"
    assert t3.case_state.symptoms[0].location == "abdomen"
    assert "3 days" in t3.case_state.symptoms[0].duration
    assert "8" in t3.case_state.symptoms[0].severity


@pytest.mark.asyncio
async def test_red_flag_detection(clinical_engine):
    """Verifies emergency red flag detection."""
    result = await clinical_engine.process_turn(
        transcript="I suddenly have severe chest pain and difficulty breathing.",
        language="en",
    )
    assert result.requires_emergency_attention is True
    assert len(result.red_flags) >= 1
    flag_types = [rf.type for rf in result.red_flags]
    assert "CHEST_PAIN" in flag_types or "BREATHING_DIFFICULTY" in flag_types


@pytest.mark.asyncio
async def test_multilingual_hindi_processing(clinical_engine):
    """Verifies Hindi narrative processing and Devanagari question generation."""
    result = await clinical_engine.process_turn(
        transcript="मुझे पिछले 3 दिनों से पेट में तेज दर्द है।",
        language="hi",
    )
    assert result.language == "hi"
    assert "abdominal pain" in result.extracted_entities.symptoms
    assert result.next_question_regional is not None
    assert len(result.next_question_regional) > 0


@pytest.mark.asyncio
async def test_api_process_turn_endpoint():
    """Verifies POST /api/v1/clinical/process-turn endpoint contract."""
    payload = {
        "transcript": "I have severe abdominal pain for 3 days.",
        "language": "en",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/clinical/process-turn", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == "MOCK_LLM"
        assert "case_state" in data
        assert "next_question" in data
        assert "extracted_entities" in data


@pytest.mark.asyncio
async def test_api_empty_transcript_rejected():
    """Verifies empty transcript returns HTTP 400 Bad Request."""
    payload = {
        "transcript": "   ",
        "language": "en",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/clinical/process-turn", json=payload)
        assert response.status_code in (400, 422)
        assert "empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_unsupported_language_rejected():
    """Verifies unsupported language code returns HTTP 422."""
    payload = {
        "transcript": "Ich habe Bauchschmerzen.",
        "language": "de",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/clinical/process-turn", json=payload)
        assert response.status_code == 422
        assert "unsupported language" in response.json()["detail"].lower()
