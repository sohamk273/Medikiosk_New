"""Stage 1 Automated Tests: Provider Foundation & Configuration Validation."""
import pytest
from app.core.config import Settings, settings
from app.providers.speech import (
    get_stt_provider,
    get_tts_provider,
    SpeechToTextProvider,
    TextToSpeechProvider,
    SpeechToTextResult,
    TextToSpeechResult,
    MockSpeechToTextProvider,
    MockTextToSpeechProvider,
)
from app.providers.llm import (
    get_llm_provider,
    LLMProvider,
    MockLLMProvider,
    CaseTakingTurnResult,
    ClinicalEntityExtractionResult,
    DoctorCaseSummaryResult,
)


def test_stage1_configuration_defaults():
    """Verifies that all new Bhashini and LLM configuration fields exist and default safely to inactive."""
    assert hasattr(settings, "BHASHINI_USER_ID")
    assert hasattr(settings, "BHASHINI_API_KEY")
    assert hasattr(settings, "BHASHINI_PIPELINE_ID")
    assert hasattr(settings, "ENABLE_LIVE_BHASHINI")
    assert hasattr(settings, "LLM_API_KEY")
    assert hasattr(settings, "LLM_PROVIDER")
    assert hasattr(settings, "ENABLE_LIVE_LLM")
    assert hasattr(settings, "POSTGRES_PORT")

    # Safety assertions: Live external services must be disabled by default
    assert settings.ENABLE_LIVE_BHASHINI is False
    assert settings.ENABLE_LIVE_LLM is False
    assert settings.POSTGRES_PORT == 5433


def test_cors_origins_parsing():
    """Verifies CORS allowed origins validator handles JSON lists, comma strings, and Python lists."""
    # Test JSON string list
    s1 = Settings(CORS_ALLOWED_ORIGINS='["http://localhost:5173", "http://localhost:3000"]')
    assert s1.CORS_ALLOWED_ORIGINS == ["http://localhost:5173", "http://localhost:3000"]

    # Test comma-separated string
    s2 = Settings(CORS_ALLOWED_ORIGINS="http://localhost:5173, http://localhost:3000, http://127.0.0.1:5173")
    assert s2.CORS_ALLOWED_ORIGINS == ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Test Python list
    s3 = Settings(CORS_ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"])
    assert s3.CORS_ALLOWED_ORIGINS == ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Ensure no Markdown formatting slipped in
    for origin in settings.CORS_ALLOWED_ORIGINS:
        assert not origin.startswith("[http") or origin.endswith("]")
        assert "localhost" in origin or "127.0.0.1" in origin


def test_stt_and_tts_provider_factory():
    """Verifies that speech providers resolve to Mock instances in Stage 1."""
    stt = get_stt_provider()
    tts = get_tts_provider()

    assert isinstance(stt, SpeechToTextProvider)
    assert isinstance(stt, MockSpeechToTextProvider)
    assert isinstance(tts, TextToSpeechProvider)
    assert isinstance(tts, MockTextToSpeechProvider)
    assert stt.is_healthy() is True
    assert tts.is_healthy() is True


@pytest.mark.asyncio
async def test_mock_stt_transcription():
    """Verifies SpeechToText contract across English, Hindi, and Marathi."""
    stt = get_stt_provider()

    for lang in ["en", "hi", "mr"]:
        result = await stt.transcribe(
            audio_bytes=b"sample_audio_payload",
            language_code=lang,
        )
        assert isinstance(result, SpeechToTextResult)
        assert result.language == lang
        assert len(result.transcript) > 0
        assert result.is_empty is False
        assert result.confidence is not None


@pytest.mark.asyncio
async def test_mock_stt_empty_audio():
    """Verifies that empty audio produces is_empty=True."""
    stt = get_stt_provider()
    result = await stt.transcribe(
        audio_bytes=b"",
        language_code="en",
    )
    assert isinstance(result, SpeechToTextResult)
    assert result.is_empty is True
    assert result.transcript == ""


@pytest.mark.asyncio
async def test_mock_tts_synthesis():
    """Verifies TextToSpeech contract execution returning valid audio bytes."""
    tts = get_tts_provider()

    result = await tts.synthesize(
        text="तुमची प्राथमिक तपासणी पूर्ण झाली आहे.",
        language_code="mr",
    )
    assert isinstance(result, TextToSpeechResult)
    assert result.content_type == "audio/wav"
    assert len(result.audio_bytes) > 0
    # Check for RIFF header
    assert result.audio_bytes.startswith(b"RIFF")


def test_llm_provider_factory():
    """Verifies LLM provider factory resolution to Mock in Stage 1."""
    llm = get_llm_provider()
    assert isinstance(llm, LLMProvider)
    assert isinstance(llm, MockLLMProvider)
    assert llm.is_healthy() is True


@pytest.mark.asyncio
async def test_mock_llm_case_taking_turn():
    """Verifies LLM case-taking turn contract across languages."""
    llm = get_llm_provider()

    for lang in ["en", "hi", "mr"]:
        history = [{"role": "patient", "content": "I have stomach pain"}]
        turn = await llm.process_case_turn(
            conversation_history=history,
            current_utterance="It hurts when I eat",
            language_code=lang,
            chief_complaint="Stomach Pain",
        )

        assert isinstance(turn, CaseTakingTurnResult)
        assert len(turn.next_question_en) > 0
        assert turn.target_language == lang
        assert isinstance(turn.extracted_entities, ClinicalEntityExtractionResult)
        assert turn.extracted_entities.severity_scale is not None


@pytest.mark.asyncio
async def test_mock_llm_entity_extraction():
    """Verifies clinical entity extraction contract."""
    llm = get_llm_provider()
    entities = await llm.extract_clinical_entities("Fever and cough for 2 days", language_code="en")

    assert isinstance(entities, ClinicalEntityExtractionResult)
    assert len(entities.symptoms) > 0
    assert entities.red_flag_detected is False


@pytest.mark.asyncio
async def test_mock_llm_doctor_summary():
    """Verifies LLM doctor summary generation contract."""
    llm = get_llm_provider()

    summary = await llm.generate_doctor_summary({"patient_name": "Ramesh Patil"})
    assert isinstance(summary, DoctorCaseSummaryResult)
    assert "subjective" in summary.__dict__
    assert "provisional_diagnoses" in summary.__dict__
    assert summary.recommended_triage_priority in ["NORMAL", "EMERGENCY"]
