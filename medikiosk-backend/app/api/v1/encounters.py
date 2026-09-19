"""Encounter API endpoints for kiosk check-in, visit management, and complete lifecycle."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.encounter import (
    EncounterCreate,
    EncounterRead,
    EncounterUpdate,
    EncounterDetailResponse,
    EncounterSubmitResponse,
    EncounterLifecycleResponse,
)
from app.schemas.consent import ConsentCreate, ConsentRead
from app.schemas.consultation import ConsultationCreate, ConsultationRead
from app.schemas.document import DocumentRead
from app.schemas.ayush import (
    AYUSHIntakeCreate,
    AYUSHDoctorAssessmentUpdate,
    AYUSHAssessmentRead,
)
from app.schemas.audit import AuditEventRead
from app.services.auth.auth_service import require_role
from app.services.encounter.encounter_service import (
    create_encounter,
    update_encounter,
    complete_encounter,
    get_encounter_detail,
    get_encounter_full_lifecycle,
)
from app.services.consent.consent_service import record_consent
from app.services.queue.queue_service import submit_encounter_to_queue
from app.services.consultation.consultation_service import (
    get_consultation_by_encounter,
    save_consultation_draft,
    finalize_consultation,
)
from app.services.document.document_service import (
    upload_document,
    list_documents_by_encounter,
)
from app.services.ayush.ayush_service import (
    save_ayush_intake,
    get_ayush_assessment,
    update_doctor_ayush_assessment,
)
from app.services.audit.audit_service import get_encounter_audit_trail
from app.services.storage import StorageService, get_storage_service

router = APIRouter(prefix="/encounters", tags=["Encounters"])

# Authorized doctor roles
DOCTOR_ROLES = [UserRole.DOCTOR, UserRole.AYUSH_DOCTOR, UserRole.HOSPITAL_ADMIN]


@router.post(
    "",
    response_model=EncounterRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new clinical visit (Encounter)",
)
async def start_encounter(
    encounter_in: EncounterCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> EncounterRead:
    """Creates an encounter for an existing patient to initiate the kiosk intake journey."""
    ip_addr = request.client.host if request.client else None
    encounter = await create_encounter(db, encounter_in, ip_address=ip_addr)
    return EncounterRead.model_validate(encounter)


@router.get(
    "/{encounter_id}",
    response_model=EncounterDetailResponse,
    summary="Get encounter details and patient summary",
)
async def get_encounter(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> EncounterDetailResponse:
    """Returns encounter information along with associated patient demographic summary."""
    return await get_encounter_detail(db, encounter_id)


@router.get(
    "/{encounter_id}/lifecycle",
    response_model=EncounterLifecycleResponse,
    summary="Retrieve complete persistent clinical record lifecycle",
)
async def get_encounter_lifecycle(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> EncounterLifecycleResponse:
    """Aggregates the complete verified clinical record lifecycle (Demographics, Consent, Intake, AYUSH, Docs, Queue, Consultation, Audit)."""
    return await get_encounter_full_lifecycle(db, encounter_id)


@router.get(
    "/{encounter_id}/audit-trail",
    response_model=List[AuditEventRead],
    summary="Get full audit timeline for encounter",
)
async def get_audit_trail(
    encounter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[AuditEventRead]:
    """Retrieves all chronological audit events linked to the encounter."""
    events = await get_encounter_audit_trail(db, encounter_id)
    return [AuditEventRead.model_validate(ev) for ev in events]


@router.patch(
    "/{encounter_id}",
    response_model=EncounterRead,
    summary="Update encounter registration fields (e.g. chief complaint)",
)
async def patch_encounter(
    encounter_id: uuid.UUID,
    update_in: EncounterUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> EncounterRead:
    """Updates registration fields like chief complaint, red flag status, or priority."""
    ip_addr = request.client.host if request.client else None
    encounter = await update_encounter(db, encounter_id, update_in, ip_address=ip_addr)
    return EncounterRead.model_validate(encounter)


@router.post(
    "/{encounter_id}/consent",
    response_model=ConsentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record authoritative patient consent",
)
async def submit_consent(
    encounter_id: uuid.UUID,
    consent_in: ConsentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ConsentRead:
    """Stores immutable patient consent record for this clinical encounter."""
    ip_addr = request.client.host if request.client else None
    consent = await record_consent(db, encounter_id, consent_in, ip_address=ip_addr)
    return ConsentRead.model_validate(consent)


@router.post(
    "/{encounter_id}/ayush",
    response_model=AYUSHAssessmentRead,
    status_code=status.HTTP_200_OK,
    summary="Save patient AYUSH intake responses and Prakriti profile",
)
async def save_ayush(
    encounter_id: uuid.UUID,
    ayush_in: AYUSHIntakeCreate,
    db: AsyncSession = Depends(get_db),
) -> AYUSHAssessmentRead:
    """Computes and persists patient Prakriti dosha distribution from kiosk questionnaire."""
    record = await save_ayush_intake(db, encounter_id, ayush_in)
    return AYUSHAssessmentRead.model_validate(record)


@router.get(
    "/{encounter_id}/ayush",
    response_model=Optional[AYUSHAssessmentRead],
    summary="Get AYUSH assessment for encounter",
)
async def get_ayush(
    encounter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Optional[AYUSHAssessmentRead]:
    """Retrieves patient AYUSH intake & doctor findings for an encounter."""
    record = await get_ayush_assessment(db, encounter_id)
    if not record:
        return None
    return AYUSHAssessmentRead.model_validate(record)


@router.patch(
    "/{encounter_id}/ayush/doctor-assessment",
    response_model=AYUSHAssessmentRead,
    summary="Save doctor Ayurvedic clinical findings",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def patch_doctor_ayush(
    encounter_id: uuid.UUID,
    doc_in: AYUSHDoctorAssessmentUpdate,
    current_user: User = Depends(require_role(DOCTOR_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> AYUSHAssessmentRead:
    """Allows doctor to record Prakriti, Vikriti, Agni, Koshtha, and Ayurvedic formulations."""
    record = await update_doctor_ayush_assessment(
        db=db,
        encounter_id=encounter_id,
        doctor_data=doc_in,
        doctor_id=current_user.id,
    )
    return AYUSHAssessmentRead.model_validate(record)


@router.post(
    "/{encounter_id}/submit",
    response_model=EncounterSubmitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit encounter to OPD queue and allocate daily token",
)
async def submit_to_queue(
    encounter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> EncounterSubmitResponse:
    """Finalizes kiosk registration, verifies consent, and atomically allocates OPD token."""
    return await submit_encounter_to_queue(db, encounter_id)


@router.post(
    "/{encounter_id}/complete",
    response_model=EncounterRead,
    summary="Mark encounter as completed",
)
async def complete_visit(
    encounter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> EncounterRead:
    """Closes the active clinical encounter and marks linked queue entries completed."""
    encounter = await complete_encounter(db, encounter_id)
    return EncounterRead.model_validate(encounter)


@router.get(
    "/{encounter_id}/consultation",
    response_model=Optional[ConsultationRead],
    summary="Get consultation record for an encounter",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def get_consultation(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> Optional[ConsultationRead]:
    """Retrieves existing consultation record (draft or finalized) for this encounter."""
    consultation = await get_consultation_by_encounter(db, encounter_id)
    if not consultation:
        return None
    return ConsultationRead.model_validate(consultation)


@router.post(
    "/{encounter_id}/consultation",
    response_model=ConsultationRead,
    status_code=status.HTTP_200_OK,
    summary="Save consultation draft",
)
async def save_draft(
    encounter_id: str,
    data_in: ConsultationCreate,
    current_user: User = Depends(require_role(DOCTOR_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> ConsultationRead:
    """Creates or updates a consultation draft for the encounter. Doctor identity comes from JWT."""
    consultation = await save_consultation_draft(db, encounter_id, current_user.id, data_in)
    return ConsultationRead.model_validate(consultation)


@router.post(
    "/{encounter_id}/consultation/finalize",
    response_model=ConsultationRead,
    status_code=status.HTTP_200_OK,
    summary="Finalize clinical consultation",
)
async def finalize_visit_consultation(
    encounter_id: str,
    data_in: ConsultationCreate,
    current_user: User = Depends(require_role(DOCTOR_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> ConsultationRead:
    """Finalizes consultation, marks encounter & queue COMPLETED. Doctor identity comes from JWT."""
    consultation = await finalize_consultation(db, encounter_id, current_user.id, data_in)
    return ConsultationRead.model_validate(consultation)


@router.post(
    "/{encounter_id}/documents",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload medical document for an encounter",
)
async def upload_encounter_document(
    encounter_id: str,
    file: UploadFile = File(..., description="Document binary file (PDF, PNG, JPEG)"),
    document_type: Optional[str] = Form(None, description="Document category (PRESCRIPTION, LAB_REPORT, etc.)"),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
) -> DocumentRead:
    """Uploads a clinical document to MinIO object storage and persists metadata in PostgreSQL."""
    document = await upload_document(
        db=db,
        encounter_id=encounter_id,
        file=file,
        document_type=document_type,
        storage_service=storage,
    )
    return DocumentRead.model_validate(document)


@router.get(
    "/{encounter_id}/documents",
    response_model=List[DocumentRead],
    status_code=status.HTTP_200_OK,
    summary="List all documents associated with an encounter",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def get_encounter_documents(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> List[DocumentRead]:
    """Retrieves document metadata records for this encounter. Doctor authentication required."""
    documents = await list_documents_by_encounter(db, encounter_id)
    return [DocumentRead.model_validate(d) for d in documents]
