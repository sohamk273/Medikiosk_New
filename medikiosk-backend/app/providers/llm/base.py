"""Abstract provider contracts and schemas for Clinical LLM Intelligence and Case-Taking."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any


@dataclass
class ClinicalSymptomEntity:
    """Individual structured clinical symptom extracted from patient intake."""
    name: str
    location: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[str] = None
    triggers: Optional[str] = None
    is_red_flag: bool = False


@dataclass
class ClinicalEntityExtractionResult:
    """Structured clinical entities extracted from patient narrative and intake answers."""
    primary_complaint: str = ""
    symptoms: List[ClinicalSymptomEntity] = field(default_factory=list)
    duration_summary: Optional[str] = None
    severity_scale: Optional[int] = None  # 1 to 10 scale
    red_flag_detected: bool = False
    red_flag_reasons: List[str] = field(default_factory=list)
    ayush_prakriti_indicators: List[str] = field(default_factory=list)
    raw_response: Optional[Dict[str, Any]] = field(default_factory=dict)


@dataclass
class CaseTakingTurnResult:
    """Output of a conversational case-taking step."""
    next_question_en: str
    next_question_regional: Optional[str] = None
    target_language: str = "en"
    is_intake_complete: bool = False
    extracted_entities: ClinicalEntityExtractionResult = field(default_factory=ClinicalEntityExtractionResult)
    clinical_reasoning: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = field(default_factory=dict)


@dataclass
class DoctorCaseSummaryResult:
    """Objective doctor-facing clinical briefing (SOAP format)."""
    subjective: str
    symptom_chronology: str
    vitals_and_red_flags: str
    ayush_constitutional_assessment: Optional[str] = None
    provisional_diagnoses: List[str] = field(default_factory=list)
    suggested_investigations: List[str] = field(default_factory=list)
    recommended_triage_priority: str = "NORMAL"  # "NORMAL" or "EMERGENCY"
    raw_response: Optional[Dict[str, Any]] = field(default_factory=dict)


class LLMProvider(ABC):
    """Abstract interface for Medical Large Language Model (LLM) intelligence engines."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Canonical name of the LLM engine (e.g. 'gemini-1.5-flash', 'mock-llm')."""
        pass

    @abstractmethod
    async def process_case_turn(
        self,
        conversation_history: List[Dict[str, str]],
        current_utterance: str,
        language_code: str = "en",
        chief_complaint: Optional[str] = None,
    ) -> CaseTakingTurnResult:
        """Evaluates patient conversation history and generates the next structured question."""
        pass

    @abstractmethod
    async def extract_clinical_entities(
        self,
        patient_narrative: str,
        language_code: str = "en",
    ) -> ClinicalEntityExtractionResult:
        """Parses free-form speech/text into structured clinical medical entities."""
        pass

    @abstractmethod
    async def generate_doctor_summary(
        self,
        full_encounter_data: Dict[str, Any],
    ) -> DoctorCaseSummaryResult:
        """Synthesizes structured clinical intake into an objective doctor SOAP note."""
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """Verifies API key and provider connectivity."""
        pass


class MockLLMProvider(LLMProvider):
    """Deterministic fallback LLM provider used when live LLM is disabled."""

    @property
    def provider_name(self) -> str:
        return "MOCK_LLM"

    async def process_case_turn(
        self,
        conversation_history: List[Dict[str, str]],
        current_utterance: str,
        language_code: str = "en",
        chief_complaint: Optional[str] = None,
    ) -> CaseTakingTurnResult:
        turn_count = len(conversation_history)
        is_done = turn_count >= 4

        next_q_en = (
            "Thank you. Your intake is complete."
            if is_done
            else "How severe is your discomfort on a scale of 1 to 10?"
        )
        next_q_hi = (
            "धन्यवाद। आपकी प्राथमिक जांच पूरी हो गई है।"
            if is_done
            else "1 से 10 के पैमाने पर आपकी परेशानी कितनी गंभीर है?"
        )
        next_q_mr = (
            "धन्यवाद. तुमची प्राथमिक तपासणी पूर्ण झाली आहे."
            if is_done
            else "1 ते 10 च्या प्रमाणात तुमचा त्रास किती तीव्र आहे?"
        )

        regional_q = next_q_hi if language_code == "hi" else next_q_mr if language_code == "mr" else next_q_en

        return CaseTakingTurnResult(
            next_question_en=next_q_en,
            next_question_regional=regional_q,
            target_language=language_code,
            is_intake_complete=is_done,
            extracted_entities=ClinicalEntityExtractionResult(
                primary_complaint=chief_complaint or "Abdominal Discomfort",
                symptoms=[
                    ClinicalSymptomEntity(
                        name="Abdominal Pain",
                        location="Epigastrium",
                        duration="3 days",
                        severity="Moderate",
                    )
                ],
                duration_summary="3 days",
                severity_scale=6,
                red_flag_detected=False,
            ),
            clinical_reasoning="Mock turn logic based on intake progression.",
            raw_response={"mock": True, "turn": turn_count},
        )

    async def extract_clinical_entities(
        self,
        patient_narrative: str,
        language_code: str = "en",
    ) -> ClinicalEntityExtractionResult:
        return ClinicalEntityExtractionResult(
            primary_complaint=patient_narrative[:50],
            symptoms=[
                ClinicalSymptomEntity(
                    name="Reported Symptom",
                    location="General",
                    duration="Recent",
                    severity="Moderate",
                )
            ],
            duration_summary="Recent onset",
            severity_scale=5,
            red_flag_detected=False,
            raw_response={"mock": True},
        )

    async def generate_doctor_summary(
        self,
        full_encounter_data: Dict[str, Any],
    ) -> DoctorCaseSummaryResult:
        return DoctorCaseSummaryResult(
            subjective="Patient presented via MediKiosk with abdominal discomfort of 3 days duration.",
            symptom_chronology="Onset 3 days ago, worsening post-meals.",
            vitals_and_red_flags="No acute hemodynamic instability or red-flag signs reported during triage.",
            ayush_constitutional_assessment="Pitta-Kapha dominant presentation with Agnimandya signs.",
            provisional_diagnoses=["Acute Gastritis", "Functional Dyspepsia"],
            suggested_investigations=["Complete Blood Count (CBC)", "Ultrasound Abdomen if refractory"],
            recommended_triage_priority="NORMAL",
            raw_response={"mock": True},
        )

    def is_healthy(self) -> bool:
        return True
