"""Doctor OPD Queue API endpoints."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.queue import QueueItemResponse, QueueCallResponse, QueueEntryRead
from app.services.auth.auth_service import require_role
from app.services.queue.queue_service import (
    get_today_queue,
    call_queue_entry,
    cancel_queue_entry,
)

router = APIRouter(prefix="/queue", tags=["OPD Queue"])

# Authorized doctor roles
DOCTOR_ROLES = [UserRole.DOCTOR, UserRole.AYUSH_DOCTOR, UserRole.HOSPITAL_ADMIN]


@router.get(
    "",
    response_model=List[QueueItemResponse],
    summary="Get today's active OPD queue",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
@router.get(
    "/today",
    response_model=List[QueueItemResponse],
    summary="Get today's active OPD queue (canonical alias)",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def get_queue(
    db: AsyncSession = Depends(get_db),
) -> List[QueueItemResponse]:
    """Retrieves all patients queued for OPD today, ordered by emergency priority and time."""
    return await get_today_queue(db)


@router.post(
    "/{queue_entry_id}/call",
    response_model=QueueCallResponse,
    summary="Call patient into consultation room",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def call_patient(
    queue_entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> QueueCallResponse:
    """Doctor action: Transitions queue entry to CALLED and encounter to IN_CONSULTATION."""
    return await call_queue_entry(db, queue_entry_id)


@router.post(
    "/{queue_entry_id}/cancel",
    response_model=QueueEntryRead,
    summary="Cancel a queue entry",
    dependencies=[Depends(require_role(DOCTOR_ROLES))],
)
async def cancel_patient_queue(
    queue_entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> QueueEntryRead:
    """Cancels an active queue entry and closes the associated encounter."""
    entry = await cancel_queue_entry(db, queue_entry_id)
    return QueueEntryRead.model_validate(entry)
