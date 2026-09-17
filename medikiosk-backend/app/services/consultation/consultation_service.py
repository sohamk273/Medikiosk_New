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


async def get_consultation_by_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID | str,
) -> Optional[ConsultationRecord]:
    """Retrieves consultation record associated with an encounter."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        return None

    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def save_consultation_draft(
    db: AsyncSession,
    encounter_id: uuid.UUID | str,
    doctor_id: uuid.UUID,
    data_in: ConsultationCreate,
) -> ConsultationRecord:
    """Creates or updates a draft consultation for an active clinical encounter."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    if encounter.status in (EncounterStatus.COMPLETED, EncounterStatus.CLOSED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot edit consultation for closed/completed encounter '{encounter_id}'",
        )

    now = datetime.now(timezone.utc)

    # 1. Fetch or initialize consultation record
    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    consultation = result.scalar_one_or_none()

    if consultation:
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

    # 2. Advance encounter lifecycle to IN_CONSULTATION if WAITING
    if encounter.status == EncounterStatus.WAITING:
        encounter.status = EncounterStatus.IN_CONSULTATION
    if not encounter.started_at:
        encounter.started_at = now

    # 3. Advance active linked QueueEntry if WAITING
    qe_query = select(QueueEntry).where(
        QueueEntry.encounter_id == encounter.id,
        QueueEntry.queue_status == QueueStatus.WAITING,
    )
    qe_res = await db.execute(qe_query)
    for qe in qe_res.scalars().all():
        qe.queue_status = QueueStatus.CALLED
        if not qe.called_at:
            qe.called_at = now

    await db.commit()
    await db.refresh(consultation)

    # Preload doctor for response mapping
    doc_res = await db.execute(select(User).where(User.id == consultation.doctor_id))
    consultation.doctor = doc_res.scalar_one_or_none()

    return consultation


async def finalize_consultation(
    db: AsyncSession,
    encounter_id: uuid.UUID | str,
    doctor_id: uuid.UUID,
    data_in: ConsultationCreate,
) -> ConsultationRecord:
    """Persists clinical notes, marks consultation FINALIZED, and completes encounter & queue."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    if encounter.status in (EncounterStatus.COMPLETED, EncounterStatus.CLOSED):
        # If already completed, check if consultation exists
        existing = await get_consultation_by_encounter(db, encounter_id)
        if existing and existing.status == ConsultationStatus.FINALIZED:
            return existing

    now = datetime.now(timezone.utc)

    # 1. Fetch or initialize consultation record
    query = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    result = await db.execute(query)
    consultation = result.scalar_one_or_none()

    if consultation:
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

    # 2. Transactionally complete encounter
    encounter.status = EncounterStatus.COMPLETED
    encounter.completed_at = now

    # 3. Transactionally complete all active linked queue entries
    qe_query = select(QueueEntry).where(
        QueueEntry.encounter_id == encounter.id,
        QueueEntry.queue_status.in_([QueueStatus.WAITING, QueueStatus.CALLED]),
    )
    qe_res = await db.execute(qe_query)
    for qe in qe_res.scalars().all():
        qe.queue_status = QueueStatus.COMPLETED
        qe.completed_at = now

    await db.commit()
    await db.refresh(consultation)

    # Preload doctor for response mapping
    doc_res = await db.execute(select(User).where(User.id == consultation.doctor_id))
    consultation.doctor = doc_res.scalar_one_or_none()

    return consultation
