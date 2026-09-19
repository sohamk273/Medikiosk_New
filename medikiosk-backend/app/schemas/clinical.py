"""Clinical schemas for structured case state, entity extraction, turns, and persistence."""
import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class ClinicalSymptom(BaseModel):
    """Structured clinical symptom entity."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Symptom name (e.g., abdominal pain, fever)")
    location: Optional[str] = Field(None, description="Anatomical location if applicable")
    onset: Optional[str] = Field(None, description="Onset timing (e.g., sudden, gradual)")
    duration: Optional[str] = Field(None, description="Duration string (e.g., 3 days)")
    severity: Optional[str] = Field(None, description="Severity rating or scale (e.g., severe, 8/10)")
    character: Optional[str] = Field(None, description="Quality/character (e.g., burning, sharp, dull)")
    aggravating_factors: List[str] = Field(default_factory=list, description="Aggravating triggers")
    relieving_factors: List[str] = Field(default_factory=list, description="Relieving factors")


class RedFlagEntity(BaseModel):
    """Explicit critical clinical alert indicator."""
    model_config = ConfigDict(from_attributes=True)

    type: str = Field(..., description="Category of red flag (e.g. CHEST_PAIN, BREATHING_DIFFICULTY)")
    severity: str = Field("HIGH", description="Alert severity level: CRITICAL, HIGH, MODERATE")
    source_text: str = Field(..., description="Exact phrasing or signal triggering the alert")
    clinical_note: Optional[str] = Field(None, description="Explanation or recommendation for priority")
    detected_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractedClinicalEntities(BaseModel):
    """Normalized structured entities parsed from patient narrative."""
    model_config = ConfigDict(from_attributes=True)

    symptoms: List[str] = Field(default_factory=list)
    body_locations: List[str] = Field(default_factory=list)
    duration: List[str] = Field(default_factory=list)
    severity: List[str] = Field(default_factory=list)
    associated_symptoms: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    medical_history: List[str] = Field(default_factory=list)
    red_flags: List[RedFlagEntity] = Field(default_factory=list)


class ClinicalCaseState(BaseModel):
    """Accumulated structured clinical history state for an encounter."""
    model_config = ConfigDict(from_attributes=True)

    chief_complaint: Optional[str] = Field(None, description="Primary clinical reason for visit")
    symptoms: List[ClinicalSymptom] = Field(default_factory=list)
    associated_symptoms: List[str] = Field(default_factory=list)
    fever: Optional[bool] = Field(None, description="Presence of fever")
    medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    medical_history: List[str] = Field(default_factory=list)
    surgical_history: List[str] = Field(default_factory=list)
    family_history: List[str] = Field(default_factory=list)
    lifestyle_information: List[str] = Field(default_factory=list)
    red_flags: List[RedFlagEntity] = Field(default_factory=list)
    patient_language: str = Field("en", description="Preferred spoken language")
    completed_sections: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)


class ClinicalTurnRequest(BaseModel):
    """Request payload for processing a patient intake conversational turn."""
    transcript: str = Field(..., description="Patient utterance or transcribed voice response")
    language: str = Field("en", description="Language code: en, hi, mr")
    case_state: Optional[ClinicalCaseState] = Field(None, description="Current accumulated case state")


class ClinicalTurnResponse(BaseModel):
    """Standardized response schema containing extracted entities, updated case state, and next question."""
    model_config = ConfigDict(from_attributes=True)

    success: bool = Field(True, description="Indicates if clinical processing succeeded")
    transcript: str = Field(..., description="Processed patient input")
    language: str = Field(..., description="Target interaction language")
    extracted_entities: ExtractedClinicalEntities = Field(..., description="Structured entities extracted from input")
    case_state: ClinicalCaseState = Field(..., description="Updated structured clinical case state")
    next_question: str = Field(..., description="Next conversational intake question in English")
    next_question_regional: Optional[str] = Field(None, description="Next question localized in patient's language")
    next_question_type: str = Field(..., description="Category of next question (LOCATION, DURATION, SEVERITY, COMPLETE)")
    missing_information: List[str] = Field(default_factory=list, description="List of clinical fields still missing")
    red_flags: List[RedFlagEntity] = Field(default_factory=list, description="Any critical flags active in case")
    requires_emergency_attention: bool = Field(False, description="True if any red-flag emergency is detected")
    is_case_complete: bool = Field(False, description="True if sufficient history has been collected")
    provider: str = Field(..., description="Identifier of LLM provider engine (MOCK_LLM, GEMINI_CLINICAL)")


# ==========================================
# STAGE 6 PERSISTENCE & HANDOFF SCHEMAS
# ==========================================

class ClinicalTurnRecordRead(BaseModel):
    """Persisted conversation turn read schema."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    turn_number: int
    question: str
    question_type: str
    patient_transcript: str
    language: str
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ClinicalFinalizeRequest(BaseModel):
    """Request payload to finalize and persist a clinical intake case record."""
    encounter_id: Optional[uuid.UUID] = Field(None, description="Linked core encounter ID if exists")
    patient_id: Optional[uuid.UUID] = Field(None, description="Linked patient ID if exists")
    case_state: Optional[ClinicalCaseState] = Field(None, description="Accumulated structured case state")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="List of turns containing question, transcript, language, and extracted entities",
    )
    language: str = Field("en", description="Primary interaction language")
    is_emergency: bool = Field(False, description="Indicates if emergency alert was triggered")


class ClinicalEncounterRead(BaseModel):
    """Complete persistent clinical encounter record returned to doctor EMR."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    encounter_id: Optional[uuid.UUID] = None
    patient_id: Optional[uuid.UUID] = None
    status: str
    patient_language: str
    chief_complaint: Optional[str] = None
    case_state: Dict[str, Any]
    final_summary: str
    red_flags: List[Dict[str, Any]] = Field(default_factory=list)
    is_emergency: bool
    completion_status: str
    intake_started_at: datetime
    finalized_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    turns: List[ClinicalTurnRecordRead] = Field(default_factory=list)


class ClinicalSummaryResponse(BaseModel):
    """Concise doctor-facing summary response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    encounter_id: Optional[uuid.UUID] = None
    patient_id: Optional[uuid.UUID] = None
    chief_complaint: Optional[str] = None
    final_summary: str
    is_emergency: bool
    red_flags: List[Dict[str, Any]] = Field(default_factory=list)
    completion_status: str
    patient_language: str
    created_at: datetime
    finalized_at: Optional[datetime] = None


class ClinicalConversationResponse(BaseModel):
    """Full chronological conversation history for an encounter."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    encounter_id: Optional[uuid.UUID] = None
    total_turns: int
    turns: List[ClinicalTurnRecordRead] = Field(default_factory=list)
