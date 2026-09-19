"""Bhashini / ULCA Speech Recognition (ASR) provider implementation."""
import base64
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.providers.speech.base import SpeechToTextProvider, SpeechToTextResult


class BhashiniTranscriptionError(Exception):
    """Exception raised when Bhashini ASR fails or returns an unprocessable response."""
    pass


class BhashiniSpeechToTextProvider(SpeechToTextProvider):
    """Concrete Speech-to-Text provider integrating Government of India Bhashini / ULCA ASR.
    
    Operates when ENABLE_LIVE_BHASHINI is True and valid credentials are provided.
    Encapsulates ULCA pipeline payload construction, request execution, and response parsing.
    """

    def __init__(
        self,
        user_id: Optional[str] = None,
        api_key: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        inference_url: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.user_id = user_id or settings.BHASHINI_USER_ID
        self.api_key = api_key or settings.BHASHINI_API_KEY
        self.pipeline_id = pipeline_id or settings.BHASHINI_PIPELINE_ID
        self.inference_url = inference_url or settings.BHASHINI_INFERENCE_URL
        self.timeout_seconds = timeout_seconds or settings.BHASHINI_ASR_TIMEOUT_SECONDS

    @property
    def engine_name(self) -> str:
        return "BHASHINI_ASR"

    def is_healthy(self) -> bool:
        """Returns True if the required credentials are configured."""
        return bool(self.api_key and self.user_id)

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str = "en",
        mime_type: str = "audio/wav",
    ) -> SpeechToTextResult:
        """Transcribes audio bytes into text via Bhashini / ULCA ASR pipeline.
        
        Args:
            audio_bytes: Raw binary audio payload (WAV, WebM, etc.)
            language_code: ISO language code (e.g. 'hi', 'mr', 'en')
            mime_type: Audio MIME format
            
        Returns:
            SpeechToTextResult containing standardized transcript and confidence.
        """
        if not audio_bytes or len(audio_bytes) == 0:
            return SpeechToTextResult(
                transcript="",
                language=language_code,
                confidence=0.0,
                is_empty=True,
            )

        # Normalize audio format for ULCA config
        audio_format = "wav"
        if "webm" in mime_type.lower():
            audio_format = "webm"
        elif "ogg" in mime_type.lower():
            audio_format = "ogg"
        elif "mp3" in mime_type.lower() or "mpeg" in mime_type.lower():
            audio_format = "mp3"

        # Base64 encode raw audio content
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        # Build ULCA standard pipeline inference request
        task_config: Dict[str, Any] = {
            "language": {
                "sourceLanguage": language_code.lower(),
            },
            "audioFormat": audio_format,
            "samplingRate": 16000,
        }
        if self.pipeline_id:
            task_config["pipelineId"] = self.pipeline_id

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": task_config,
                }
            ],
            "inputData": {
                "audio": [
                    {
                        "audioContent": audio_b64,
                    }
                ]
            },
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": self.api_key,
            "userID": self.user_id,
            "ulcaApiKey": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    self.inference_url,
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as te:
            logger.error("Bhashini ASR request timed out after %s seconds", self.timeout_seconds)
            raise BhashiniTranscriptionError("Bhashini ASR service request timed out.") from te
        except httpx.HTTPStatusError as hse:
            logger.error("Bhashini ASR returned HTTP %s error", hse.response.status_code)
            raise BhashiniTranscriptionError(
                f"Bhashini ASR upstream error (HTTP {hse.response.status_code})."
            ) from hse
        except httpx.RequestError as re:
            logger.error("Bhashini ASR network connectivity failure: %s", type(re).__name__)
            raise BhashiniTranscriptionError("Failed to communicate with Bhashini ASR service.") from re
        except Exception as exc:
            logger.error("Unexpected error during Bhashini ASR request: %s", type(exc).__name__)
            raise BhashiniTranscriptionError("Unexpected error during speech transcription.") from exc

        # Parse transcript safely from response
        transcript = ""
        try:
            if "pipelineResponse" in data and isinstance(data["pipelineResponse"], list) and len(data["pipelineResponse"]) > 0:
                task_res = data["pipelineResponse"][0]
                if "output" in task_res and isinstance(task_res["output"], list) and len(task_res["output"]) > 0:
                    transcript = task_res["output"][0].get("source", "").strip()
            elif "output" in data and isinstance(data["output"], list) and len(data["output"]) > 0:
                transcript = data["output"][0].get("source", "").strip()
        except Exception as pe:
            logger.error("Failed to parse Bhashini ASR response JSON: %s", pe)
            raise BhashiniTranscriptionError("Malformed response received from Bhashini ASR.") from pe

        is_empty = len(transcript) == 0

        return SpeechToTextResult(
            transcript=transcript,
            language=language_code,
            confidence=0.92 if not is_empty else 0.0,
            detected_language=language_code,
            is_empty=is_empty,
            raw_response={"bhashini_status": "success", "length": len(transcript)},
        )
