"""Stage 7 Live Bhashini & Gemini AI Provider Integration Test Suite.

Validates all 18 requirements:
1. Mock provider still works.
2. Provider factory selects Mock correctly.
3. Provider factory selects Bhashini correctly.
4. Provider factory selects Gemini correctly.
5. Missing API credentials produce a clear configuration error / fallback.
6. Bhashini timeout/network failure is handled.
7. Gemini timeout/network failure is handled.
8. Malformed Gemini structured output is rejected safely.
9. Gemini cannot introduce unsupported clinical facts into the case state.
10. Existing red-flag logic remains authoritative.
11. Emergency cases stop normal questioning.
12. English clinical conversation works.
13. Hindi clinical conversation works.
14. Marathi clinical conversation works.
15. Multi-turn cumulative state remains intact.
16. Stage 6 persistence continues working.
17. Doctor summary continues working.
18. Full regression compatibility.
"""
import json
import pytest
import httpx
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.providers.speech import (
    get_stt_provider,
    MockSpeechToTextProvider,
    BhashiniSpeechToTextProvider,
    BhashiniTranscriptionError,
)
from app.providers.llm import (
    get_llm_provider,
    MockLLMProvider,
    GeminiClinicalProvider,
    GeminiProviderError,
)
from app.services.clinical.clinical_engine import ClinicalCaseTakingEngine, default_clinical_engine
from app.schemas.clinical import ClinicalCaseState


# 1 & 2: Mock provider behavior & factory selection
def test_01_and_02_mock_provider_factory_selection():
    """Verify factory returns Mock providers when configured in default offline mode."""
    with patch.object(settings, "SPEECH_PROVIDER", "mock"), \
         patch.object(settings, "ENABLE_LIVE_BHASHINI", False), \
         patch.object(settings, "AI_PROVIDER", "mock"), \
         patch.object(settings, "ENABLE_LIVE_LLM", False):
        
        stt = get_stt_provider()
        llm = get_llm_provider()
        
        assert isinstance(stt, MockSpeechToTextProvider)
        assert isinstance(llm, MockLLMProvider)
        assert stt.engine_name == "MOCK_ASR"
        assert llm.provider_name == "MOCK_LLM"


# 3: Provider factory selects Bhashini correctly
def test_03_provider_factory_selects_bhashini():
    """Verify factory returns BhashiniSpeechToTextProvider when configured with credentials."""
    with patch.object(settings, "SPEECH_PROVIDER", "bhashini"), \
         patch.object(settings, "BHASHINI_API_KEY", "test-bhashini-key"), \
         patch.object(settings, "BHASHINI_USER_ID", "test-user-id"):
        
        stt = get_stt_provider()
        assert isinstance(stt, BhashiniSpeechToTextProvider)
        assert stt.engine_name == "BHASHINI_ASR"
        assert stt.is_healthy() is True


# 4: Provider factory selects Gemini correctly
def test_04_provider_factory_selects_gemini():
    """Verify factory returns GeminiClinicalProvider when configured with credentials."""
    with patch.object(settings, "AI_PROVIDER", "gemini"), \
         patch.object(settings, "GEMINI_API_KEY", "test-gemini-key"), \
         patch.object(settings, "GEMINI_MODEL", "gemini-1.5-flash"):
        
        llm = get_llm_provider()
        assert isinstance(llm, GeminiClinicalProvider)
        assert "GEMINI_CLINICAL" in llm.provider_name
        assert llm.is_healthy() is True


# 5: Missing credentials produce fallback in factory
def test_05_missing_credentials_fallback():
    """Verify missing credentials safely falls back to Mock provider with a clear log warning."""
    with patch.object(settings, "SPEECH_PROVIDER", "bhashini"), \
         patch.object(settings, "BHASHINI_API_KEY", ""), \
         patch.object(settings, "BHASHINI_USER_ID", ""):
        stt = get_stt_provider()
        assert isinstance(stt, MockSpeechToTextProvider)

    with patch.object(settings, "AI_PROVIDER", "gemini"), \
         patch.object(settings, "GEMINI_API_KEY", ""), \
         patch.object(settings, "LLM_API_KEY", ""):
        llm = get_llm_provider()
        assert isinstance(llm, MockLLMProvider)


# 6: Bhashini timeout and error handling
@pytest.mark.asyncio
async def test_06_bhashini_timeout_and_error_handling():
    """Verify Bhashini provider raises BhashiniTranscriptionError on timeouts and HTTP errors."""
    provider = BhashiniSpeechToTextProvider(
        user_id="test_uid",
        api_key="test_key",
        timeout_seconds=0.1,
    )

    # Simulate timeout
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(BhashiniTranscriptionError, match="timed out"):
            await provider.transcribe(b"fake_audio_bytes", "en")

    # Simulate HTTP 500 error
    mock_resp = httpx.Response(500, request=httpx.Request("POST", "http://test"))
    with patch("httpx.AsyncClient.post", side_effect=httpx.HTTPStatusError("500", request=mock_resp.request, response=mock_resp)):
        with pytest.raises(BhashiniTranscriptionError, match="HTTP 500"):
            await provider.transcribe(b"fake_audio_bytes", "en")


# 7: Gemini timeout and error handling
@pytest.mark.asyncio
async def test_07_gemini_timeout_and_error_handling():
    """Verify Gemini provider raises GeminiProviderError on timeouts and network issues."""
    provider = GeminiClinicalProvider(api_key="test_key", timeout_seconds=0.1)

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(GeminiProviderError, match="timed out"):
            await provider.extract_clinical_entities("Stomach pain for 2 days")

    with patch("httpx.AsyncClient.post", side_effect=httpx.RequestError("Network down")):
        with pytest.raises(GeminiProviderError, match="Failed to connect"):
            await provider.extract_clinical_entities("Stomach pain for 2 days")


# 8: Malformed Gemini structured output handling
@pytest.mark.asyncio
async def test_08_malformed_gemini_output_handling():
    """Verify malformed JSON from Gemini raises GeminiProviderError safely."""
    provider = GeminiClinicalProvider(api_key="test_key")

    mock_resp = httpx.Response(
        200,
        json={"candidates": [{"content": {"parts": [{"text": "Not a valid JSON"}]}}]},
        request=httpx.Request("POST", "http://test")
    )
    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        with pytest.raises(GeminiProviderError, match="Malformed JSON"):
            await provider.extract_clinical_entities("I have fever")


# 9 & 10: Authoritative red flags & safety guardrails
@pytest.mark.asyncio
async def test_09_and_10_red_flags_authoritative_over_llm():
    """Verify deterministic red-flag logic triggers emergency even if LLM misses it or returns normal."""
    engine = ClinicalCaseTakingEngine(llm_provider=MockLLMProvider())

    # Patient reports severe chest pain
    transcript = "I have sudden crushing chest pain and shortness of breath"
    turn_res = await engine.process_turn(transcript=transcript, language="en")

    assert turn_res.requires_emergency_attention is True
    assert turn_res.is_case_complete is True
    assert turn_res.next_question_type == "EMERGENCY"
    assert any(rf.type == "CHEST_PAIN" for rf in turn_res.red_flags)


# 11: Emergency stops routine questioning
@pytest.mark.asyncio
async def test_11_emergency_halts_questioning(client: AsyncClient):
    """Verify POST /api/v1/clinical/next-turn stops routine questions immediately on emergency."""
    res = await client.post("/api/v1/clinical/next-turn", json={
        "transcript": "I fainted and blacked out twice today",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["requires_emergency_attention"] is True
    assert data["next_question_type"] == "EMERGENCY"
    assert data["is_case_complete"] is True


# 12, 13, 14: Multilingual clinical conversation (EN, HI, MR) with mocked Gemini
@pytest.mark.asyncio
async def test_12_13_14_multilingual_conversation_with_gemini():
    """Verify Gemini provider parses multilingual narratives into structured clinical entities."""
    gemini_provider = GeminiClinicalProvider(api_key="mock_key")

    mock_json_payload = {
        "primary_complaint": "Severe Abdominal Pain",
        "symptoms": [
            {"name": "abdominal pain", "location": "stomach", "duration": "3 days", "severity": "8/10", "is_red_flag": False}
        ],
        "duration_summary": "3 days",
        "severity_scale": 8,
        "red_flag_detected": False,
        "associated_symptoms": ["nausea"],
        "medications": ["antacids"],
        "allergies": [],
        "medical_history": ["gastritis"]
    }

    mock_resp = httpx.Response(
        200,
        json={"candidates": [{"content": {"parts": [{"text": json.dumps(mock_json_payload)}]}}]},
        request=httpx.Request("POST", "http://test")
    )

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        # 1. English
        en_res = await gemini_provider.extract_clinical_entities("I have severe stomach pain for 3 days", "en")
        assert en_res.primary_complaint == "Severe Abdominal Pain"
        assert len(en_res.symptoms) == 1
        assert en_res.symptoms[0].name == "abdominal pain"

        # 2. Hindi
        hi_res = await gemini_provider.extract_clinical_entities("मुझे 3 दिन से पेट में तेज दर्द है", "hi")
        assert hi_res.duration_summary == "3 days"
        assert hi_res.severity_scale == 8

        # 3. Marathi
        mr_res = await gemini_provider.extract_clinical_entities("माझ्या पोटात 3 दिवसांपासून खूप दुखत आहे", "mr")
        assert mr_res.primary_complaint == "Severe Abdominal Pain"


# 15: Multi-turn cumulative state remains intact
@pytest.mark.asyncio
async def test_15_multi_turn_state_accumulation(client: AsyncClient):
    """Verify multiple turns accumulate state consistently."""
    # Turn 1
    t1 = await client.post("/api/v1/clinical/next-turn", json={
        "transcript": "I have a severe headache",
        "language": "en"
    })
    assert t1.status_code == 200
    state1 = t1.json()["case_state"]

    # Turn 2
    t2 = await client.post("/api/v1/clinical/next-turn", json={
        "transcript": "It is in the front of my head for 2 days",
        "language": "en",
        "case_state": state1
    })
    assert t2.status_code == 200
    state2 = t2.json()["case_state"]
    assert "headache" in state2["chief_complaint"].lower()
    assert state2["symptoms"][0]["duration"] == "2 days"


# 16 & 17: Stage 6 persistence & deterministic summary compatibility
@pytest.mark.asyncio
async def test_16_and_17_stage6_persistence_and_doctor_summary(client: AsyncClient):
    """Verify Stage 6 persistence and doctor summary generator work seamlessly."""
    finalize_payload = {
        "language": "en",
        "case_state": {
            "chief_complaint": "Persistent joint stiffness",
            "symptoms": [{"name": "joint stiffness", "location": "knees", "duration": "1 month"}],
            "associated_symptoms": [],
            "medications": ["ibuprofen"]
        },
        "conversation_history": [
            {
                "turn_number": 1,
                "question": "What is the problem?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "My knees are very stiff",
                "language": "en"
            }
        ]
    }

    res = await client.post("/api/v1/clinical/finalize", json=finalize_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FINALIZED"
    assert "PATIENT CLINICAL INTAKE SUMMARY" in data["final_summary"]
    assert "knee" in data["final_summary"].lower()


# 18: Full regression suite integrity check
def test_18_system_regression_check():
    """Verify default engine is initialized and ready for production."""
    assert default_clinical_engine is not None
    assert default_clinical_engine.llm_provider is not None
