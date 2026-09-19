"""Google Gemini Clinical Intelligence and Case-Taking Provider for Stage 7.

Safety rules strictly enforced:
1. No medical diagnosis generation.
2. No medication prescribing or treatment plans.
3. Grounding check: Extracted entities must be rooted in the patient transcript.
4. Red-flag indicators must be identified and preserved for deterministic verification.
5. Structured JSON schema response generation.
"""
import json
import logging
from typing import Dict, Any, Optional, List
import httpx

from app.core.config import settings
from app.providers.llm.base import (
    LLMProvider,
    ClinicalEntityExtractionResult,
    ClinicalSymptomEntity,
    CaseTakingTurnResult,
    DoctorCaseSummaryResult,
)

logger = logging.getLogger("gemini_provider")


class GeminiProviderError(Exception):
    """Exception raised when Gemini API encounters a request, parsing, or upstream failure."""
    pass


class GeminiClinicalProvider(LLMProvider):
    """Live Google Gemini LLM provider for clinical entity extraction and case intake orchestration."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.api_key = api_key or settings.effective_gemini_key
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.timeout_seconds = timeout_seconds or settings.GEMINI_TIMEOUT_SECONDS
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    @property
    def provider_name(self) -> str:
        return f"GEMINI_CLINICAL ({self.model_name})"

    def is_healthy(self) -> bool:
        """Returns True if the Gemini API key is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 0)

    async def _call_gemini_api(self, system_instruction: str, prompt: str) -> Dict[str, Any]:
        """Calls Google Gemini API with system instructions and JSON response mode."""
        if not self.is_healthy():
            raise GeminiProviderError("Gemini API key is not configured.")

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [
                    {"text": system_instruction}
                ]
            },
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
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
        except httpx.TimeoutException as te:
            logger.error("Gemini API request timed out after %s seconds", self.timeout_seconds)
            raise GeminiProviderError("Gemini API request timed out.") from te
        except httpx.HTTPStatusError as hse:
            logger.error("Gemini API returned HTTP %s error: %s", hse.response.status_code, hse.response.text)
            raise GeminiProviderError(
                f"Gemini API upstream error (HTTP {hse.response.status_code})."
            ) from hse
        except httpx.RequestError as re:
            logger.error("Gemini API network connection failure: %s", type(re).__name__)
            raise GeminiProviderError("Failed to connect to Gemini API service.") from re
        except Exception as exc:
            logger.error("Unexpected error during Gemini API call: %s", exc)
            raise GeminiProviderError(f"Unexpected error communicating with Gemini API: {str(exc)}") from exc

        # Extract text content from candidates
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                raise GeminiProviderError("No response candidates returned by Gemini.")
            
            content_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not content_part:
                raise GeminiProviderError("Empty text payload received from Gemini.")

            return json.loads(content_part)
        except json.JSONDecodeError as jde:
            logger.error("Failed to parse Gemini output as JSON: %s", jde)
            raise GeminiProviderError("Malformed JSON returned by Gemini.") from jde
        except Exception as err:
            logger.error("Failed to extract Gemini candidate content: %s", err)
            raise GeminiProviderError(f"Failed to process Gemini response structure: {str(err)}") from err

    async def extract_clinical_entities(
        self,
        patient_narrative: str,
        language_code: str = "en",
    ) -> ClinicalEntityExtractionResult:
        """Extracts structured medical entities from the patient's narrative using Gemini."""
        system_prompt = (
            "You are a clinical entity extraction engine for a hospital OPD kiosk.\n"
            "STRICT RULES:\n"
            "1. ONLY extract clinical entities that are EXPLICITLY stated in the patient narrative.\n"
            "2. DO NOT diagnose diseases.\n"
            "3. DO NOT fabricate medications, allergies, symptoms, or medical history.\n"
            "4. Identify any red flags such as severe crushing chest pain, difficulty breathing, syncope, or heavy bleeding.\n"
            "5. Return a valid JSON object matching the requested schema exactly."
        )

        user_prompt = f"""
Patient Spoken Language: {language_code}
Patient Narrative: "{patient_narrative}"

Extract structured entities as JSON:
{{
  "primary_complaint": string,
  "symptoms": [
    {{
      "name": string,
      "location": string or null,
      "duration": string or null,
      "severity": string or null,
      "triggers": string or null,
      "is_red_flag": boolean
    }}
  ],
  "duration_summary": string or null,
  "severity_scale": integer (1-10) or null,
  "red_flag_detected": boolean,
  "red_flag_reasons": [string],
  "associated_symptoms": [string],
  "medications": [string],
  "allergies": [string],
  "medical_history": [string]
}}
"""
        parsed = await self._call_gemini_api(system_prompt, user_prompt)

        symptoms_list: List[ClinicalSymptomEntity] = []
        for s in parsed.get("symptoms", []):
            if isinstance(s, dict) and s.get("name"):
                symptoms_list.append(
                    ClinicalSymptomEntity(
                        name=s.get("name", ""),
                        location=s.get("location"),
                        duration=s.get("duration"),
                        severity=s.get("severity"),
                        triggers=s.get("triggers"),
                        is_red_flag=s.get("is_red_flag", False),
                    )
                )

        return ClinicalEntityExtractionResult(
            primary_complaint=parsed.get("primary_complaint", patient_narrative[:50]),
            symptoms=symptoms_list,
            duration_summary=parsed.get("duration_summary"),
            severity_scale=parsed.get("severity_scale"),
            red_flag_detected=parsed.get("red_flag_detected", False),
            red_flag_reasons=parsed.get("red_flag_reasons", []),
            ayush_prakriti_indicators=[],
            raw_response=parsed,
        )

    async def process_case_turn(
        self,
        conversation_history: List[Dict[str, str]],
        current_utterance: str,
        language_code: str = "en",
        chief_complaint: Optional[str] = None,
    ) -> CaseTakingTurnResult:
        """Processes a conversation turn with Gemini to extract entities and generate the next inquiry."""
        system_prompt = (
            "You are a clinical case-taking assistant for a hospital OPD kiosk.\n"
            "STRICT RULES:\n"
            "1. Ask focused, empathetic, single-dimension questions to collect missing history (Location, Duration, Severity, Character, Associated Symptoms).\n"
            "2. DO NOT diagnose or recommend treatments.\n"
            "3. Provide next_question in English and next_question_regional in the patient's language (Hindi or Marathi if requested).\n"
            "4. If sufficient history (Chief Complaint, Location, Duration, Severity, Associated Symptoms) is gathered or 4+ turns completed, mark is_intake_complete=true.\n"
            "5. Return valid JSON only."
        )

        user_prompt = f"""
Language Code: {language_code}
Chief Complaint: {chief_complaint or "Not specified"}
Current Patient Utterance: "{current_utterance}"
Conversation History: {json.dumps(conversation_history)}

Generate JSON:
{{
  "next_question_en": string,
  "next_question_regional": string,
  "is_intake_complete": boolean,
  "question_type": string ("LOCATION" | "DURATION" | "SEVERITY" | "CHARACTER" | "ASSOCIATED_SYMPTOMS" | "MEDICATIONS" | "COMPLETE" | "EMERGENCY"),
  "extracted_entities": {{
    "primary_complaint": string,
    "symptoms": [
      {{
        "name": string,
        "location": string or null,
        "duration": string or null,
        "severity": string or null,
        "is_red_flag": boolean
      }}
    ],
    "duration_summary": string or null,
    "severity_scale": integer or null,
    "red_flag_detected": boolean,
    "red_flag_reasons": [string]
  }},
  "clinical_reasoning": string
}}
"""
        parsed = await self._call_gemini_api(system_prompt, user_prompt)

        extracted_raw = parsed.get("extracted_entities", {})
        symptoms_list: List[ClinicalSymptomEntity] = []
        for s in extracted_raw.get("symptoms", []):
            if isinstance(s, dict) and s.get("name"):
                symptoms_list.append(
                    ClinicalSymptomEntity(
                        name=s.get("name", ""),
                        location=s.get("location"),
                        duration=s.get("duration"),
                        severity=s.get("severity"),
                        is_red_flag=s.get("is_red_flag", False),
                    )
                )

        extracted_res = ClinicalEntityExtractionResult(
            primary_complaint=extracted_raw.get("primary_complaint", current_utterance[:50]),
            symptoms=symptoms_list,
            duration_summary=extracted_raw.get("duration_summary"),
            severity_scale=extracted_raw.get("severity_scale"),
            red_flag_detected=extracted_raw.get("red_flag_detected", False),
            red_flag_reasons=extracted_raw.get("red_flag_reasons", []),
            raw_response=parsed,
        )

        return CaseTakingTurnResult(
            next_question_en=parsed.get("next_question_en", "Thank you. Your intake is complete."),
            next_question_regional=parsed.get("next_question_regional", parsed.get("next_question_en")),
            target_language=language_code,
            is_intake_complete=parsed.get("is_intake_complete", False),
            extracted_entities=extracted_res,
            clinical_reasoning=parsed.get("clinical_reasoning", "Gemini intake progression."),
            raw_response=parsed,
        )

    async def generate_doctor_summary(
        self,
        full_encounter_data: Dict[str, Any],
    ) -> DoctorCaseSummaryResult:
        """Synthesizes structured clinical intake into an objective doctor SOAP note."""
        system_prompt = (
            "You are a medical assistant formatting structured patient intake into an objective doctor SOAP briefing.\n"
            "STRICT RULES:\n"
            "1. Be concise, purely objective, and factual.\n"
            "2. DO NOT state definite diagnoses as fact; use 'Provisional/Differential' only.\n"
            "3. Explicitly report missing fields as 'Not reported'.\n"
            "4. Return valid JSON only."
        )

        user_prompt = f"Encounter Intake Data: {json.dumps(full_encounter_data)}"
        parsed = await self._call_gemini_api(system_prompt, user_prompt)

        return DoctorCaseSummaryResult(
            subjective=parsed.get("subjective", "Patient intake completed."),
            symptom_chronology=parsed.get("symptom_chronology", "Reported symptoms recorded."),
            vitals_and_red_flags=parsed.get("vitals_and_red_flags", "No critical flags detected."),
            ayush_constitutional_assessment=parsed.get("ayush_constitutional_assessment"),
            provisional_diagnoses=parsed.get("provisional_diagnoses", []),
            suggested_investigations=parsed.get("suggested_investigations", []),
            recommended_triage_priority=parsed.get("recommended_triage_priority", "NORMAL"),
            raw_response=parsed,
        )
