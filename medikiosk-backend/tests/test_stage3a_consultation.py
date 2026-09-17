"""Stage 3A Automated Test Suite — Doctor Consultation Workflow.

Covers:
1. Authenticated doctor can retrieve encounter.
2. Unauthenticated / unauthorized cannot access protected consultation endpoints.
3. Start consultation from WAITING transitions queue to CALLED and encounter to IN_CONSULTATION.
4. Invalid queue transition is rejected (calling completed/cancelled queue entry returns 409).
5. Consultation draft can be created with clinical notes.
6. Consultation draft can be updated (idempotent, no duplicates created).
7. Saved consultation can be retrieved after refresh (GET encounter & GET consultation).
8. Doctor ID is derived strictly from the authenticated JWT user.
9. Finalization persists consultation record with status FINALIZED.
10. Finalization changes QueueEntry to COMPLETED.
11. Finalization changes Encounter to COMPLETED.
"""
import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.patient import Patient
from app.models.queue import QueueEntry, QueueStatus
from app.models.user import User, UserRole


async def create_doctor(db: AsyncSession, username: str = "dr.priya_test", role=UserRole.DOCTOR) -> User:
    """Helper to create an active doctor in the database."""
    user = User(
        username=username,
        password_hash=hash_password("DoctorPass123!"),
        display_name="Dr. Priya Test",
        role=role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_doctor_auth_headers(client: AsyncClient, username: str = "dr.priya_test") -> dict:
    """Login doctor and return Authorization Bearer header."""
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "DoctorPass123!"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def setup_test_encounter(db: AsyncSession) -> tuple[Patient, Encounter, QueueEntry]:
    """Sets up a realistic patient, encounter, and active waiting queue entry."""
    unique_suffix = uuid.uuid4().hex[:6]
    patient = Patient(
        patient_uhid=f"UHID-TEST-{unique_suffix}",
        full_name=f"Patient {unique_suffix}",
        age=32,
        gender="MALE",
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)

    encounter = Encounter(
        encounter_number=f"ENC-TEST-{unique_suffix}",
        patient_id=patient.id,
        status=EncounterStatus.WAITING,
        chief_complaint="Chest pain and breathing difficulty",
        priority=EncounterPriority.NORMAL,
    )
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)

    queue_entry = QueueEntry(
        encounter_id=encounter.id,
        token_number=101,
        queue_status=QueueStatus.WAITING,
        priority=EncounterPriority.NORMAL,
    )
    db.add(queue_entry)
    await db.commit()
    await db.refresh(queue_entry)

    return patient, encounter, queue_entry


# ==============================================================================
# TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_1_authenticated_doctor_can_retrieve_encounter(client: AsyncClient, db_session: AsyncSession):
    """Verifies that an authenticated doctor can retrieve full encounter details."""
    doc = await create_doctor(db_session, username="dr.enc_1")
    headers = await get_doctor_auth_headers(client, username="dr.enc_1")
    patient, encounter, qe = await setup_test_encounter(db_session)

    res = await client.get(f"/api/v1/encounters/{encounter.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["encounter"]["id"] == str(encounter.id)
    assert data["encounter"]["encounter_number"] == encounter.encounter_number
    assert data["patient"]["id"] == str(patient.id)
    assert data["patient"]["full_name"] == patient.full_name
    assert data["patient"]["age"] == 32
    assert data["queue_entry_id"] == str(qe.id)
    assert data["token_number"] == 101
    assert data["queue_status"] == "WAITING"


@pytest.mark.asyncio
async def test_2_unauthenticated_cannot_access_consultation_endpoints(client: AsyncClient, db_session: AsyncSession):
    """Verifies that unauthenticated requests to consultation endpoints are rejected with 401."""
    patient, encounter, qe = await setup_test_encounter(db_session)

    # 1. GET consultation without auth
    res1 = await client.get(f"/api/v1/encounters/{encounter.id}/consultation")
    assert res1.status_code == 401

    # 2. POST save draft without auth
    res2 = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation",
        json={"findings": "Test findings", "assessment": "Test assessment"},
    )
    assert res2.status_code == 401

    # 3. POST finalize without auth
    res3 = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation/finalize",
        json={"findings": "Test findings", "assessment": "Test assessment", "diagnosis": "Test diagnosis"},
    )
    assert res3.status_code == 401


@pytest.mark.asyncio
async def test_3_start_consultation_from_waiting_succeeds(client: AsyncClient, db_session: AsyncSession):
    """Verifies start consultation transitions queue to CALLED and encounter to IN_CONSULTATION."""
    doc = await create_doctor(db_session, username="dr.start_cons")
    headers = await get_doctor_auth_headers(client, username="dr.start_cons")
    patient, encounter, qe = await setup_test_encounter(db_session)

    # Call patient into consultation
    res = await client.post(f"/api/v1/queue/{qe.id}/call", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["queue_entry_id"] == str(qe.id)
    assert data["queue_status"] == "CALLED"
    assert data["encounter_status"] == "IN_CONSULTATION"
    assert data["called_at"] is not None

    # Verify encounter status via GET
    enc_res = await client.get(f"/api/v1/encounters/{encounter.id}", headers=headers)
    assert enc_res.status_code == 200
    assert enc_res.json()["encounter"]["status"] == "IN_CONSULTATION"
    assert enc_res.json()["queue_status"] == "CALLED"


@pytest.mark.asyncio
async def test_4_invalid_queue_transition_is_rejected(client: AsyncClient, db_session: AsyncSession):
    """Verifies that calling an already completed queue entry is rejected with 409 Conflict."""
    doc = await create_doctor(db_session, username="dr.invalid_trans")
    headers = await get_doctor_auth_headers(client, username="dr.invalid_trans")
    patient, encounter, qe = await setup_test_encounter(db_session)

    # Mark queue entry as COMPLETED
    qe.queue_status = QueueStatus.COMPLETED
    await db_session.commit()

    # Attempting to call should return 409 CONFLICT
    res = await client.post(f"/api/v1/queue/{qe.id}/call", headers=headers)
    assert res.status_code == 409
    assert "COMPLETED" in res.json()["detail"]


@pytest.mark.asyncio
async def test_5_and_6_consultation_draft_created_and_updated(client: AsyncClient, db_session: AsyncSession):
    """Verifies creating consultation draft and subsequent updates to the same record."""
    doc = await create_doctor(db_session, username="dr.draft_test")
    headers = await get_doctor_auth_headers(client, username="dr.draft_test")
    patient, encounter, qe = await setup_test_encounter(db_session)

    draft_payload_1 = {
        "findings": "Bilateral wheezing in lower lobes",
        "assessment": "Suspected acute bronchitis",
        "diagnosis": "Bronchitis",
        "notes": "Patient advised rest and hydration",
        "prescription": {
            "items": [
                {
                    "id": "item-1",
                    "medicineName": "Amoxicillin 500mg",
                    "dosage": "1 tablet",
                    "frequency": "TDS",
                    "duration": "5 days",
                    "instructions": "After meals",
                }
            ]
        },
        "follow_up": {
            "required": True,
            "timeframe": "7 days",
            "instructions": "Return if fever persists",
        },
    }

    # 1. Create Draft
    res1 = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation",
        json=draft_payload_1,
        headers=headers,
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "DRAFT"
    assert data1["findings"] == draft_payload_1["findings"]
    assert data1["doctor_id"] == str(doc.id)
    assert data1["doctor_name"] == doc.display_name
    record_id = data1["id"]

    # 2. Update Draft (Second Save Draft)
    draft_payload_2 = dict(draft_payload_1)
    draft_payload_2["notes"] = "Updated note: Patient also reporting mild headache"

    res2 = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation",
        json=draft_payload_2,
        headers=headers,
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == record_id  # Must update existing record, not create duplicate
    assert data2["notes"] == "Updated note: Patient also reporting mild headache"


@pytest.mark.asyncio
async def test_7_saved_consultation_retrieved_after_refresh(client: AsyncClient, db_session: AsyncSession):
    """Verifies that saved consultation draft persists and can be retrieved via GET endpoints."""
    doc = await create_doctor(db_session, username="dr.refresh_test")
    headers = await get_doctor_auth_headers(client, username="dr.refresh_test")
    patient, encounter, qe = await setup_test_encounter(db_session)

    draft_payload = {
        "findings": "Normal heart sounds, BP 120/80",
        "assessment": "Mild tension headache",
        "diagnosis": "Tension Headache",
        "notes": "Stress reduction advised",
        "prescription": {"items": []},
        "follow_up": {"required": False, "timeframe": "", "instructions": ""},
    }

    # Save draft
    save_res = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation",
        json=draft_payload,
        headers=headers,
    )
    assert save_res.status_code == 200

    # Simulate browser refresh by fetching encounter detail
    enc_res = await client.get(f"/api/v1/encounters/{encounter.id}", headers=headers)
    assert enc_res.status_code == 200
    enc_data = enc_res.json()
    assert enc_data["consultation"] is not None
    assert enc_data["consultation"]["findings"] == "Normal heart sounds, BP 120/80"
    assert enc_data["consultation"]["diagnosis"] == "Tension Headache"
    assert enc_data["consultation"]["notes"] == "Stress reduction advised"

    # Also test direct consultation endpoint
    cons_res = await client.get(f"/api/v1/encounters/{encounter.id}/consultation", headers=headers)
    assert cons_res.status_code == 200
    cons_data = cons_res.json()
    assert cons_data["status"] == "DRAFT"
    assert cons_data["diagnosis"] == "Tension Headache"


@pytest.mark.asyncio
async def test_8_doctor_id_comes_from_authenticated_user(client: AsyncClient, db_session: AsyncSession):
    """Verifies that doctor_id is determined strictly from JWT, not from client request body."""
    doc = await create_doctor(db_session, username="dr.auth_user")
    headers = await get_doctor_auth_headers(client, username="dr.auth_user")
    patient, encounter, qe = await setup_test_encounter(db_session)

    fake_doctor_id = str(uuid.uuid4())
    res = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation",
        json={
            "findings": "Test",
            "assessment": "Test",
            "doctor_id": fake_doctor_id,  # Attempting to inject spoofed doctor_id
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    # doctor_id must be the real authenticated doctor's ID, not fake_doctor_id
    assert data["doctor_id"] == str(doc.id)
    assert data["doctor_id"] != fake_doctor_id


@pytest.mark.asyncio
async def test_9_10_11_finalization_persists_and_completes_encounter_and_queue(client: AsyncClient, db_session: AsyncSession):
    """Verifies full finalization: consultation FINALIZED, Encounter COMPLETED, QueueEntry COMPLETED."""
    doc = await create_doctor(db_session, username="dr.finalizer")
    headers = await get_doctor_auth_headers(client, username="dr.finalizer")
    patient, encounter, qe = await setup_test_encounter(db_session)

    finalize_payload = {
        "findings": "Chest clear, no murmurs, normal pulse",
        "assessment": "Viral pharyngitis resolving",
        "diagnosis": "Acute Pharyngitis",
        "notes": "Patient counselled on completing full antibiotic course if prescribed",
        "prescription": {
            "items": [
                {
                    "id": "med-1",
                    "medicineName": "Paracetamol 650mg",
                    "dosage": "1 tablet",
                    "frequency": "SOS",
                    "duration": "3 days",
                    "instructions": "For fever over 100F",
                }
            ]
        },
        "follow_up": {
            "required": True,
            "timeframe": "3 days",
            "instructions": "Follow up if symptoms persist",
        },
    }

    # Finalize consultation
    res = await client.post(
        f"/api/v1/encounters/{encounter.id}/consultation/finalize",
        json=finalize_payload,
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()

    # 9. Consultation is FINALIZED
    assert data["status"] == "FINALIZED"
    assert data["finalized_at"] is not None
    assert data["diagnosis"] == "Acute Pharyngitis"

    # Refresh DB session to inspect database states
    await db_session.refresh(encounter)
    await db_session.refresh(qe)

    # 10. QueueEntry is COMPLETED
    assert qe.queue_status == QueueStatus.COMPLETED
    assert qe.completed_at is not None

    # 11. Encounter is COMPLETED
    assert encounter.status == EncounterStatus.COMPLETED
    assert encounter.completed_at is not None
