"""Consent service managing DPDP/ABDM patient consent evidence."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent import ConsentRecord
from app.models.encounter import Encounter
from app.schemas.consent import ConsentCreate
from app.services.audit.audit_service import log_audit_event


async def record_consent(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    consent_in: ConsentCreate,
    ip_address: Optional[str] = None,
) -> ConsentRecord:
    """Records authoritative patient consent for an encounter."""
    # Verify encounter exists
    query = select(Encounter).where(Encounter.id == encounter_id)
    result = await db.execute(query)
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    granted_val = getattr(consent_in, "accepted", True)
    if hasattr(consent_in, "granted") and consent_in.granted is not None:
        granted_val = consent_in.granted

    if not granted_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient consent must be accepted to proceed with clinical intake",
        )

    consent = ConsentRecord(
        patient_id=encounter.patient_id,
        encounter_id=encounter.id,
        consent_version=consent_in.consent_version or "v1.0",
        granted=granted_val,
        abdm_sharing=consent_in.abdm_sharing if consent_in.abdm_sharing is not None else True,
        voice_recording=consent_in.voice_recording if consent_in.voice_recording is not None else True,
        consented_at=datetime.now(timezone.utc),
        ip_address=ip_address,
    )
    db.add(consent)
    await db.flush()

    await log_audit_event(
        db=db,
        action="CONSENT_RECORDED",
        entity_type="CONSENT",
        entity_id=str(consent.id),
        encounter_id=encounter.id,
        patient_id=encounter.patient_id,
        details={"granted": consent.granted, "version": consent.consent_version},
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(consent)
    return consent


async def get_active_consent_for_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> Optional[ConsentRecord]:
    """Retrieves the most recent consent record for an encounter."""
    query = (
        select(ConsentRecord)
        .where(ConsentRecord.encounter_id == encounter_id)
        .order_by(ConsentRecord.consented_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().first()
