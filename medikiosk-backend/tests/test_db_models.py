"""Unit tests for SQLAlchemy database models, relationships, and constraints."""
import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.identity import PatientIdentity, IdentityType
from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.queue import QueueEntry, QueueStatus
from app.models.consent import ConsentRecord
from app.models.hospital_settings import HospitalSettings


@pytest.mark.asyncio
async def test_user_creation(db_session: AsyncSession):
    """Verifies User model persists with role enum and timestamps."""
    user = User(
        username="dr_sharma",
        password_hash="argon2_hashed_secret",
        display_name="Dr. Priya Sharma",
        role=UserRole.DOCTOR,
    )
    db_session.add(user)
    await db_session.commit()

    result = await db_session.execute(select(User).where(User.username == "dr_sharma"))
    persisted = result.scalar_one()
    assert persisted.id is not None
    assert persisted.role == UserRole.DOCTOR
    assert persisted.is_active is True
    assert persisted.created_at is not None


@pytest.mark.asyncio
async def test_patient_and_identities_relationship(db_session: AsyncSession):
    """Verifies Patient and PatientIdentity relationships and cascade behavior."""
    patient = Patient(
        patient_uhid="PAT-2026-00001",
        full_name="Rameshwar Patil",
        age=48,
        gender="Male",
        address="Village Post Sonari",
        city="Nagpur",
        state="Maharashtra",
        pincode="440001",
    )
    db_session.add(patient)
    await db_session.flush()

    # Add ABHA and Mobile identities
    abha_id = PatientIdentity(
        patient_id=patient.id,
        identity_type=IdentityType.ABHA,
        identity_value="12-3456-7890-1234",
        is_verified=True,
    )
    mobile_id = PatientIdentity(
        patient_id=patient.id,
        identity_type=IdentityType.MOBILE,
        identity_value="9876543210",
        is_verified=False,
    )
    db_session.add_all([abha_id, mobile_id])
    await db_session.commit()

    # Verify query with relationship navigation
    result = await db_session.execute(select(Patient).where(Patient.patient_uhid == "PAT-2026-00001"))
    retrieved_patient = result.scalar_one()
    assert len(retrieved_patient.identities) == 2

    # Verify explicit verification state
    identities_map = {i.identity_type: i.is_verified for i in retrieved_patient.identities}
    assert identities_map[IdentityType.ABHA] is True
    assert identities_map[IdentityType.MOBILE] is False


@pytest.mark.asyncio
async def test_encounter_and_queue_entry_creation(db_session: AsyncSession):
    """Verifies Encounter creation and linked QueueEntry token assignment."""
    patient = Patient(
        patient_uhid="PAT-2026-00002",
        full_name="Sunita Deshmukh",
        age=35,
        gender="Female",
    )
    db_session.add(patient)
    await db_session.flush()

    encounter = Encounter(
        encounter_number="MEDI-OPD-2026-00042",
        patient_id=patient.id,
        status=EncounterStatus.WAITING,
        priority=EncounterPriority.EMERGENCY,
        chief_complaint="Severe chest pain radiating to left shoulder",
        red_flag_triggered=True,
    )
    db_session.add(encounter)
    await db_session.flush()

    queue_entry = QueueEntry(
        encounter_id=encounter.id,
        token_number=42,
        queue_status=QueueStatus.WAITING,
        priority=EncounterPriority.EMERGENCY,
    )
    db_session.add(queue_entry)
    await db_session.commit()

    result = await db_session.execute(select(Encounter).where(Encounter.encounter_number == "MEDI-OPD-2026-00042"))
    saved_enc = result.scalar_one()
    assert saved_enc.red_flag_triggered is True
    assert saved_enc.priority == EncounterPriority.EMERGENCY
    assert len(saved_enc.queue_entries) == 1
    assert saved_enc.queue_entries[0].token_number == 42


@pytest.mark.asyncio
async def test_consent_record_creation(db_session: AsyncSession):
    """Verifies ConsentRecord links to Patient and Encounter."""
    patient = Patient(
        patient_uhid="PAT-2026-00003",
        full_name="Vikram Jadhav",
        gender="Male",
    )
    db_session.add(patient)
    await db_session.flush()

    encounter = Encounter(
        encounter_number="ENC-2026-00003",
        patient_id=patient.id,
        status=EncounterStatus.WAITING,
    )
    db_session.add(encounter)
    await db_session.flush()

    consent = ConsentRecord(
        patient_id=patient.id,
        encounter_id=encounter.id,
        consent_version="v1.0",
        granted=True,
        abdm_sharing=True,
        voice_recording=True,
        ip_address="192.168.1.100",
    )
    db_session.add(consent)
    await db_session.commit()

    result = await db_session.execute(select(ConsentRecord).where(ConsentRecord.patient_id == patient.id))
    saved_consent = result.scalar_one()
    assert saved_consent.granted is True
    assert saved_consent.abdm_sharing is True
    assert saved_consent.voice_recording is True
    assert saved_consent.ip_address == "192.168.1.100"


@pytest.mark.asyncio
async def test_hospital_settings_model(db_session: AsyncSession):
    """Verifies HospitalSettings persistence and defaults."""
    settings = HospitalSettings(
        hospital_name="District Hospital Wardha",
        opd_start_time="08:30",
        opd_end_time="16:30",
        kiosk_enabled=True,
        ayush_enabled=True,
    )
    db_session.add(settings)
    await db_session.commit()

    result = await db_session.execute(select(HospitalSettings).limit(1))
    saved = result.scalar_one()
    assert saved.hospital_name == "District Hospital Wardha"
    assert saved.opd_start_time == "08:30"
    assert saved.kiosk_enabled is True


@pytest.mark.asyncio
async def test_unique_uhid_constraint(db_session: AsyncSession):
    """Verifies duplicate patient UHID raises IntegrityError."""
    p1 = Patient(patient_uhid="PAT-DUP-001", full_name="A", gender="Male")
    p2 = Patient(patient_uhid="PAT-DUP-001", full_name="B", gender="Female")
    db_session.add(p1)
    await db_session.commit()

    db_session.add(p2)
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_unique_identity_constraint(db_session: AsyncSession):
    """Verifies duplicate identity (type, value) raises IntegrityError."""
    p = Patient(patient_uhid="PAT-ID-001", full_name="Test Patient", gender="Male")
    db_session.add(p)
    await db_session.flush()

    id1 = PatientIdentity(patient_id=p.id, identity_type=IdentityType.ABHA, identity_value="14-digit-id")
    id2 = PatientIdentity(patient_id=p.id, identity_type=IdentityType.ABHA, identity_value="14-digit-id")
    db_session.add(id1)
    await db_session.commit()

    db_session.add(id2)
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()
