"""Queue service managing daily atomic token sequence and OPD queue transitions."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.hospital_settings import HospitalSettings
from app.models.patient import Patient
from app.models.queue import QueueEntry, QueueStatus
from app.schemas.encounter import EncounterSubmitResponse
from app.schemas.queue import QueueItemResponse, QueueCallResponse
from app.services.consent.consent_service import get_active_consent_for_encounter


async def ensure_hospital_settings(db: AsyncSession) -> HospitalSettings:
    """Ensures hospital_settings row 1 exists for row locking."""
    query = select(HospitalSettings).where(HospitalSettings.id == 1)
    result = await db.execute(query)
    settings_obj = result.scalar_one_or_none()
    if not settings_obj:
        settings_obj = HospitalSettings(id=1, hospital_name="MediKiosk District Hospital")
        db.add(settings_obj)
        await db.flush()
    return settings_obj


async def allocate_daily_token(db: AsyncSession) -> int:
    """Atomically allocates the next sequential daily token using row locking.
    
    Locks hospital_settings row 1 within the current transaction to prevent
    race conditions between concurrent kiosks.
    """
    # 1. Acquire row lock on settings row 1 (PostgreSQL row locking)
    lock_query = select(HospitalSettings).where(HospitalSettings.id == 1)
    bind = db.get_bind()
    if bind and bind.dialect.name == "postgresql":
        lock_query = lock_query.with_for_update()

    result = await db.execute(lock_query)
    locked_row = result.scalar_one_or_none()
    if not locked_row:
        await ensure_hospital_settings(db)
        result = await db.execute(lock_query)
        locked_row = result.scalar_one_or_none()

    # 2. Find max token number for today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    max_token_query = select(func.coalesce(func.max(QueueEntry.token_number), 0)).where(
        QueueEntry.queued_at >= today_start
    )
    max_res = await db.execute(max_token_query)
    current_max = max_res.scalar_one()

    return current_max + 1


async def submit_encounter_to_queue(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> EncounterSubmitResponse:
    """Transactionally submits an encounter to the doctor OPD queue."""
    # 1. Fetch encounter with patient
    query = (
        select(Encounter)
        .where(Encounter.id == encounter_id)
        .options(selectinload(Encounter.patient), selectinload(Encounter.queue_entries))
    )
    result = await db.execute(query)
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    patient = encounter.patient
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Encounter is not associated with a valid patient",
        )

    # 2. Validate authoritative consent
    active_consent = await get_active_consent_for_encounter(db, encounter_id)
    if not active_consent or not active_consent.granted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient consent has not been recorded for this encounter. Cannot submit to OPD queue.",
        )

    # 3. Check for existing active queue entry (idempotency)
    for qe in encounter.queue_entries:
        if qe.queue_status in (QueueStatus.WAITING, QueueStatus.CALLED):
            return EncounterSubmitResponse(
                success=True,
                patient_id=patient.id,
                uhid=patient.patient_uhid,
                encounter_id=encounter.id,
                encounter_number=encounter.encounter_number,
                queue_entry_id=qe.id,
                token_number=qe.token_number,
                queue_status=qe.queue_status,
                submitted_at=qe.queued_at,
            )

    # 4. Atomically allocate token
    token_num = await allocate_daily_token(db)

    # 5. Create queue entry
    now = datetime.now(timezone.utc)
    queue_entry = QueueEntry(
        encounter_id=encounter.id,
        token_number=token_num,
        queue_status=QueueStatus.WAITING,
        priority=encounter.priority,
        queued_at=now,
    )
    db.add(queue_entry)

    # 6. Update encounter status
    encounter.status = EncounterStatus.WAITING

    await db.commit()
    await db.refresh(queue_entry)

    return EncounterSubmitResponse(
        success=True,
        patient_id=patient.id,
        uhid=patient.patient_uhid,
        encounter_id=encounter.id,
        encounter_number=encounter.encounter_number,
        queue_entry_id=queue_entry.id,
        token_number=queue_entry.token_number,
        queue_status=queue_entry.queue_status,
        submitted_at=queue_entry.queued_at,
    )


async def get_today_queue(
    db: AsyncSession,
) -> List[QueueItemResponse]:
    """Retrieves today's OPD queue ordered by emergency priority and FIFO queued_at."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    priority_order = case(
        (QueueEntry.priority == EncounterPriority.EMERGENCY, 0),
        else_=1,
    )

    query = (
        select(QueueEntry, Encounter, Patient)
        .join(Encounter, QueueEntry.encounter_id == Encounter.id)
        .join(Patient, Encounter.patient_id == Patient.id)
        .where(QueueEntry.queued_at >= today_start)
        .order_by(
            priority_order,
            QueueEntry.queued_at.asc(),
        )
    )
    result = await db.execute(query)
    rows = result.all()

    items: List[QueueItemResponse] = []
    for qe, enc, pat in rows:
        # Resolve phone if available
        mobile_val = None
        for ident in pat.identities:
            if ident.identity_type.value in ("MOBILE", "PHONE"):
                mobile_val = ident.identity_value
                break

        items.append(
            QueueItemResponse(
                queue_entry_id=qe.id,
                encounter_id=enc.id,
                patient_id=pat.id,
                token_number=qe.token_number,
                encounter_number=enc.encounter_number,
                patient_name=pat.full_name,
                age=pat.age,
                gender=pat.gender,
                mobile=mobile_val,
                priority=qe.priority,
                queue_status=qe.queue_status,
                chief_complaint=enc.chief_complaint,
                red_flag_triggered=enc.red_flag_triggered,
                queued_at=qe.queued_at,
                called_at=qe.called_at,
                completed_at=qe.completed_at,
            )
        )

    return items


async def call_queue_entry(
    db: AsyncSession,
    queue_entry_id: uuid.UUID,
) -> QueueCallResponse:
    """Doctor action: Calls patient into consultation room, updating queue and encounter."""
    query = (
        select(QueueEntry)
        .where((QueueEntry.id == queue_entry_id) | (QueueEntry.encounter_id == queue_entry_id))
        .options(selectinload(QueueEntry.encounter))
    )
    result = await db.execute(query)
    queue_entry = result.scalar_one_or_none()

    if not queue_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Queue entry '{queue_entry_id}' not found",
        )

    now = datetime.now(timezone.utc)
    queue_entry.queue_status = QueueStatus.CALLED
    queue_entry.called_at = now

    encounter = queue_entry.encounter
    if encounter:
        encounter.status = EncounterStatus.IN_CONSULTATION
        encounter.started_at = now

    await db.commit()
    await db.refresh(queue_entry)

    return QueueCallResponse(
        queue_entry_id=queue_entry.id,
        encounter_id=queue_entry.encounter_id,
        queue_status=queue_entry.queue_status,
        encounter_status=encounter.status if encounter else EncounterStatus.IN_CONSULTATION,
        called_at=now,
    )


async def cancel_queue_entry(
    db: AsyncSession,
    queue_entry_id: uuid.UUID,
) -> QueueEntry:
    """Cancels an active queue entry and closes the encounter."""
    query = (
        select(QueueEntry)
        .where(QueueEntry.id == queue_entry_id)
        .options(selectinload(QueueEntry.encounter))
    )
    result = await db.execute(query)
    queue_entry = result.scalar_one_or_none()

    if not queue_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Queue entry '{queue_entry_id}' not found",
        )

    now = datetime.now(timezone.utc)
    queue_entry.queue_status = QueueStatus.CANCELLED

    encounter = queue_entry.encounter
    if encounter:
        encounter.status = EncounterStatus.CLOSED
        encounter.closed_at = now

    await db.commit()
    await db.refresh(queue_entry)
    return queue_entry
