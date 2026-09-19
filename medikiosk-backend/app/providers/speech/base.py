"""Abstract provider contracts and schemas for Speech-to-Text (ASR) and Text-to-Speech (TTS)."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any


@dataclass
class SpeechToTextResult:
    """Standardized output of Speech-to-Text recognition."""
    transcript: str
    language: str = "en"
    confidence: Optional[float] = None
    detected_language: Optional[str] = None
    is_empty: bool = False
    raw_response: Optional[Dict[str, Any]] = field(default_factory=dict)


@dataclass
class TextToSpeechResult:
    """Standardized output of Text-to-Speech synthesis."""
    audio_bytes: bytes = b""
    content_type: str = "audio/wav"
    language: str = "en"
    sample_rate: Optional[int] = 16000
    audio_url: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = field(default_factory=dict)


class SpeechToTextProvider(ABC):
    """Abstract interface for Speech Recognition (ASR) providers."""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Canonical identifier of the ASR engine."""
        pass

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str = "en",
        mime_type: str = "audio/wav",
    ) -> SpeechToTextResult:
        """Transcribes raw audio bytes into text in the specified language."""
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """Checks provider readiness / credentials validation."""
        pass


class TextToSpeechProvider(ABC):
    """Abstract interface for Text-to-Speech (TTS) providers."""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Canonical identifier of the TTS engine."""
        pass

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        language_code: str = "en",
        gender: str = "female",
    ) -> TextToSpeechResult:
        """Synthesizes text into high-fidelity speech audio bytes."""
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """Checks provider readiness / credentials validation."""
        pass


class MockSpeechToTextProvider(SpeechToTextProvider):
    """Deterministic fallback ASR provider used for local testing and when live ASR is disabled."""

    @property
    def engine_name(self) -> str:
        return "MOCK_ASR"

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str = "en",
        mime_type: str = "audio/wav",
    ) -> SpeechToTextResult:
        if not audio_bytes or len(audio_bytes) == 0:
            return SpeechToTextResult(
                transcript="",
                language=language_code,
                confidence=0.0,
                is_empty=True,
            )

        mock_map = {
            "hi": "मुझे पिछले तीन दिनों से पेट में तेज दर्द और बुखार है।",
            "mr": "मला गेल्या तीन दिवसांपासून पोटात तीव्र वेदना आणि ताप येत आहे.",
            "en": "I have been experiencing severe abdominal pain and fever for 3 days.",
        }
        transcript = mock_map.get(language_code.lower(), mock_map["en"])
        return SpeechToTextResult(
            transcript=transcript,
            language=language_code,
            confidence=0.95,
            detected_language=language_code,
            is_empty=False,
            raw_response={"mock": True, "audio_length_bytes": len(audio_bytes)},
        )

    def is_healthy(self) -> bool:
        return True


class MockTextToSpeechProvider(TextToSpeechProvider):
    """Deterministic fallback TTS provider returning dummy audio headers."""

    @property
    def engine_name(self) -> str:
        return "MOCK_TTS"

    async def synthesize(
        self,
        text: str,
        language_code: str = "en",
        gender: str = "female",
    ) -> TextToSpeechResult:
        # Minimal valid 44-byte RIFF/WAV header (16kHz, 16-bit mono PCM) for mock audio payloads
        dummy_wav = bytes.fromhex(
            "524946462400000057415645666d74201000000001000100803e0000007d0000020010006461746100000000"
        )
        return TextToSpeechResult(
            audio_bytes=dummy_wav,
            content_type="audio/wav",
            language=language_code,
            sample_rate=16000,
            raw_response={"mock": True, "text_length": len(text)},
        )

    def is_healthy(self) -> bool:
        return True
