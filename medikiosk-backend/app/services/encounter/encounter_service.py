"""Encounter domain service managing clinical visits and lifecycle transitions."""
import random
import string
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.patient import Patient
from app.models.queue import QueueEntry, QueueStatus
from app.schemas.encounter import EncounterCreate, EncounterUpdate, EncounterDetailResponse, EncounterRead, EncounterPatientSummary


def generate_encounter_number() -> str:
    """Generates a human-readable unique encounter code."""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ENC-{date_part}-{rand_part}"


async def get_encounter_by_id(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> Optional[Encounter]:
    """Retrieves an encounter by UUID with patient preloaded."""
    query = (
        select(Encounter)
        .where(Encounter.id == encounter_id)
        .options(
            selectinload(Encounter.patient).selectinload(Patient.identities),
            selectinload(Encounter.queue_entries),
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_encounter_by_identifier(
    db: AsyncSession,
    identifier: uuid.UUID | str,
) -> Optional[Encounter]:
    """Retrieves an encounter by either UUID or human-readable encounter_number."""
    parsed_uuid = None
    if isinstance(identifier, uuid.UUID):
        parsed_uuid = identifier
    else:
        try:
            parsed_uuid = uuid.UUID(str(identifier))
        except (ValueError, AttributeError):
            parsed_uuid = None

    if parsed_uuid:
        condition = Encounter.id == parsed_uuid
    else:
        condition = Encounter.encounter_number == str(identifier)

    query = (
        select(Encounter)
        .where(condition)
        .options(
            selectinload(Encounter.patient).selectinload(Patient.identities),
            selectinload(Encounter.queue_entries),
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_encounter(
    db: AsyncSession,
    encounter_in: EncounterCreate,
) -> Encounter:
    """Creates a new clinical visit record for an existing patient."""
    # Verify patient exists
    pat_query = select(Patient).where(Patient.id == encounter_in.patient_id)
    pat_res = await db.execute(pat_query)
    patient = pat_res.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{encounter_in.patient_id}' not found",
        )

    enc_num = generate_encounter_number()
    now = datetime.now(timezone.utc)

    encounter = Encounter(
        encounter_number=enc_num,
        patient_id=encounter_in.patient_id,
        status=EncounterStatus.WAITING,
        priority=encounter_in.priority or EncounterPriority.NORMAL,
        registered_at=now,
    )
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)
    return encounter


async def update_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    update_in: EncounterUpdate,
) -> Encounter:
    """Updates registration-level encounter fields like chief complaint or priority."""
    encounter = await get_encounter_by_id(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    if update_in.chief_complaint is not None:
        encounter.chief_complaint = update_in.chief_complaint.strip()
    if update_in.priority is not None:
        encounter.priority = update_in.priority
    if update_in.red_flag_triggered is not None:
        encounter.red_flag_triggered = update_in.red_flag_triggered

    await db.commit()
    await db.refresh(encounter)
    return encounter


async def complete_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> Encounter:
    """Marks an encounter and its active queue entry as completed."""
    encounter = await get_encounter_by_id(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    now = datetime.now(timezone.utc)
    encounter.status = EncounterStatus.COMPLETED
    encounter.completed_at = now

    # Complete active queue entries
    for qe in encounter.queue_entries:
        if qe.queue_status in (QueueStatus.WAITING, QueueStatus.CALLED):
            qe.queue_status = QueueStatus.COMPLETED
            qe.completed_at = now

    await db.commit()
    await db.refresh(encounter)
    return encounter


async def get_encounter_detail(
    db: AsyncSession,
    encounter_id: uuid.UUID | str,
) -> EncounterDetailResponse:
    """Returns encounter-centric response with patient demographics and active queue status."""
    encounter = await get_encounter_by_identifier(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    patient = encounter.patient
    mobile_val = None
    if patient:
        for ident in patient.identities:
            if ident.identity_type.value in ("MOBILE", "PHONE"):
                mobile_val = ident.identity_value
                break

    active_qe = None
    if encounter.queue_entries:
        active_qe = sorted(encounter.queue_entries, key=lambda q: q.queued_at, reverse=True)[0]

    return EncounterDetailResponse(
        encounter=EncounterRead.model_validate(encounter),
        patient=EncounterPatientSummary(
            id=patient.id if patient else uuid.uuid4(),
            uhid=patient.patient_uhid if patient else "",
            full_name=patient.full_name if patient else "Unknown",
            age=patient.age if patient else None,
            gender=patient.gender if patient else "Other",
            mobile=mobile_val,
        ),
        queue_entry_id=active_qe.id if active_qe else None,
        token_number=active_qe.token_number if active_qe else None,
        queue_status=active_qe.queue_status if active_qe else None,
    )
