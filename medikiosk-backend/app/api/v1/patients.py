"""Patient API endpoints for intake, registration, lookup, and historical encounters."""
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.encounter import Encounter
from app.schemas.patient import (
    PatientCreate,
    PatientRead,
    PatientIdentityCreate,
    PatientIdentityRead,
)
from app.schemas.encounter import EncounterRead
from app.services.patient.patient_service import (
    create_patient,
    get_patient_by_id,
    lookup_patient,
    add_patient_identity,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new patient",
)
async def register_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
) -> PatientRead:
    """Registers a new patient master record and generates an authoritative UHID."""
    patient = await create_patient(db, patient_in)
    return PatientRead.model_validate(patient)


@router.get(
    "/search",
    response_model=PatientRead,
    summary="Lookup patient by identity (UHID, ABHA, PHONE)",
)
async def search_patient(
    identity_type: Optional[str] = Query(None, description="Identity type: UHID, ABHA, PHONE, MOBILE"),
    identity_value: Optional[str] = Query(None, description="Identity value to match"),
    uhid: Optional[str] = Query(None, description="Exact UHID lookup shortcut"),
    abha: Optional[str] = Query(None, description="Exact ABHA lookup shortcut"),
    phone: Optional[str] = Query(None, description="Exact phone/mobile lookup shortcut"),
    db: AsyncSession = Depends(get_db),
) -> PatientRead:
    """Finds an existing patient by UHID, ABHA, or Phone. Returns 404 if not found."""
    # Resolve parameters
    resolved_type = identity_type
    resolved_val = identity_value

    if not resolved_type or not resolved_val:
        if uhid:
            resolved_type = "UHID"
            resolved_val = uhid
        elif abha:
            resolved_type = "ABHA"
            resolved_val = abha
        elif phone:
            resolved_type = "PHONE"
            resolved_val = phone

    if not resolved_type or not resolved_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lookup requires identity_type and identity_value, or one of [uhid, abha, phone]",
        )

    patient = await lookup_patient(db, resolved_type, resolved_val)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No patient found matching {resolved_type} '{resolved_val}'",
        )

    return PatientRead.model_validate(patient)


@router.get(
    "/{patient_id}",
    response_model=PatientRead,
    summary="Get patient by UUID",
)
async def get_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PatientRead:
    """Retrieves patient master record and linked identities by patient UUID."""
    patient = await get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found",
        )
    return PatientRead.model_validate(patient)


@router.get(
    "/{patient_id}/encounters",
    response_model=List[EncounterRead],
    summary="List all historical visits for a patient",
)
async def get_patient_encounters(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[EncounterRead]:
    """Retrieves all past and active clinical encounters/visits for a patient."""
    patient = await get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found",
        )

    stmt = select(Encounter).where(Encounter.patient_id == patient_id).order_by(Encounter.registered_at.desc())
    res = await db.execute(stmt)
    return [EncounterRead.model_validate(enc) for enc in res.scalars().all()]


@router.post(
    "/{patient_id}/identities",
    response_model=PatientIdentityRead,
    status_code=status.HTTP_201_CREATED,
    summary="Attach an identity mechanism (ABHA, Mobile) to patient",
)
async def attach_identity(
    patient_id: uuid.UUID,
    identity_in: PatientIdentityCreate,
    db: AsyncSession = Depends(get_db),
) -> PatientIdentityRead:
    """Attaches an external identity (such as ABHA or Phone) to an existing patient record."""
    identity = await add_patient_identity(
        db,
        patient_id=patient_id,
        identity_type=identity_in.identity_type.value,
        identity_value=identity_in.identity_value,
        is_verified=identity_in.is_verified,
    )
    return PatientIdentityRead.model_validate(identity)
