"""Clinical persistence service for managing persistent clinical cases and turns."""
import logging
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.clinical_case import ClinicalCaseRecord, ClinicalTurnRecord
from app.models.encounter import Encounter, EncounterPriority
from app.schemas.clinical import ClinicalFinalizeRequest, ClinicalCaseState
from app.services.clinical.summary_generator import generate_clinical_summary
from app.services.clinical.structured_summary_generator import (
    generate_structured_summary_deterministic,
    generate_structured_summary_with_ai,
)
from app.services.audit.audit_service import log_audit_event
from app.services.clinical.clinical_engine import default_clinical_engine

logger = logging.getLogger("clinical_service")


async def finalize_clinical_case(
    db: AsyncSession,
    request: ClinicalFinalizeRequest,
) -> ClinicalCaseRecord:
    """Finalize a clinical intake case, persist state, turns, and generate doctor summary."""
    case_state = request.case_state or ClinicalCaseState()
    turns_data = request.conversation_history or []
    
    # Check if a clinical case already exists for this encounter
    existing_case: Optional[ClinicalCaseRecord] = None
    if request.encounter_id:
        stmt = (
            select(ClinicalCaseRecord)
            .where(ClinicalCaseRecord.encounter_id == request.encounter_id)
            .options(selectinload(ClinicalCaseRecord.turns))
        )
        res = await db.execute(stmt)
        existing_case = res.scalars().first()

    # Determine emergency status and completion status
    is_emergency = request.is_emergency or bool(case_state.red_flags)
    completion_status = "EMERGENCY_HALTED" if is_emergency else "COMPLETED"
    
    # Generate doctor-facing clinical summary (plain text — backward compat)
    summary_text = generate_clinical_summary(
        case_state=case_state,
        turns=turns_data,
        is_emergency=is_emergency,
        patient_language=request.language,
    )

    # Stage 9: Generate structured clinical summary with provenance tags
    try:
        llm_provider = getattr(default_clinical_engine, "llm_provider", None)
        structured_result = await generate_structured_summary_with_ai(
            case_state=case_state,
            turns=turns_data,
            is_emergency=is_emergency,
            patient_language=request.language,
            llm_provider=llm_provider,
        )
        structured_summary_dict = (
            structured_result.model_dump(mode="json")
            if hasattr(structured_result, "model_dump")
            else None
        )
    except Exception as structured_err:
        logger.warning("Structured summary generation failed: %s", structured_err)
        structured_summary_dict = None

    # Convert red flags to serializable list of dicts
    serializable_red_flags: List[Dict[str, Any]] = []
    for rf in case_state.red_flags:
        if isinstance(rf, dict):
            serializable_red_flags.append(rf)
        elif hasattr(rf, "model_dump"):
            serializable_red_flags.append(rf.model_dump(mode="json"))
        else:
            serializable_red_flags.append(dict(rf))

    # Convert case_state to serializable dict
    serializable_case_state = (
        case_state.model_dump(mode="json")
        if hasattr(case_state, "model_dump")
        else dict(case_state)
    )

    now = datetime.utcnow()

    if existing_case:
        # Update existing record
        existing_case.status = "FINALIZED"
        existing_case.patient_language = request.language
        existing_case.chief_complaint = case_state.chief_complaint
        existing_case.case_state = serializable_case_state
        existing_case.final_summary = summary_text
        existing_case.structured_summary = structured_summary_dict
        existing_case.red_flags = serializable_red_flags
        existing_case.is_emergency = is_emergency
        existing_case.completion_status = completion_status
        existing_case.finalized_at = now
        existing_case.updated_at = now

        # Delete old turns and recreate new ones
        if turns_data:
            await db.execute(
                delete(ClinicalTurnRecord).where(
                    ClinicalTurnRecord.clinical_case_id == existing_case.id
                )
            )
            for idx, turn in enumerate(turns_data, 1):
                turn_record = ClinicalTurnRecord(
                    id=uuid.uuid4(),
                    clinical_case_id=existing_case.id,
                    turn_number=turn.get("turn_number", idx),
                    question=turn.get("question", ""),
                    question_type=turn.get("question_type", "GENERAL"),
                    patient_transcript=turn.get("patient_transcript") or turn.get("transcript", ""),
                    language=turn.get("language", request.language),
                    extracted_entities=turn.get("extracted_entities", {}),
                    created_at=now,
                )
                db.add(turn_record)
        
        target_id = existing_case.id
    else:
        # Create new clinical case record
        case_id = uuid.uuid4()
        case_record = ClinicalCaseRecord(
            id=case_id,
            encounter_id=request.encounter_id,
            patient_id=request.patient_id,
            status="FINALIZED",
            patient_language=request.language,
            chief_complaint=case_state.chief_complaint,
            case_state=serializable_case_state,
            final_summary=summary_text,
            structured_summary=structured_summary_dict,
            red_flags=serializable_red_flags,
            is_emergency=is_emergency,
            completion_status=completion_status,
            intake_started_at=now,
            finalized_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(case_record)
        await db.flush()

        # Persist conversation turns
        for idx, turn in enumerate(turns_data, 1):
            turn_record = ClinicalTurnRecord(
                id=uuid.uuid4(),
                clinical_case_id=case_record.id,
                turn_number=turn.get("turn_number", idx),
                question=turn.get("question", ""),
                question_type=turn.get("question_type", "GENERAL"),
                patient_transcript=turn.get("patient_transcript") or turn.get("transcript", ""),
                language=turn.get("language", request.language),
                extracted_entities=turn.get("extracted_entities", {}),
                created_at=now,
            )
            db.add(turn_record)

        target_id = case_record.id

    # If linked to core Encounter, update chief_complaint & red flag alert
    if request.encounter_id:
        enc_stmt = select(Encounter).where(Encounter.id == request.encounter_id)
        enc_res = await db.execute(enc_stmt)
        encounter = enc_res.scalars().first()
        if encounter:
            if case_state.chief_complaint and not encounter.chief_complaint:
                encounter.chief_complaint = case_state.chief_complaint
            if is_emergency:
                encounter.red_flag_triggered = True
                encounter.priority = EncounterPriority.EMERGENCY

    # Log audit event
    await log_audit_event(
        db=db,
        action="CLINICAL_INTAKE_SUBMITTED",
        entity_type="CLINICAL_CASE",
        entity_id=str(target_id),
        encounter_id=request.encounter_id,
        patient_id=request.patient_id,
        details={
            "chief_complaint": case_state.chief_complaint,
            "turns_count": len(turns_data),
            "is_emergency": is_emergency,
        },
    )

    await db.commit()
    
    # Reload freshly with selectinload
    db.expire_all()
    reload_stmt = (
        select(ClinicalCaseRecord)
        .where(ClinicalCaseRecord.id == target_id)
        .options(selectinload(ClinicalCaseRecord.turns))
    )
    reload_res = await db.execute(reload_stmt)
    return reload_res.scalars().first()


async def get_clinical_case_by_identifier(
    db: AsyncSession,
    identifier: str,
) -> Optional[ClinicalCaseRecord]:
    """Retrieve a clinical case by either clinical_case_id or encounter_id."""
    try:
        val_uuid = uuid.UUID(identifier)
    except ValueError:
        return None

    stmt = (
        select(ClinicalCaseRecord)
        .where(
            (ClinicalCaseRecord.id == val_uuid) | (ClinicalCaseRecord.encounter_id == val_uuid)
        )
        .options(selectinload(ClinicalCaseRecord.turns))
    )
    res = await db.execute(stmt)
    return res.scalars().first()
