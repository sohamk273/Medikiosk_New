"""Patient domain service for Authoritative Patient Master Index operations."""
import random
import string
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.patient import Patient
from app.models.identity import PatientIdentity, IdentityType
from app.schemas.patient import PatientCreate


def generate_uhid_string() -> str:
    """Generates a human-readable unique hospital identifier."""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"UHID-{date_part}-{rand_part}"


async def get_patient_by_id(db: AsyncSession, patient_id: uuid.UUID) -> Optional[Patient]:
    """Retrieves patient by UUID with identities preloaded."""
    query = (
        select(Patient)
        .where(Patient.id == patient_id)
        .options(selectinload(Patient.identities))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_patient_by_uhid(db: AsyncSession, uhid: str) -> Optional[Patient]:
    """Retrieves patient by exact UHID."""
    query = (
        select(Patient)
        .where(Patient.patient_uhid == uhid.strip())
        .options(selectinload(Patient.identities))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def lookup_patient(
    db: AsyncSession,
    identity_type: str,
    identity_value: str,
) -> Optional[Patient]:
    """Searches patient by UHID, ABHA, or Mobile/Phone."""
    norm_type = identity_type.strip().upper()
    norm_val = identity_value.strip().replace("-", "").replace(" ", "")

    if norm_type == "UHID":
        return await get_patient_by_uhid(db, identity_value.strip())

    # Map PHONE to MOBILE enum
    mapped_enum = IdentityType.MOBILE if norm_type in ("PHONE", "MOBILE") else IdentityType.ABHA

    query = (
        select(PatientIdentity)
        .where(
            PatientIdentity.identity_type == mapped_enum,
            PatientIdentity.identity_value == norm_val,
        )
        .options(selectinload(PatientIdentity.patient).selectinload(Patient.identities))
    )
    result = await db.execute(query)
    identity_record = result.scalar_one_or_none()

    if identity_record and identity_record.patient:
        return identity_record.patient

    return None


def normalize_identity_type(val) -> IdentityType:
    """Normalizes identity type string or enum to IdentityType."""
    raw = val.value if isinstance(val, IdentityType) else str(val)
    raw_upper = raw.upper().strip()
    if raw_upper in ("MOBILE", "PHONE") or "MOBILE" in raw_upper or "PHONE" in raw_upper:
        return IdentityType.MOBILE
    return IdentityType.ABHA


async def create_patient(
    db: AsyncSession,
    patient_in: PatientCreate,
) -> Patient:
    """Transactionally registers a new patient master record."""
    uhid = patient_in.patient_uhid or generate_uhid_string()

    # Ensure UHID uniqueness
    existing_uhid = await get_patient_by_uhid(db, uhid)
    while existing_uhid:
        uhid = generate_uhid_string()
        existing_uhid = await get_patient_by_uhid(db, uhid)

    patient = Patient(
        patient_uhid=uhid,
        full_name=patient_in.full_name.strip(),
        age=patient_in.age,
        gender=patient_in.gender.strip(),
        address=patient_in.address,
        city=patient_in.city,
        state=patient_in.state,
        pincode=patient_in.pincode,
    )
    db.add(patient)
    await db.flush()

    # Add any initial identities
    if patient_in.identities:
        for ident in patient_in.identities:
            norm_type = normalize_identity_type(ident.identity_type)
            norm_val = ident.identity_value.strip().replace("-", "").replace(" ", "")

            # Check if this identity is already mapped to another patient
            dup_query = select(PatientIdentity).where(
                PatientIdentity.identity_type == norm_type,
                PatientIdentity.identity_value == norm_val,
            )
            dup_res = await db.execute(dup_query)
            if dup_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Identity '{norm_type.value}' with value '{norm_val}' is already registered to another patient",
                )

            identity_obj = PatientIdentity(
                patient_id=patient.id,
                identity_type=norm_type,
                identity_value=norm_val,
                is_verified=ident.is_verified,
                verified_at=datetime.now(timezone.utc) if ident.is_verified else None,
            )
            db.add(identity_obj)

    await db.commit()
    await db.refresh(patient)
    return patient


async def add_patient_identity(
    db: AsyncSession,
    patient_id: uuid.UUID,
    identity_type: str,
    identity_value: str,
    is_verified: bool = False,
) -> PatientIdentity:
    """Attaches a new identity link to an existing patient."""
    patient = await get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found",
        )

    norm_type = normalize_identity_type(identity_type)
    norm_val = identity_value.strip().replace("-", "").replace(" ", "")

    # Check uniqueness
    dup_query = select(PatientIdentity).where(
        PatientIdentity.identity_type == norm_type,
        PatientIdentity.identity_value == norm_val,
    )
    dup_res = await db.execute(dup_query)
    existing = dup_res.scalar_one_or_none()
    if existing:
        if existing.patient_id == patient_id:
            return existing
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Identity '{norm_type.value}' is already registered to another patient",
        )

    identity_obj = PatientIdentity(
        patient_id=patient_id,
        identity_type=norm_type,
        identity_value=norm_val,
        is_verified=is_verified,
        verified_at=datetime.now(timezone.utc) if is_verified else None,
    )
    db.add(identity_obj)
    await db.commit()
    await db.refresh(identity_obj)
    return identity_obj
