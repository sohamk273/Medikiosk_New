"""Audit service for logging and retrieving clinical journey actions."""
import logging
import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditEvent

logger = logging.getLogger("audit_service")


async def log_audit_event(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    encounter_id: Optional[uuid.UUID] = None,
    patient_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditEvent:
    """Records an immutable audit event in the database."""
    try:
        event = AuditEvent(
            id=uuid.uuid4(),
            encounter_id=encounter_id,
            patient_id=patient_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=details or {},
            ip_address=ip_address,
        )
        db.add(event)
        await db.flush()
        return event
    except Exception as e:
        logger.warning(f"Failed to record audit event '{action}': {e}")
        return None


async def get_encounter_audit_trail(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> List[AuditEvent]:
    """Retrieves all chronological audit events linked to an encounter."""
    stmt = (
        select(AuditEvent)
        .where(AuditEvent.encounter_id == encounter_id)
        .order_by(AuditEvent.created_at.asc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_patient_audit_trail(
    db: AsyncSession,
    patient_id: uuid.UUID,
) -> List[AuditEvent]:
    """Retrieves all chronological audit events linked to a patient."""
    stmt = (
        select(AuditEvent)
        .where(AuditEvent.patient_id == patient_id)
        .order_by(AuditEvent.created_at.asc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())
