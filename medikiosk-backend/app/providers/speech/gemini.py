import base64
import logging
from typing import Optional
import httpx

from app.core.config import settings
from app.providers.speech.base import SpeechToTextProvider, SpeechToTextResult

logger = logging.getLogger("gemini_stt")


class GeminiSpeechToTextProvider(SpeechToTextProvider):
    """Google Gemini natively processing audio bytes for Speech-to-Text transcription."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.api_key = api_key or settings.effective_gemini_key
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.timeout_seconds = timeout_seconds or 30.0
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    @property
    def engine_name(self) -> str:
        return "GEMINI_ASR"

    def is_healthy(self) -> bool:
        return bool(self.api_key)

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

        if not self.api_key:
            logger.error("Gemini API key is not configured for transcription.")
            raise Exception("Gemini API key is missing.")

        b64_data = base64.b64encode(audio_bytes).decode("utf-8")

        prompt = (
            f"Please accurately transcribe the following spoken audio. "
            f"The spoken language is expected to be '{language_code}'. "
            f"Return ONLY the transcription text, with no markdown, formatting, or commentary."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": b64_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
            }
        }

        url_with_key = f"{self.api_url}?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    url_with_key,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            logger.error("Error during Gemini audio transcription: %s", exc)
            raise Exception(f"Failed to transcribe audio via Gemini: {exc}") from exc

        try:
            candidates = data.get("candidates", [])
            if not candidates:
                raise Exception("No response candidates returned by Gemini transcription.")
            
            content_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            transcript = content_part.strip()
            
            return SpeechToTextResult(
                transcript=transcript,
                language=language_code,
                confidence=0.9,
                is_empty=not bool(transcript),
                raw_response=data
            )
        except Exception as exc:
            logger.error("Failed to parse Gemini transcription output: %s", exc)
            raise Exception(f"Failed to process Gemini transcription response: {exc}") from exc
