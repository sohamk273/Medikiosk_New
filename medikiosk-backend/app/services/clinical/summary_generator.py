"""Deterministic Doctor-Facing Clinical Summary Generator for Stage 6.

Strict clinical safety rules:
1. Purely objective representation of patient-reported data.
2. Explicit 'Not reported' / 'Not captured' for absent data.
3. Absolutely NO clinical diagnosis or medical prescription generation.
4. Prominent display of emergency/red-flag alerts.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.schemas.clinical import ClinicalCaseState, RedFlagEntity


def generate_clinical_summary(
    case_state: Optional[ClinicalCaseState],
    turns: Optional[List[Any]] = None,
    is_emergency: bool = False,
    patient_language: str = "en",
) -> str:
    """Generate a clean, structured doctor-facing clinical handoff summary."""
    lines: List[str] = []
    
    # 1. Header & Metadata
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    lang_label = {"en": "English (EN)", "hi": "Hindi (HI)", "mr": "Marathi (MR)"}.get(
        patient_language.lower(), patient_language.upper()
    )
    
    lines.append("=" * 60)
    lines.append("PATIENT CLINICAL INTAKE SUMMARY (DOCTOR HANDOFF)")
    lines.append(f"Generated: {now_str} | Intake Language: {lang_label}")
    lines.append("=" * 60)
    lines.append("")
    
    # Check red flags
    red_flags: List[Any] = []
    if case_state and case_state.red_flags:
        red_flags = case_state.red_flags
    emergency_active = is_emergency or bool(red_flags)
    
    # 2. Prominent Emergency Alert Banner
    if emergency_active:
        lines.append("⚠️ EMERGENCY / PRIORITY ALERT")
        lines.append("-" * 40)
        lines.append("URGENT: Critical symptoms or red flags detected during intake.")
        if red_flags:
            lines.append("Detected Flags:")
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
                note_str = f" ({rf_note})" if rf_note else ""
                lines.append(f"  • [{rf_type}] Severity: {rf_sev} | Source: \"{rf_src}\"{note_str}")
        else:
            lines.append("  • Priority flag triggered by clinical intake triage.")
        lines.append("-" * 40)
        lines.append("")

    if not case_state:
        lines.append("Chief Complaint: Not reported")
        lines.append("History of Presenting Complaint: Not captured")
        lines.append("Associated Symptoms: None reported")
        lines.append("Medications: Not reported")
        lines.append("Allergies: Not reported")
        lines.append("Medical History: Not reported")
        lines.append("Surgical History: Not reported")
        lines.append("Family History: Not reported")
        lines.append("Lifestyle Information: Not reported")
        lines.append("")
        lines.append("RED FLAGS:")
        lines.append("  • " + ("Alert triggered" if emergency_active else "None detected"))
        lines.append("")
        lines.append("ENCOUNTER STATUS:")
        lines.append(f"  • Status: {'EMERGENCY_HALTED' if emergency_active else 'INCOMPLETE'}")
        lines.append("=" * 60)
        return "\n".join(lines)

    # 3. Chief Complaint
    lines.append("PATIENT PRESENTATION")
    lines.append("-" * 30)
    cc = case_state.chief_complaint or "Not reported"
    lines.append("Chief Complaint:")
    lines.append(f"  {cc}")
    lines.append("")

    # 4. History of Presenting Complaint (HPI)
    lines.append("History of Presenting Complaint (HPI):")
    if case_state.symptoms:
        for idx, sym in enumerate(case_state.symptoms, 1):
            s_name = getattr(sym, "name", str(sym))
            s_loc = getattr(sym, "location", None) or "Not reported"
            s_dur = getattr(sym, "duration", None) or "Not reported"
            s_sev = getattr(sym, "severity", None) or "Not reported"
            s_char = getattr(sym, "character", None) or "Not reported"
            s_agg = getattr(sym, "aggravating_factors", [])
            s_rel = getattr(sym, "relieving_factors", [])
            
            lines.append(f"  {idx}. Symptom: {s_name}")
            lines.append(f"     - Location: {s_loc}")
            lines.append(f"     - Duration: {s_dur}")
            lines.append(f"     - Severity: {s_sev}")
            lines.append(f"     - Character: {s_char}")
            lines.append(f"     - Aggravating Factors: {', '.join(s_agg) if s_agg else 'Not reported'}")
            lines.append(f"     - Relieving Factors: {', '.join(s_rel) if s_rel else 'Not reported'}")
    else:
        lines.append("  - Specific symptom details: Not reported")
    lines.append("")

    # 5. Associated Symptoms & Fever
    lines.append("Associated Symptoms:")
    if case_state.associated_symptoms:
        for s in case_state.associated_symptoms:
            lines.append(f"  • {s}")
    else:
        lines.append("  • None reported")
    
    if case_state.fever is not None:
        lines.append(f"  • Fever: {'Present' if case_state.fever else 'Absent / Not reported'}")
    lines.append("")

    # 6. Current Medications
    lines.append("Current Medications:")
    if case_state.medications:
        for med in case_state.medications:
            lines.append(f"  • {med}")
    else:
        lines.append("  • Not reported / None captured")
    lines.append("")

    # 7. Allergies
    lines.append("Allergies:")
    if case_state.allergies:
        for alg in case_state.allergies:
            lines.append(f"  • {alg}")
    else:
        lines.append("  • No known allergies reported")
    lines.append("")

    # 8. Past Medical History
    lines.append("Past Medical History:")
    if case_state.medical_history:
        for mh in case_state.medical_history:
            lines.append(f"  • {mh}")
    else:
        lines.append("  • Not reported")
    lines.append("")

    # 9. Surgical History
    lines.append("Surgical History:")
    if case_state.surgical_history:
        for sh in case_state.surgical_history:
            lines.append(f"  • {sh}")
    else:
        lines.append("  • Not reported")
    lines.append("")

    # 10. Family History
    lines.append("Family History:")
    if case_state.family_history:
        for fh in case_state.family_history:
            lines.append(f"  • {fh}")
    else:
        lines.append("  • Not reported")
    lines.append("")

    # 11. Lifestyle Information
    lines.append("Lifestyle & Social History:")
    if case_state.lifestyle_information:
        for ls in case_state.lifestyle_information:
            lines.append(f"  • {ls}")
    else:
        lines.append("  • Not reported")
    lines.append("")

    # 12. Red Flags Section
    lines.append("RED FLAGS:")
    if red_flags:
        for rf in red_flags:
            if isinstance(rf, dict):
                rf_type = rf.get("type", "UNKNOWN")
                rf_sev = rf.get("severity", "HIGH")
                rf_src = rf.get("source_text", "")
            else:
                rf_type = getattr(rf, "type", "UNKNOWN")
                rf_sev = getattr(rf, "severity", "HIGH")
                rf_src = getattr(rf, "source_text", "")
            lines.append(f"  • [{rf_type}] {rf_src} (Severity: {rf_sev})")
    else:
        lines.append("  • None detected")
    lines.append("")

    # 13. Encounter Status & Completion
    turn_count = len(turns) if turns else 0
    status_label = "EMERGENCY_HALTED" if emergency_active else "COMPLETED"
    lines.append("ENCOUNTER STATUS:")
    lines.append(f"  • Intake Status: {status_label}")
    lines.append(f"  • Conversational Turns Completed: {turn_count}")
    lines.append("")
    lines.append("SAFETY NOTICE: This summary is compiled from patient-reported intake data at kiosk.")
    lines.append("No medical diagnosis is provided. Clinical assessment and diagnosis are reserved for the attending physician.")
    lines.append("=" * 60)

    return "\n".join(lines)
