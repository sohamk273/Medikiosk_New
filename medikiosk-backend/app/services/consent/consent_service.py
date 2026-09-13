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

    if not consent_in.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent was declined; clinical registration cannot proceed without patient consent",
        )

    # Immutable history-preserving append
    consent_obj = ConsentRecord(
        patient_id=encounter.patient_id,
        encounter_id=encounter.id,
        consent_version=consent_in.consent_version or "v1.0",
        granted=consent_in.accepted,
        abdm_sharing=bool(consent_in.abdm_sharing),
        voice_recording=bool(consent_in.voice_recording),
        ip_address=ip_address,
        consented_at=datetime.now(timezone.utc),
    )
    db.add(consent_obj)
    await db.commit()
    await db.refresh(consent_obj)
    return consent_obj


async def get_active_consent_for_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> Optional[ConsentRecord]:
    """Retrieves the latest granted consent record for this encounter if one exists."""
    query = (
        select(ConsentRecord)
        .where(
            ConsentRecord.encounter_id == encounter_id,
            ConsentRecord.granted == True,  # noqa: E712
        )
        .order_by(ConsentRecord.consented_at.desc())
        .limit(1)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()
