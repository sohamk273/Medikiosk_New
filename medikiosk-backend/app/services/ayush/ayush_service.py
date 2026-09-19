"""Service for calculating Prakriti scores and managing AYUSH assessments."""
import logging
import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ayush import AYUSHAssessmentRecord
from app.models.encounter import Encounter
from app.schemas.ayush import AYUSHIntakeCreate, AYUSHDoctorAssessmentUpdate
from app.services.audit.audit_service import log_audit_event

logger = logging.getLogger("ayush_service")


def compute_prakriti_profile(responses: List[Dict[str, Any]]) -> tuple[Dict[str, int], str]:
    """Deterministically calculates Vata/Pitta/Kapha score distributions and dominant Prakriti."""
    scores = {"vata": 0, "pitta": 0, "kapha": 0}

    for item in responses:
        selected = str(item.get("selected_option", "")).lower()
        ans = str(item.get("answer", "")).lower()
        text = f"{selected} {ans}"

        if any(w in text for w in ["vata", "dry", "thin", "fast", "restless", "irregular", "cold"]):
            scores["vata"] += 1
        if any(w in text for w in ["pitta", "sharp", "medium", "hot", "angry", "sweat", "intense"]):
            scores["pitta"] += 1
        if any(w in text for w in ["kapha", "heavy", "stout", "slow", "calm", "oily", "steady"]):
            scores["kapha"] += 1

    v, p, k = scores["vata"], scores["pitta"], scores["kapha"]
    total = v + p + k

    if total == 0:
        return scores, "Tridoshaja"

    # Determine dominant dosha
    sorted_doshas = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_dosha, top_score = sorted_doshas[0]
    second_dosha, second_score = sorted_doshas[1]

    if top_score == second_score:
        dominant = f"{top_dosha.capitalize()}-{second_dosha.capitalize()}"
    elif (top_score - second_score) <= 1 and second_score > 0:
        dominant = f"{top_dosha.capitalize()}-{second_dosha.capitalize()}"
    else:
        dominant = top_dosha.capitalize()

    return scores, dominant


async def save_ayush_intake(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    data: AYUSHIntakeCreate,
) -> AYUSHAssessmentRecord:
    """Saves or updates patient-submitted AYUSH questionnaire responses and Prakriti profile."""
    # Find linked encounter
    enc_stmt = select(Encounter).where(Encounter.id == encounter_id)
    enc_res = await db.execute(enc_stmt)
    encounter = enc_res.scalars().first()
    if not encounter:
        raise ValueError(f"Encounter '{encounter_id}' not found.")

    # Calculate or use provided scores
    if data.prakriti_scores and data.dominant_prakriti:
        scores = data.prakriti_scores
        dominant = data.dominant_prakriti
    else:
        scores, dominant = compute_prakriti_profile(data.patient_responses)

    # Check for existing record
    stmt = select(AYUSHAssessmentRecord).where(AYUSHAssessmentRecord.encounter_id == encounter_id)
    res = await db.execute(stmt)
    existing = res.scalars().first()

    if existing:
        existing.prakriti_scores = scores
        existing.dominant_prakriti = dominant
        existing.patient_responses = data.patient_responses
        existing.status = "COMPLETED"
        record = existing
    else:
        record = AYUSHAssessmentRecord(
            id=uuid.uuid4(),
            encounter_id=encounter_id,
            patient_id=encounter.patient_id,
            prakriti_scores=scores,
            dominant_prakriti=dominant,
            patient_responses=data.patient_responses,
            status="COMPLETED",
        )
        db.add(record)

    await db.flush()

    # Log audit event
    await log_audit_event(
        db=db,
        action="AYUSH_ASSESSMENT_RECORDED",
        entity_type="AYUSH_ASSESSMENT",
        entity_id=str(record.id),
        encounter_id=encounter_id,
        patient_id=encounter.patient_id,
        details={"dominant_prakriti": dominant, "scores": scores},
    )

    await db.commit()
    await db.refresh(record)
    return record


async def get_ayush_assessment(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> Optional[AYUSHAssessmentRecord]:
    """Retrieves AYUSH assessment by encounter_id."""
    stmt = select(AYUSHAssessmentRecord).where(AYUSHAssessmentRecord.encounter_id == encounter_id)
    res = await db.execute(stmt)
    return res.scalars().first()


async def update_doctor_ayush_assessment(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    doctor_data: AYUSHDoctorAssessmentUpdate,
    doctor_id: Optional[uuid.UUID] = None,
) -> AYUSHAssessmentRecord:
    """Doctor modifies or saves Ayurvedic clinical findings."""
    record = await get_ayush_assessment(db, encounter_id)
    if not record:
        # Create empty record if patient skipped kiosk assessment
        enc_stmt = select(Encounter).where(Encounter.id == encounter_id)
        enc_res = await db.execute(enc_stmt)
        encounter = enc_res.scalars().first()
        if not encounter:
            raise ValueError(f"Encounter '{encounter_id}' not found.")

        record = AYUSHAssessmentRecord(
            id=uuid.uuid4(),
            encounter_id=encounter_id,
            patient_id=encounter.patient_id,
            prakriti_scores={"vata": 0, "pitta": 0, "kapha": 0},
            dominant_prakriti=doctor_data.prakriti or "Tridoshaja",
            patient_responses=[],
            doctor_assessment=doctor_data.model_dump(exclude_none=True),
            status="COMPLETED",
        )
        db.add(record)
    else:
        existing_doc_assess = record.doctor_assessment or {}
        new_data = doctor_data.model_dump(exclude_none=True)
        existing_doc_assess.update(new_data)
        record.doctor_assessment = existing_doc_assess
        if doctor_data.prakriti:
            record.dominant_prakriti = doctor_data.prakriti

    await db.flush()

    # Log audit event
    await log_audit_event(
        db=db,
        action="DOCTOR_AYUSH_ASSESSMENT_UPDATED",
        entity_type="AYUSH_ASSESSMENT",
        entity_id=str(record.id),
        encounter_id=encounter_id,
        patient_id=record.patient_id,
        user_id=doctor_id,
        details=doctor_data.model_dump(exclude_none=True),
    )

    await db.commit()
    await db.refresh(record)
    return record
