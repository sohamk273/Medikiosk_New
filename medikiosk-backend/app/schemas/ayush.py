"""Pydantic schemas for AYUSH Prakriti and Ayurvedic assessment."""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class AYUSHIntakeCreate(BaseModel):
    """Payload sent by kiosk when patient completes AYUSH questionnaire."""
    patient_responses: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of question-answer pairs submitted on kiosk",
    )
    prakriti_scores: Optional[Dict[str, int]] = Field(
        default=None,
        description="Optional pre-computed scores e.g. {'vata': 4, 'pitta': 6, 'kapha': 2}",
    )
    dominant_prakriti: Optional[str] = Field(
        default=None,
        description="Optional pre-computed dominant dosha e.g. Pitta-Kapha",
    )


class AYUSHDoctorAssessmentUpdate(BaseModel):
    """Payload submitted by doctor to save or update Ayurvedic clinical findings."""
    prakriti: Optional[str] = Field(None, description="Doctor-confirmed Prakriti")
    vikriti: Optional[str] = Field(None, description="Dosha imbalance / Vikriti")
    agni: Optional[str] = Field(None, description="Agni type: Sama, Vishama, Tikshna, Manda")
    koshtha: Optional[str] = Field(None, description="Koshtha: Krura, Mridu, Madhya")
    dosha_imbalance: Optional[List[str]] = Field(default_factory=list, description="Affected doshas")
    diet_lifestyle_advice: Optional[str] = Field(None, description="Pathya / Apathya recommendations")
    ayurvedic_formulations: Optional[List[str]] = Field(default_factory=list, description="Recommended formulations")
    notes: Optional[str] = Field(None, description="Clinical AYUSH notes")


class AYUSHAssessmentRead(BaseModel):
    """Full persistent AYUSH assessment record."""
    id: uuid.UUID
    encounter_id: uuid.UUID
    patient_id: uuid.UUID
    prakriti_scores: Dict[str, Any]
    dominant_prakriti: str
    patient_responses: List[Dict[str, Any]]
    doctor_assessment: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
