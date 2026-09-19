"""Speech recognition and voice ingestion API endpoints."""
import os
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.logging import logger
from app.providers.speech import get_stt_provider, SpeechToTextProvider
from app.providers.speech.bhashini import BhashiniTranscriptionError
from app.schemas.speech import SpeechTranscriptionResponse

router = APIRouter(prefix="/speech", tags=["Speech"])


def _extract_base_mime(content_type: Optional[str]) -> str:
    """Extracts base MIME type excluding parameters (e.g. 'audio/webm;codecs=opus' -> 'audio/webm')."""
    if not content_type:
        return ""
    return content_type.split(";")[0].strip().lower()


@router.post(
    "/transcribe",
    response_model=SpeechTranscriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe patient voice recording to text",
)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio recording file (e.g., WAV or WebM)"),
    language_code: str = Form("en", description="Expected spoken language (en, hi, mr)"),
    stt_provider: SpeechToTextProvider = Depends(get_stt_provider),
) -> SpeechTranscriptionResponse:
    """Ingests patient microphone audio and produces a standardized transcription.
    
    Supports English ('en'), Hindi ('hi'), and Marathi ('mr').
    Uses Bhashini ASR when live provider is enabled and configured, with deterministic mock fallback.
    """
    # 1. Validate Language Code
    normalized_lang = language_code.strip().lower()
    if normalized_lang not in settings.SUPPORTED_SPEECH_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported language '{language_code}'. Supported languages are: {', '.join(settings.SUPPORTED_SPEECH_LANGUAGES)}",
        )

    # 2. Validate MIME Type
    raw_content_type = file.content_type or ""
    base_mime = _extract_base_mime(raw_content_type)

    # Infer MIME type from file extension if content_type is generic
    if (not base_mime or base_mime in ["application/octet-stream", "binary/octet-stream"]) and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        ext_to_mime = {
            ".wav": "audio/wav",
            ".webm": "audio/webm",
            ".ogg": "audio/ogg",
            ".mp3": "audio/mp3",
            ".m4a": "audio/x-m4a",
        }
        if ext in ext_to_mime:
            base_mime = ext_to_mime[ext]

    if not base_mime or base_mime not in settings.ALLOWED_AUDIO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio media type '{raw_content_type}'. Allowed types are: {', '.join(settings.ALLOWED_AUDIO_MIME_TYPES)}",
        )

    # 3. Read Audio Bytes and Validate File Size
    try:
        audio_bytes = await file.read()
    except Exception as e:
        logger.error("Failed to read uploaded audio file: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded audio stream.",
        )

    if not audio_bytes or len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty.",
        )

    max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file size ({len(audio_bytes)} bytes) exceeds maximum limit of {settings.MAX_AUDIO_SIZE_MB}MB.",
        )

    # 4. Perform Speech-to-Text Transcription via Provider
    try:
        result = await stt_provider.transcribe(
            audio_bytes=audio_bytes,
            language_code=normalized_lang,
            mime_type=base_mime,
        )
    except BhashiniTranscriptionError as bhashini_err:
        logger.error("Bhashini ASR provider error: %s", bhashini_err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream Speech-to-Text service error. Please try again or use manual intake.",
        )
    except Exception as exc:
        logger.error("Unexpected error in speech transcription: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during audio processing.",
        )

    return SpeechTranscriptionResponse(
        success=True,
        transcript=result.transcript,
        language=result.language,
        detected_language=result.detected_language,
        confidence=result.confidence,
        is_empty=result.is_empty,
        provider=stt_provider.engine_name,
    )
