"""Stage 2 Automated Tests: Bhashini ASR Provider & Audio Ingestion API."""
from unittest.mock import patch
import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app
from app.providers.speech import (
    get_stt_provider,
    SpeechToTextProvider,
    MockSpeechToTextProvider,
    BhashiniSpeechToTextProvider,
    BhashiniTranscriptionError,
    SpeechToTextResult,
)
from app.schemas.speech import SpeechTranscriptionResponse


# Synthetic valid 44-byte WAV header for tests
SYNTHETIC_WAV_BYTES = bytes.fromhex(
    "524946462400000057415645666d74201000000001000100803e0000007d0000020010006461746100000000"
)


def test_bhashini_provider_interface():
    """Verifies that BhashiniSpeechToTextProvider satisfies SpeechToTextProvider contract."""
    provider = BhashiniSpeechToTextProvider(
        user_id="test_user",
        api_key="test_api_key",
        pipeline_id="test_pipe",
    )
    assert isinstance(provider, SpeechToTextProvider)
    assert provider.engine_name == "BHASHINI_ASR"
    assert provider.is_healthy() is True

    # Unconfigured provider is unhealthy
    unconfigured = BhashiniSpeechToTextProvider(user_id="", api_key="")
    assert unconfigured.is_healthy() is False


def test_factory_selection_behavior(monkeypatch):
    """Verifies provider factory resolution rules."""
    # 1. Default: Live disabled -> Mock
    monkeypatch.setattr(settings, "ENABLE_LIVE_BHASHINI", False)
    stt = get_stt_provider()
    assert isinstance(stt, MockSpeechToTextProvider)
    assert stt.engine_name == "MOCK_ASR"

    # 2. Live enabled but empty credentials -> Mock fallback
    monkeypatch.setattr(settings, "ENABLE_LIVE_BHASHINI", True)
    monkeypatch.setattr(settings, "BHASHINI_USER_ID", "")
    monkeypatch.setattr(settings, "BHASHINI_API_KEY", "")
    stt = get_stt_provider()
    assert isinstance(stt, MockSpeechToTextProvider)

    # 3. Live enabled and credentials present -> Bhashini provider
    monkeypatch.setattr(settings, "ENABLE_LIVE_BHASHINI", True)
    monkeypatch.setattr(settings, "BHASHINI_USER_ID", "configured_user")
    monkeypatch.setattr(settings, "BHASHINI_API_KEY", "configured_key")
    stt = get_stt_provider()
    assert isinstance(stt, BhashiniSpeechToTextProvider)
    assert stt.engine_name == "BHASHINI_ASR"


@pytest.mark.asyncio
async def test_bhashini_provider_transcribe_mocked_success():
    """Verifies BhashiniSpeechToTextProvider payload formatting and response parsing."""
    provider = BhashiniSpeechToTextProvider(
        user_id="demo_user",
        api_key="demo_key",
        pipeline_id="asr_pipeline_v1",
    )

    fake_bhashini_response = {
        "pipelineResponse": [
            {
                "taskType": "asr",
                "output": [
                    {
                        "source": "मुझे पिछले 3 दिनों से बुखार है।"
                    }
                ]
            }
        ]
    }

    mock_resp = httpx.Response(200, json=fake_bhashini_response, request=httpx.Request("POST", "http://test"))

    with patch("httpx.AsyncClient.post", return_value=mock_resp) as mock_post:
        result = await provider.transcribe(
            audio_bytes=SYNTHETIC_WAV_BYTES,
            language_code="hi",
            mime_type="audio/wav",
        )
        assert isinstance(result, SpeechToTextResult)
        assert result.transcript == "मुझे पिछले 3 दिनों से बुखार है।"
        assert result.language == "hi"
        assert result.is_empty is False
        assert mock_post.called


@pytest.mark.asyncio
async def test_bhashini_provider_network_timeout():
    """Verifies BhashiniSpeechToTextProvider wraps network timeouts into BhashiniTranscriptionError."""
    provider = BhashiniSpeechToTextProvider(
        user_id="demo_user",
        api_key="demo_key",
    )

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(BhashiniTranscriptionError) as exc_info:
            await provider.transcribe(
                audio_bytes=SYNTHETIC_WAV_BYTES,
                language_code="en",
            )
        assert "timed out" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_api_transcribe_english_mock():
    """Verifies POST /api/v1/speech/transcribe for English audio using mock provider."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("audio.wav", SYNTHETIC_WAV_BYTES, "audio/wav")},
            data={"language_code": "en"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == "MOCK_ASR"
        assert data["language"] == "en"
        assert len(data["transcript"]) > 0
        assert data["is_empty"] is False


@pytest.mark.asyncio
async def test_api_transcribe_hindi_mock():
    """Verifies POST /api/v1/speech/transcribe for Hindi audio."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("recording.webm", SYNTHETIC_WAV_BYTES, "audio/webm")},
            data={"language_code": "hi"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["language"] == "hi"
        assert "दर्द" in data["transcript"] or len(data["transcript"]) > 0


@pytest.mark.asyncio
async def test_api_transcribe_marathi_mock():
    """Verifies POST /api/v1/speech/transcribe for Marathi audio."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("recording.wav", SYNTHETIC_WAV_BYTES, "audio/wav")},
            data={"language_code": "mr"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["language"] == "mr"
        assert len(data["transcript"]) > 0


@pytest.mark.asyncio
async def test_api_transcribe_empty_file_rejected():
    """Verifies that empty audio upload returns HTTP 400 Bad Request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("empty.wav", b"", "audio/wav")},
            data={"language_code": "en"},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_transcribe_unsupported_language_rejected():
    """Verifies that unsupported language code returns HTTP 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("test.wav", SYNTHETIC_WAV_BYTES, "audio/wav")},
            data={"language_code": "fr"},
        )
        assert response.status_code == 422
        assert "unsupported language" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_transcribe_unsupported_mime_type_rejected():
    """Verifies that unsupported MIME type returns HTTP 415."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("document.pdf", b"%PDF-1.4 dummy", "application/pdf")},
            data={"language_code": "en"},
        )
        assert response.status_code == 415
        assert "unsupported audio media type" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_transcribe_oversized_audio_rejected():
    """Verifies that audio larger than MAX_AUDIO_SIZE_MB returns HTTP 413."""
    oversized_data = b"0" * (11 * 1024 * 1024)  # 11MB
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/speech/transcribe",
            files={"file": ("large.wav", oversized_data, "audio/wav")},
            data={"language_code": "en"},
        )
        assert response.status_code == 413
        assert "exceeds maximum limit" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_transcribe_provider_error_handling():
    """Verifies provider failures return controlled 502 error rather than unhandled 500."""
    with patch(
        "app.providers.speech.base.MockSpeechToTextProvider.transcribe",
        side_effect=BhashiniTranscriptionError("Simulated upstream failure"),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/speech/transcribe",
                files={"file": ("audio.wav", SYNTHETIC_WAV_BYTES, "audio/wav")},
                data={"language_code": "en"},
            )
            assert response.status_code == 502
            assert "upstream" in response.json()["detail"].lower()
