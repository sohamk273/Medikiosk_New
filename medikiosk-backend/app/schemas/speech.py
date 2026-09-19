"""Pydantic schemas for Speech-to-Text and voice ingestion APIs."""
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SpeechTranscriptionResponse(BaseModel):
    """Standardized response schema for speech-to-text audio transcription."""
    model_config = ConfigDict(from_attributes=True)

    success: bool = Field(True, description="Indicates whether speech transcription succeeded")
    transcript: str = Field(..., description="Transcribed textual narrative from speech audio")
    language: str = Field(..., description="Language code used for transcription (en, hi, mr)")
    detected_language: Optional[str] = Field(None, description="Spoken language detected by ASR engine if available")
    confidence: Optional[float] = Field(None, description="Confidence score of recognition (0.0 to 1.0)")
    is_empty: bool = Field(False, description="True if no intelligible speech or silence was detected")
    provider: str = Field(..., description="Identifier of the ASR engine utilized (MOCK_ASR, BHASHINI_ASR)")
