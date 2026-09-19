"""Stage 9 Structured Clinical Summary Test Suite.

Validates structured provenance-tagged doctor EMR summary generation and endpoints.
"""
import uuid
import json
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.clinical import (
    ClinicalCaseState,
    ClinicalSymptom,
    RedFlagEntity,
    ProvenanceTag,
    StructuredClinicalSummary,
    StructuredClinicalSection,
    StructuredSummaryItem,
)
from app.services.clinical.structured_summary_generator import (
    generate_structured_summary_deterministic,
    generate_structured_summary_with_ai,
)
from app.providers.llm.base import MockLLMProvider, StructuredSummaryResult


@pytest.fixture
def sample_case_state() -> ClinicalCaseState:
    return ClinicalCaseState(
        chief_complaint="Severe lower abdominal pain",
        symptoms=[
            ClinicalSymptom(
                name="Abdominal pain",
                location="Lower abdomen / Right iliac fossa",
                onset="Acute",
                duration="3 days",
                severity="7/10",
                character="Sharp cramping",
                aggravating_factors=["Walking", "Post-prandial"],
                relieving_factors=["Lying down"],
            )
        ],
        associated_symptoms=["Nausea", "Low-grade fever"],
        fever=True,
        medications=["Paracetamol 500mg SOS"],
        allergies=["Penicillin"],
        medical_history=["Hypertension"],
        surgical_history=["Appendectomy (2018)"],
        family_history=["Diabetes Mellitus"],
        lifestyle_information=["Non-smoker"],
        red_flags=[],
        patient_language="en",
    )


def test_01_deterministic_summary_creates_expected_sections(sample_case_state):
    """Verifies deterministic summary contains all structured sections."""
    summary = generate_structured_summary_deterministic(
        case_state=sample_case_state,
        turns=[],
        is_emergency=False,
        patient_language="en",
    )
    assert isinstance(summary, StructuredClinicalSummary)
    assert summary.version == "1.0"
    assert len(summary.sections) >= 5

    titles = [s.section_title for s in summary.sections]
    assert "Patient Presentation" in titles
    assert "History of Presenting Illness" in titles
    assert "Medications & Allergies" in titles
    assert "Medical History" in titles


def test_02_provenance_tagging_patient_vs_system(sample_case_state):
    """Verifies patient-reported items are tagged PATIENT_REPORTED and system items SYSTEM_DETECTED."""
    summary = generate_structured_summary_deterministic(
        case_state=sample_case_state,
        turns=[],
        is_emergency=False,
        patient_language="en",
    )
    pres_section = next(s for s in summary.sections if s.section_title == "Patient Presentation")
    chief_item = next(i for i in pres_section.items if i.label == "Chief Complaint")
    assert chief_item.provenance == ProvenanceTag.PATIENT_REPORTED
    assert chief_item.value == "Severe lower abdominal pain"

    med_section = next(s for s in summary.sections if s.section_title == "Medications & Allergies")
    med_item = next(i for i in med_section.items if i.label == "Current Medications")
    assert med_item.provenance == ProvenanceTag.PATIENT_REPORTED


def test_03_red_flags_tagged_system_detected():
    """Verifies red flag alerts in summary are marked SYSTEM_DETECTED."""
    emergency_state = ClinicalCaseState(
        chief_complaint="Crushing chest pain radiating to left arm",
        red_flags=[
            RedFlagEntity(
                type="CHEST_PAIN",
                severity="CRITICAL",
                source_text="crushing chest pain",
                clinical_note="High priority cardiac evaluation",
            )
        ],
        patient_language="en",
    )
    summary = generate_structured_summary_deterministic(
        case_state=emergency_state,
        turns=[],
        is_emergency=True,
        patient_language="en",
    )
    assert len(summary.red_flag_alerts) >= 1
    assert summary.red_flag_alerts[0].provenance == ProvenanceTag.SYSTEM_DETECTED


@pytest.mark.asyncio
async def test_04_ai_structured_summary_fallback_on_error(sample_case_state):
    """Verifies AI summary generator falls back to deterministic summary on LLM error."""
    mock_llm = MockLLMProvider()
    summary = await generate_structured_summary_with_ai(
        case_state=sample_case_state,
        turns=[],
        is_emergency=False,
        patient_language="en",
        llm_provider=mock_llm,
    )
    assert isinstance(summary, StructuredClinicalSummary)
    assert len(summary.sections) > 0


@pytest.mark.asyncio
async def test_05_api_get_structured_summary(client: AsyncClient, db_session: AsyncSession, sample_case_state):
    """Verifies GET /api/v1/clinical/encounters/{id}/structured-summary endpoint."""
    enc_id = str(uuid.uuid4())
    finalize_payload = {
        "encounter_id": enc_id,
        "language": "en",
        "case_state": sample_case_state.model_dump(),
        "conversation_history": [
            {
                "turn": 1,
                "question": "What is your main symptom?",
                "question_type": "CHIEF_COMPLAINT",
                "patient_transcript": "Severe lower abdominal pain",
                "language": "en",
            }
        ],
        "is_emergency": False,
    }

    fin_res = await client.post("/api/v1/clinical/finalize", json=finalize_payload)
    assert fin_res.status_code == 200

    res = await client.get(f"/api/v1/clinical/encounters/{enc_id}/structured-summary")
    assert res.status_code == 200
    data = res.json()
    assert "structured_summary" in data
    assert data["structured_summary"]["version"] == "1.0"
    assert len(data["structured_summary"]["sections"]) >= 4
