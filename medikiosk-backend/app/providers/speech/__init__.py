"""Speech recognition (ASR) and synthesis (TTS) provider factory and registry."""
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.speech.base import (
    SpeechToTextProvider,
    TextToSpeechProvider,
    SpeechToTextResult,
    TextToSpeechResult,
    MockSpeechToTextProvider,
    MockTextToSpeechProvider,
)
from app.providers.speech.bhashini import (
    BhashiniSpeechToTextProvider,
    BhashiniTranscriptionError,
)

_mock_stt_provider = MockSpeechToTextProvider()
_mock_tts_provider = MockTextToSpeechProvider()

_custom_stt_provider: Optional[SpeechToTextProvider] = None
_custom_tts_provider: Optional[TextToSpeechProvider] = None


def register_stt_provider(provider: SpeechToTextProvider) -> None:
    """Registers a live or custom Speech-to-Text provider."""
    global _custom_stt_provider
    _custom_stt_provider = provider


def register_tts_provider(provider: TextToSpeechProvider) -> None:
    """Registers a live or custom Text-to-Speech provider."""
    global _custom_tts_provider
    _custom_tts_provider = provider


from app.providers.speech.gemini import GeminiSpeechToTextProvider

def get_stt_provider() -> SpeechToTextProvider:
    """Returns the configured SpeechToTextProvider.
    
    If SPEECH_PROVIDER == 'bhashini' or ENABLE_LIVE_BHASHINI is True,
    and credentials (BHASHINI_API_KEY, BHASHINI_USER_ID) are configured,
    returns BhashiniSpeechToTextProvider.
    If SPEECH_PROVIDER == 'gemini', returns GeminiSpeechToTextProvider.
    Otherwise, returns MockSpeechToTextProvider for deterministic offline operation.
    """
    if _custom_stt_provider is not None:
        return _custom_stt_provider

    if settings.is_bhashini_enabled:
        if settings.BHASHINI_API_KEY and settings.BHASHINI_USER_ID:
            logger.info("Using live Bhashini ASR provider (BHASHINI_ASR).")
            return BhashiniSpeechToTextProvider(
                user_id=settings.BHASHINI_USER_ID,
                api_key=settings.BHASHINI_API_KEY,
                pipeline_id=settings.BHASHINI_PIPELINE_ID,
                inference_url=settings.BHASHINI_INFERENCE_URL,
                timeout_seconds=settings.BHASHINI_ASR_TIMEOUT_SECONDS,
            )
        else:
            logger.warning(
                "Bhashini speech provider is enabled, but required Bhashini credentials are missing. "
                "Falling back to MockSpeechToTextProvider."
            )
    elif settings.SPEECH_PROVIDER.lower() == "gemini":
        logger.info("Using live Gemini ASR provider (GEMINI_ASR).")
        return GeminiSpeechToTextProvider()

    return _mock_stt_provider


def get_tts_provider() -> TextToSpeechProvider:
    """Returns the configured TextToSpeechProvider."""
    if _custom_tts_provider is not None:
        return _custom_tts_provider
    return _mock_tts_provider


__all__ = [
    "SpeechToTextProvider",
    "TextToSpeechProvider",
    "SpeechToTextResult",
    "TextToSpeechResult",
    "MockSpeechToTextProvider",
    "MockTextToSpeechProvider",
    "BhashiniSpeechToTextProvider",
    "BhashiniTranscriptionError",
    "register_stt_provider",
    "register_tts_provider",
    "get_stt_provider",
    "get_tts_provider",
]
