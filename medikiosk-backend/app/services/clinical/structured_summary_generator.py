"""Stage 9 — Structured Clinical Summary Generator with Provenance Tagging.

Provides deterministic fallback and AI-enhanced structured summary generation.
"""
import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.schemas.clinical import (
    ClinicalCaseState,
    ProvenanceTag,
    StructuredSummaryItem,
    StructuredClinicalSection,
    StructuredClinicalSummary,
)

logger = logging.getLogger("structured_summary_generator")

SAFETY_NOTICE = (
    "This summary is compiled from patient-reported intake data at the MediKiosk. "
    "No medical diagnosis is provided. Clinical assessment and diagnosis are "
    "reserved for the attending physician."
)


def _hash_case_state(case_state: Optional[ClinicalCaseState]) -> Optional[str]:
    """SHA256 hash of serialized case_state for integrity verification."""
    if not case_state:
        return None
    try:
        raw = json.dumps(
            case_state.model_dump(mode="json") if hasattr(case_state, "model_dump") else {},
            sort_keys=True,
        )
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
    except Exception:
        return None


def _item(label: str, value: Any, provenance: ProvenanceTag, confidence: Optional[str] = None) -> StructuredSummaryItem:
    """Helper to create a StructuredSummaryItem."""
    return StructuredSummaryItem(label=label, value=value, provenance=provenance, confidence=confidence)


def generate_structured_summary_deterministic(
    case_state: Optional[ClinicalCaseState],
    turns: Optional[List[Any]] = None,
    is_emergency: bool = False,
    patient_language: str = "en",
) -> StructuredClinicalSummary:
    """Builds a deterministic structured summary purely from ClinicalCaseState fields.

    All patient-sourced items are tagged PATIENT_REPORTED.
    All red-flag items are tagged SYSTEM_DETECTED.
    """
    now_str = datetime.utcnow().isoformat() + "Z"
    lang_label = {"en": "English (EN)", "hi": "Hindi (HI)", "mr": "Marathi (MR)"}.get(
        patient_language.lower(), patient_language.upper()
    )

    sections: List[StructuredClinicalSection] = []
    red_flag_alerts: List[StructuredSummaryItem] = []

    if not case_state:
        # Minimal sections for empty state
        sections.append(StructuredClinicalSection(
            section_title="Patient Presentation",
            items=[
                _item("Chief Complaint", "Not reported", ProvenanceTag.PATIENT_REPORTED),
                _item("Intake Language", lang_label, ProvenanceTag.PATIENT_REPORTED),
            ],
        ))
        sections.append(StructuredClinicalSection(
            section_title="Encounter Status",
            items=[
                _item("Status", "EMERGENCY_HALTED" if is_emergency else "INCOMPLETE", ProvenanceTag.SYSTEM_DETECTED),
                _item("Turns Completed", len(turns) if turns else 0, ProvenanceTag.SYSTEM_DETECTED),
            ],
        ))
        if is_emergency:
            red_flag_alerts.append(
                _item("Emergency Alert", "Priority flag triggered by clinical intake triage.", ProvenanceTag.SYSTEM_DETECTED)
            )
        return StructuredClinicalSummary(
            generated_at=now_str,
            patient_language=patient_language,
            summary_provider="DETERMINISTIC_FALLBACK",
            sections=sections,
            red_flag_alerts=red_flag_alerts,
            clinical_safety_notice=SAFETY_NOTICE,
            raw_case_state_hash=None,
        )

    # ---- Patient Presentation ----
    presentation_items = [
        _item("Chief Complaint", case_state.chief_complaint or "Not reported", ProvenanceTag.PATIENT_REPORTED),
        _item("Intake Language", lang_label, ProvenanceTag.PATIENT_REPORTED),
    ]
    sections.append(StructuredClinicalSection(section_title="Patient Presentation", items=presentation_items))

    # ---- History of Presenting Illness (HPI) ----
    hpi_items: List[StructuredSummaryItem] = []
    if case_state.symptoms:
        for sym in case_state.symptoms:
            s_name = getattr(sym, "name", str(sym))
            s_loc = getattr(sym, "location", None) or "Not reported"
            s_dur = getattr(sym, "duration", None) or "Not reported"
            s_sev = getattr(sym, "severity", None) or "Not reported"
            s_char = getattr(sym, "character", None) or "Not reported"
            s_agg = getattr(sym, "aggravating_factors", [])
            s_rel = getattr(sym, "relieving_factors", [])

            detail = (
                f"{s_name} — Location: {s_loc}, Duration: {s_dur}, "
                f"Severity: {s_sev}, Character: {s_char}"
            )
            if s_agg:
                detail += f", Aggravating: {', '.join(s_agg)}"
            if s_rel:
                detail += f", Relieving: {', '.join(s_rel)}"

            hpi_items.append(_item(f"Symptom: {s_name}", detail, ProvenanceTag.PATIENT_REPORTED))
    else:
        hpi_items.append(_item("Symptoms", "No specific symptoms reported", ProvenanceTag.PATIENT_REPORTED))
    sections.append(StructuredClinicalSection(section_title="History of Presenting Illness", items=hpi_items))

    # ---- Associated Symptoms ----
    assoc_items: List[StructuredSummaryItem] = []
    if case_state.associated_symptoms:
        for s in case_state.associated_symptoms:
            assoc_items.append(_item("Associated Symptom", s, ProvenanceTag.PATIENT_REPORTED))
    else:
        assoc_items.append(_item("Associated Symptoms", "None reported", ProvenanceTag.PATIENT_REPORTED))
    if case_state.fever is not None:
        assoc_items.append(_item("Fever", "Present" if case_state.fever else "Absent / Not reported", ProvenanceTag.PATIENT_REPORTED))
    sections.append(StructuredClinicalSection(section_title="Associated Symptoms", items=assoc_items))

    # ---- Medications & Allergies ----
    med_items = [
        _item(
            "Current Medications",
            case_state.medications if case_state.medications else "Not reported / None captured",
            ProvenanceTag.PATIENT_REPORTED,
        ),
        _item(
            "Known Allergies",
            case_state.allergies if case_state.allergies else "No known allergies reported",
            ProvenanceTag.PATIENT_REPORTED,
        ),
    ]
    sections.append(StructuredClinicalSection(section_title="Medications & Allergies", items=med_items))

    # ---- Medical History ----
    hist_items = [
        _item(
            "Past Medical History",
            case_state.medical_history if case_state.medical_history else "Not reported",
            ProvenanceTag.PATIENT_REPORTED,
        ),
        _item(
            "Surgical History",
            case_state.surgical_history if case_state.surgical_history else "Not reported",
            ProvenanceTag.PATIENT_REPORTED,
        ),
        _item(
            "Family History",
            case_state.family_history if case_state.family_history else "Not reported",
            ProvenanceTag.PATIENT_REPORTED,
        ),
    ]
    sections.append(StructuredClinicalSection(section_title="Medical History", items=hist_items))

    # ---- Lifestyle & Social History ----
    lifestyle_items = []
    if case_state.lifestyle_information:
        for ls in case_state.lifestyle_information:
            lifestyle_items.append(_item("Lifestyle Detail", ls, ProvenanceTag.PATIENT_REPORTED))
    else:
        lifestyle_items.append(_item("Lifestyle Information", "Not reported", ProvenanceTag.PATIENT_REPORTED))
    sections.append(StructuredClinicalSection(section_title="Lifestyle & Social History", items=lifestyle_items))

    # ---- Red Flags ----
    red_flags = case_state.red_flags or []
    emergency_active = is_emergency or bool(red_flags)

    if red_flags:
        for rf in red_flags:
            if isinstance(rf, dict):
                rf_type = rf.get("type", "UNKNOWN")
                rf_sev = rf.get("severity", "HIGH")
                rf_src = rf.get("source_text", "")
                rf_note = rf.get("clinical_note", "")
            else:
                rf_type = getattr(rf, "type", "UNKNOWN")
                rf_sev = getattr(rf, "severity", "HIGH")
                rf_src = getattr(rf, "source_text", "")
                rf_note = getattr(rf, "clinical_note", "")
            alert_value = f"[{rf_type}] {rf_src} (Severity: {rf_sev})"
            if rf_note:
                alert_value += f" — {rf_note}"
            red_flag_alerts.append(_item(f"Red Flag: {rf_type}", alert_value, ProvenanceTag.SYSTEM_DETECTED))
    elif emergency_active:
        red_flag_alerts.append(
            _item("Emergency Alert", "Priority flag triggered by clinical intake triage.", ProvenanceTag.SYSTEM_DETECTED)
        )

    # ---- Encounter Status ----
    turn_count = len(turns) if turns else 0
    status_label = "EMERGENCY_HALTED" if emergency_active else "COMPLETED"
    status_items = [
        _item("Intake Status", status_label, ProvenanceTag.SYSTEM_DETECTED),
        _item("Conversational Turns", turn_count, ProvenanceTag.SYSTEM_DETECTED),
    ]
    sections.append(StructuredClinicalSection(section_title="Encounter Status", items=status_items))

    return StructuredClinicalSummary(
        generated_at=now_str,
        patient_language=patient_language,
        summary_provider="DETERMINISTIC_FALLBACK",
        sections=sections,
        red_flag_alerts=red_flag_alerts,
        clinical_safety_notice=SAFETY_NOTICE,
        raw_case_state_hash=_hash_case_state(case_state),
    )


async def generate_structured_summary_with_ai(
    case_state: Optional[ClinicalCaseState],
    turns: Optional[List[Any]] = None,
    is_emergency: bool = False,
    patient_language: str = "en",
    llm_provider: Any = None,
) -> StructuredClinicalSummary:
    """Attempts AI-enhanced structured summary with deterministic fallback.

    Uses the LLM provider's generate_structured_summary() to organize data,
    then merges with deterministic red-flag data (always SYSTEM_DETECTED).
    Falls back to fully deterministic summary on any AI failure.
    """
    # Always build deterministic as baseline/fallback
    deterministic = generate_structured_summary_deterministic(
        case_state=case_state,
        turns=turns,
        is_emergency=is_emergency,
        patient_language=patient_language,
    )

    if not llm_provider or not case_state:
        return deterministic

    # Check if provider has the method
    if not hasattr(llm_provider, "generate_structured_summary"):
        logger.info("LLM provider does not support structured summary, using deterministic")
        return deterministic

    try:
        # Build encounter data for AI
        encounter_data: Dict[str, Any] = {}
        if hasattr(case_state, "model_dump"):
            encounter_data = case_state.model_dump(mode="json")
        else:
            encounter_data = dict(case_state)

        encounter_data["patient_language"] = patient_language
        encounter_data["is_emergency"] = is_emergency
        encounter_data["total_turns"] = len(turns) if turns else 0

        ai_result = await llm_provider.generate_structured_summary(encounter_data)

        if not ai_result or not ai_result.sections:
            logger.warning("AI returned empty structured summary, using deterministic")
            return deterministic

        # Build AI-enhanced sections with AI_STRUCTURED provenance
        now_str = datetime.utcnow().isoformat() + "Z"
        lang_label = {"en": "English (EN)", "hi": "Hindi (HI)", "mr": "Marathi (MR)"}.get(
            patient_language.lower(), patient_language.upper()
        )

        ai_sections: List[StructuredClinicalSection] = []
        for section_data in ai_result.sections:
            if isinstance(section_data, dict):
                title = section_data.get("section_title", "Untitled")
                raw_items = section_data.get("items", [])
            else:
                title = getattr(section_data, "section_title", "Untitled")
                raw_items = getattr(section_data, "items", [])

            items: List[StructuredSummaryItem] = []
            for item_data in raw_items:
                if isinstance(item_data, dict):
                    items.append(StructuredSummaryItem(
                        label=item_data.get("label", ""),
                        value=item_data.get("value", ""),
                        provenance=ProvenanceTag.AI_STRUCTURED,
                        confidence=item_data.get("confidence"),
                    ))
                else:
                    items.append(StructuredSummaryItem(
                        label=getattr(item_data, "label", ""),
                        value=getattr(item_data, "value", ""),
                        provenance=ProvenanceTag.AI_STRUCTURED,
                        confidence=getattr(item_data, "confidence", None),
                    ))

            ai_sections.append(StructuredClinicalSection(section_title=title, items=items))

        # Always use deterministic red flags (SYSTEM_DETECTED is authoritative)
        red_flag_alerts = deterministic.red_flag_alerts

        # Add encounter status from deterministic
        status_section = None
        for sec in deterministic.sections:
            if sec.section_title == "Encounter Status":
                status_section = sec
                break
        if status_section:
            ai_sections.append(status_section)

        return StructuredClinicalSummary(
            generated_at=now_str,
            patient_language=patient_language,
            summary_provider="GEMINI_STRUCTURED",
            sections=ai_sections,
            red_flag_alerts=red_flag_alerts,
            clinical_safety_notice=SAFETY_NOTICE,
            raw_case_state_hash=_hash_case_state(case_state),
        )

    except Exception as err:
        logger.warning("AI structured summary generation failed, falling back to deterministic: %s", err)
        return deterministic
