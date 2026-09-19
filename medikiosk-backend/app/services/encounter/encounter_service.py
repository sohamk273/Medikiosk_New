"""Encounter domain service managing clinical visits and lifecycle transitions."""
import random
import string
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.patient import Patient
from app.models.queue import QueueEntry, QueueStatus
from app.models.consent import ConsentRecord
from app.models.consultation import ConsultationRecord, ConsultationStatus
from app.models.clinical_case import ClinicalCaseRecord
from app.models.ayush import AYUSHAssessmentRecord
from app.models.document import Document
from app.models.audit import AuditEvent
from app.schemas.encounter import (
    EncounterCreate,
    EncounterUpdate,
    EncounterDetailResponse,
    EncounterRead,
    EncounterPatientSummary,
    EncounterLifecycleResponse,
)
from app.schemas.consent import ConsentRead
from app.schemas.consultation import ConsultationRead
from app.schemas.document import DocumentRead
from app.schemas.clinical import ClinicalEncounterRead
from app.schemas.ayush import AYUSHAssessmentRead
from app.schemas.audit import AuditEventRead
from app.services.audit.audit_service import log_audit_event, get_encounter_audit_trail


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
            selectinload(Encounter.consultation).selectinload(ConsultationRecord.doctor),
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
        .execution_options(populate_existing=True)
        .options(
            selectinload(Encounter.patient).selectinload(Patient.identities),
            selectinload(Encounter.queue_entries),
            selectinload(Encounter.consultation).selectinload(ConsultationRecord.doctor),
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_encounter(
    db: AsyncSession,
    encounter_in: EncounterCreate,
    ip_address: Optional[str] = None,
) -> Encounter:
    """Creates a new clinical visit record."""
    # Verify patient exists
    from app.services.patient.patient_service import get_patient_by_id
    patient = await get_patient_by_id(db, encounter_in.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{encounter_in.patient_id}' not found",
        )

    encounter = Encounter(
        encounter_number=generate_encounter_number(),
        patient_id=encounter_in.patient_id,
        priority=encounter_in.priority or EncounterPriority.NORMAL,
        status=EncounterStatus.WAITING,
    )
    db.add(encounter)
    await db.flush()

    # Log audit event
    await log_audit_event(
        db=db,
        action="SESSION_CREATED",
        entity_type="ENCOUNTER",
        entity_id=str(encounter.id),
        encounter_id=encounter.id,
        patient_id=patient.id,
        details={"encounter_number": encounter.encounter_number},
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(encounter)
    return encounter


async def update_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    update_in: EncounterUpdate,
    ip_address: Optional[str] = None,
) -> Encounter:
    """Updates registration-time details (chief complaint, red flag, priority)."""
    encounter = await get_encounter_by_id(db, encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    update_data = update_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(encounter, field, value)

    await db.flush()

    if update_in.red_flag_triggered:
        await log_audit_event(
            db=db,
            action="RED_FLAG_TRIGGERED",
            entity_type="ENCOUNTER",
            entity_id=str(encounter.id),
            encounter_id=encounter.id,
            patient_id=encounter.patient_id,
            details={"chief_complaint": encounter.chief_complaint, "priority": encounter.priority.value},
            ip_address=ip_address,
        )

    await db.commit()
    await db.refresh(encounter)
    return encounter


async def complete_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
) -> Encounter:
    """Completes active clinical encounter and marks linked queue entries completed."""
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
    qe_query = select(QueueEntry).where(
        QueueEntry.encounter_id == encounter.id,
        QueueEntry.queue_status.in_([QueueStatus.WAITING, QueueStatus.CALLED]),
    )
    qe_res = await db.execute(qe_query)
    for qe in qe_res.scalars().all():
        qe.queue_status = QueueStatus.COMPLETED
        qe.completed_at = now

    if encounter.consultation and encounter.consultation.status == ConsultationStatus.DRAFT:
        encounter.consultation.status = ConsultationStatus.FINALIZED
        encounter.consultation.finalized_at = now

    await db.flush()

    await log_audit_event(
        db=db,
        action="ENCOUNTER_COMPLETED",
        entity_type="ENCOUNTER",
        entity_id=str(encounter.id),
        encounter_id=encounter.id,
        patient_id=encounter.patient_id,
        user_id=user_id,
    )

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
        active_qe = sorted(encounter.queue_entries, key=lambda q: q.queued_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)[0]

    if not active_qe:
        qe_res = await db.execute(
            select(QueueEntry)
            .where(QueueEntry.encounter_id == encounter.id)
            .order_by(QueueEntry.queued_at.desc())
        )
        active_qe = qe_res.scalars().first()

    consultation_rec = encounter.consultation
    if not consultation_rec:
        cons_res = await db.execute(
            select(ConsultationRecord)
            .where(ConsultationRecord.encounter_id == encounter.id)
            .options(selectinload(ConsultationRecord.doctor))
        )
        consultation_rec = cons_res.scalar_one_or_none()

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
        consultation=ConsultationRead.model_validate(consultation_rec) if consultation_rec else None,
    )


async def get_encounter_full_lifecycle(
    db: AsyncSession,
    identifier: uuid.UUID | str,
) -> EncounterLifecycleResponse:
    """Aggregates the entire verified clinical record lifecycle for an encounter."""
    encounter = await get_encounter_by_identifier(db, identifier)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{identifier}' not found",
        )

    patient = encounter.patient
    mobile_val = None
    if patient:
        for ident in patient.identities:
            if ident.identity_type.value in ("MOBILE", "PHONE"):
                mobile_val = ident.identity_value
                break

    # 1. Latest Consent
    consent_stmt = (
        select(ConsentRecord)
        .where(ConsentRecord.encounter_id == encounter.id)
        .order_by(ConsentRecord.consented_at.desc())
    )
    consent_res = await db.execute(consent_stmt)
    consent_obj = consent_res.scalars().first()

    # 2. Queue entry & token
    qe_stmt = (
        select(QueueEntry)
        .where(QueueEntry.encounter_id == encounter.id)
        .order_by(QueueEntry.queued_at.desc())
    )
    qe_res = await db.execute(qe_stmt)
    active_qe = qe_res.scalars().first()

    # 3. Clinical Case Record
    case_stmt = (
        select(ClinicalCaseRecord)
        .where(ClinicalCaseRecord.encounter_id == encounter.id)
        .options(selectinload(ClinicalCaseRecord.turns))
    )
    case_res = await db.execute(case_stmt)
    clinical_case = case_res.scalars().first()

    # 4. AYUSH Assessment Record
    ayush_stmt = select(AYUSHAssessmentRecord).where(AYUSHAssessmentRecord.encounter_id == encounter.id)
    ayush_res = await db.execute(ayush_stmt)
    ayush_record = ayush_res.scalars().first()

    # 5. Documents list
    doc_stmt = (
        select(Document)
        .where(Document.encounter_id == encounter.id)
        .options(selectinload(Document.extractions))
        .order_by(Document.uploaded_at.asc())
    )
    doc_res = await db.execute(doc_stmt)
    docs = list(doc_res.scalars().all())

    # 6. Consultation Record
    cons_stmt = (
        select(ConsultationRecord)
        .where(ConsultationRecord.encounter_id == encounter.id)
        .options(selectinload(ConsultationRecord.doctor))
    )
    cons_res = await db.execute(cons_stmt)
    consultation_rec = cons_res.scalar_one_or_none()

    # 7. Audit events
    audit_events = await get_encounter_audit_trail(db, encounter.id)

    is_emergency = encounter.priority == EncounterPriority.EMERGENCY or encounter.red_flag_triggered
    if clinical_case and clinical_case.is_emergency:
        is_emergency = True

    return EncounterLifecycleResponse(
        encounter=EncounterRead.model_validate(encounter),
        patient=EncounterPatientSummary(
            id=patient.id if patient else uuid.uuid4(),
            uhid=patient.patient_uhid if patient else "",
            full_name=patient.full_name if patient else "Unknown",
            age=patient.age if patient else None,
            gender=patient.gender if patient else "Other",
            mobile=mobile_val,
            address=patient.address if patient else None,
            city=patient.city if patient else None,
            state=patient.state if patient else None,
            pincode=patient.pincode if patient else None,
        ),
        consent=ConsentRead.model_validate(consent_obj) if consent_obj else None,
        queue_entry_id=active_qe.id if active_qe else None,
        token_number=active_qe.token_number if active_qe else None,
        queue_status=active_qe.queue_status if active_qe else None,
        clinical_case=ClinicalEncounterRead.model_validate(clinical_case) if clinical_case else None,
        ayush_assessment=AYUSHAssessmentRead.model_validate(ayush_record) if ayush_record else None,
        documents=[DocumentRead.model_validate(d) for d in docs],
        consultation=ConsultationRead.model_validate(consultation_rec) if consultation_rec else None,
        audit_trail=[AuditEventRead.model_validate(ev) for ev in audit_events],
        is_emergency=is_emergency,
        lifecycle_status=encounter.status.value,
    )
