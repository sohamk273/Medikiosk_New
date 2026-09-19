"""Consultation domain service managing physician clinical documentation and lifecycle transitions."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.consultation import ConsultationRecord, ConsultationStatus
from app.models.encounter import Encounter, EncounterStatus
from app.models.queue import QueueEntry, QueueStatus
from app.models.user import User
from app.schemas.consultation import ConsultationCreate, ConsultationRead
from app.services.encounter.encounter_service import get_encounter_by_identifier
from app.services.audit.audit_service import log_audit_event


async def get_consultation_by_encounter(
    db: AsyncSession,
    encounter_id: str | uuid.UUID,
) -> Optional[ConsultationRecord]:
    """Retrieves consultation record for a given encounter ID or number."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def save_consultation_draft(
    db: AsyncSession,
    encounter_id: str | uuid.UUID,
    doctor_id: uuid.UUID,
    data_in: ConsultationCreate,
) -> ConsultationRecord:
    """Creates or updates a consultation draft for the given encounter."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    if encounter.status == EncounterStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot modify consultation for a closed encounter",
        )

    # Check for existing consultation
    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    consultation = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if consultation:
        if consultation.status == ConsultationStatus.FINALIZED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Consultation has already been finalized and cannot be edited as draft",
            )
        # Update existing draft
        consultation.doctor_id = doctor_id
        consultation.findings = data_in.findings
        consultation.assessment = data_in.assessment
        consultation.diagnosis = data_in.diagnosis
        consultation.notes = data_in.notes
        consultation.prescription = data_in.prescription
        consultation.follow_up = data_in.follow_up
        consultation.ayush_assessment = data_in.ayush_assessment
        consultation.updated_at = now
    else:
        # Create new draft
        consultation = ConsultationRecord(
            encounter_id=encounter.id,
            doctor_id=doctor_id,
            status=ConsultationStatus.DRAFT,
            findings=data_in.findings,
            assessment=data_in.assessment,
            diagnosis=data_in.diagnosis,
            notes=data_in.notes,
            prescription=data_in.prescription,
            follow_up=data_in.follow_up,
            ayush_assessment=data_in.ayush_assessment,
            created_at=now,
            updated_at=now,
        )
        db.add(consultation)

    # Transition encounter to IN_CONSULTATION if it was WAITING
    if encounter.status == EncounterStatus.WAITING:
        encounter.status = EncounterStatus.IN_CONSULTATION
        if not encounter.started_at:
            encounter.started_at = now

    await db.flush()

    await log_audit_event(
        db=db,
        action="CONSULTATION_DRAFT_SAVED",
        entity_type="CONSULTATION",
        entity_id=str(consultation.id),
        encounter_id=encounter.id,
        patient_id=encounter.patient_id,
        user_id=doctor_id,
        details={"diagnosis": data_in.diagnosis, "has_prescription": bool(data_in.prescription)},
    )

    await db.commit()
    await db.refresh(consultation)

    # Re-query with doctor relationship loaded
    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.id == consultation.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    return result.scalar_one()


async def finalize_consultation(
    db: AsyncSession,
    encounter_id: str | uuid.UUID,
    doctor_id: uuid.UUID,
    data_in: ConsultationCreate,
) -> ConsultationRecord:
    """Finalizes a consultation, making it permanent, and completes the encounter & queue entry."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    # Check for existing consultation
    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    consultation = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if consultation:
        if consultation.status == ConsultationStatus.FINALIZED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Consultation has already been finalized",
            )
        consultation.doctor_id = doctor_id
        consultation.findings = data_in.findings
        consultation.assessment = data_in.assessment
        consultation.diagnosis = data_in.diagnosis
        consultation.notes = data_in.notes
        consultation.prescription = data_in.prescription
        consultation.follow_up = data_in.follow_up
        consultation.ayush_assessment = data_in.ayush_assessment
        consultation.status = ConsultationStatus.FINALIZED
        consultation.finalized_at = now
        consultation.updated_at = now
    else:
        consultation = ConsultationRecord(
            encounter_id=encounter.id,
            doctor_id=doctor_id,
            status=ConsultationStatus.FINALIZED,
            findings=data_in.findings,
            assessment=data_in.assessment,
            diagnosis=data_in.diagnosis,
            notes=data_in.notes,
            prescription=data_in.prescription,
            follow_up=data_in.follow_up,
            ayush_assessment=data_in.ayush_assessment,
            created_at=now,
            updated_at=now,
            finalized_at=now,
        )
        db.add(consultation)

    # Complete the encounter
    encounter.status = EncounterStatus.COMPLETED
    encounter.completed_at = now

    # Complete linked queue entries
    qe_query = select(QueueEntry).where(
        QueueEntry.encounter_id == encounter.id,
        QueueEntry.queue_status.in_([QueueStatus.WAITING, QueueStatus.CALLED]),
    )
    qe_res = await db.execute(qe_query)
    for qe in qe_res.scalars().all():
        qe.queue_status = QueueStatus.COMPLETED
        qe.completed_at = now

    await db.flush()

    await log_audit_event(
        db=db,
        action="CONSULTATION_FINALIZED",
        entity_type="CONSULTATION",
        entity_id=str(consultation.id),
        encounter_id=encounter.id,
        patient_id=encounter.patient_id,
        user_id=doctor_id,
        details={"diagnosis": data_in.diagnosis, "finalized_at": now.isoformat()},
    )

    await db.commit()
    await db.refresh(consultation)

    # Re-query with doctor relationship loaded
    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.id == consultation.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    return result.scalar_one()
