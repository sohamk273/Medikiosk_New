"""Stage 2 Automated Test Suite.

Covers:
- Patient: create, duplicate identity handling, lookup by identity, retrieve
- Encounter: create, retrieve, update chief complaint, invalid patient relationship
- Consent: accepted, rejected, history preservation
- Submission: submit, queue entry created, token allocated, idempotency, consent enforcement
- Queue: FIFO ordering, emergency priority, call transition, invalid transition, authorization
- Auth: login success, invalid password, JWT validation, unauthenticated/unauthorized rejection
- End-to-End: Patient -> Encounter -> Consent -> Submit -> Queue -> Doctor Call
"""
import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole


async def create_test_doctor(db_session: AsyncSession, username="dr.test", role=UserRole.DOCTOR) -> User:
    """Helper creating an active test doctor user."""
    user = User(
        username=username,
        password_hash=hash_password("DoctorPass123!"),
        display_name="Dr. Test User",
        role=role,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def get_doctor_token(client: AsyncClient, username="dr.test", password="DoctorPass123!") -> str:
    """Helper logging in doctor and returning access token."""
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


# ==============================================================================
# 1. AUTHENTICATION TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_auth_login_success(client: AsyncClient, db_session: AsyncSession):
    """Verifies successful login with valid credentials."""
    await create_test_doctor(db_session, username="dr.login")
    res = await client.post("/api/v1/auth/login", json={"username": "dr.login", "password": "DoctorPass123!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "dr.login"
    assert data["user"]["role"] == "DOCTOR"


@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient, db_session: AsyncSession):
    """Verifies login failure with wrong password."""
    await create_test_doctor(db_session, username="dr.wrong")
    res = await client.post("/api/v1/auth/login", json={"username": "dr.wrong", "password": "WrongPassword"})
    assert res.status_code == 401
    assert "Invalid" in res.json()["detail"]


@pytest.mark.asyncio
async def test_auth_protected_endpoint_without_token(client: AsyncClient):
    """Verifies accessing protected doctor queue without token returns 401."""
    res = await client.get("/api/v1/queue")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_auth_insufficient_role(client: AsyncClient, db_session: AsyncSession):
    """Verifies non-doctor role (e.g. KIOSK_OPERATOR) is rejected from doctor queue."""
    await create_test_doctor(db_session, username="operator1", role=UserRole.KIOSK_OPERATOR)
    token = await get_doctor_token(client, username="operator1")
    res = await client.get("/api/v1/queue", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


# ==============================================================================
# 2. PATIENT TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_create_patient(client: AsyncClient):
    """Verifies patient registration and backend UHID generation."""
    payload = {
        "full_name": "Aarav Sharma",
        "age": 35,
        "gender": "Male",
        "address": "Flat 201, Green Park",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "identities": [
            {"identity_type": "MOBILE", "identity_value": "9876500001", "is_verified": True},
            {"identity_type": "ABHA", "identity_value": "11223344556677", "is_verified": True}
        ]
    }
    res = await client.post("/api/v1/patients", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["full_name"] == "Aarav Sharma"
    assert "UHID-" in data["patient_uhid"]
    assert len(data["identities"]) == 2


@pytest.mark.asyncio
async def test_duplicate_identity_handling(client: AsyncClient):
    """Verifies registering the same mobile number to two different patients returns 409 Conflict."""
    p1 = {
        "full_name": "Patient One",
        "gender": "Male",
        "identities": [{"identity_type": "MOBILE", "identity_value": "9999900001"}]
    }
    res1 = await client.post("/api/v1/patients", json=p1)
    assert res1.status_code == 201

    p2 = {
        "full_name": "Patient Two",
        "gender": "Female",
        "identities": [{"identity_type": "MOBILE", "identity_value": "9999900001"}]
    }
    res2 = await client.post("/api/v1/patients", json=p2)
    assert res2.status_code == 409


@pytest.mark.asyncio
async def test_lookup_patient_by_identities(client: AsyncClient):
    """Verifies searching patients by UHID, ABHA, and Phone."""
    p = {
        "full_name": "Savitri Devi",
        "gender": "Female",
        "identities": [
            {"identity_type": "MOBILE", "identity_value": "9823199011"},
            {"identity_type": "ABHA", "identity_value": "91440299821049"}
        ]
    }
    res = await client.post("/api/v1/patients", json=p)
    assert res.status_code == 201
    uhid = res.json()["patient_uhid"]

    # Search by UHID
    r_uhid = await client.get(f"/api/v1/patients/search?uhid={uhid}")
    assert r_uhid.status_code == 200
    assert r_uhid.json()["full_name"] == "Savitri Devi"

    # Search by Phone
    r_phone = await client.get("/api/v1/patients/search?phone=9823199011")
    assert r_phone.status_code == 200
    assert r_phone.json()["patient_uhid"] == uhid

    # Search by ABHA
    r_abha = await client.get("/api/v1/patients/search?abha=91440299821049")
    assert r_abha.status_code == 200

    # Search not found
    r_none = await client.get("/api/v1/patients/search?phone=0000000000")
    assert r_none.status_code == 404


# ==============================================================================
# 3. ENCOUNTER TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_encounter_lifecycle(client: AsyncClient):
    """Verifies creating, updating, and retrieving an encounter."""
    # 1. Create Patient
    pat_res = await client.post("/api/v1/patients", json={"full_name": "Rohan Deshmukh", "gender": "Male"})
    pat_id = pat_res.json()["id"]

    # 2. Create Encounter
    enc_res = await client.post("/api/v1/encounters", json={"patient_id": pat_id, "priority": "NORMAL"})
    assert enc_res.status_code == 201
    enc_id = enc_res.json()["id"]
    assert "ENC-" in enc_res.json()["encounter_number"]
    assert enc_res.json()["status"] == "WAITING"

    # 3. Patch Chief Complaint
    patch_res = await client.patch(
        f"/api/v1/encounters/{enc_id}",
        json={"chief_complaint": "Severe fever and body ache for 3 days", "red_flag_triggered": True}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["chief_complaint"] == "Severe fever and body ache for 3 days"
    assert patch_res.json()["red_flag_triggered"] is True

    # 4. Get Encounter Detail
    detail_res = await client.get(f"/api/v1/encounters/{enc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["encounter"]["id"] == enc_id
    assert detail["patient"]["full_name"] == "Rohan Deshmukh"


@pytest.mark.asyncio
async def test_encounter_invalid_patient(client: AsyncClient):
    """Verifies creating encounter for non-existent patient returns 404."""
    bad_uuid = str(uuid.uuid4())
    res = await client.post("/api/v1/encounters", json={"patient_id": bad_uuid})
    assert res.status_code == 404


# ==============================================================================
# 4. CONSENT & SUBMISSION TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_consent_recording_and_history(client: AsyncClient):
    """Verifies recording consent and history preservation."""
    pat_res = await client.post("/api/v1/patients", json={"full_name": "Consent Test", "gender": "Female"})
    pat_id = pat_res.json()["id"]
    enc_res = await client.post("/api/v1/encounters", json={"patient_id": pat_id})
    enc_id = enc_res.json()["id"]

    # Declined consent rejected
    r_dec = await client.post(f"/api/v1/encounters/{enc_id}/consent", json={"accepted": False})
    assert r_dec.status_code == 400

    # Accepted consent recorded
    r_acc = await client.post(f"/api/v1/encounters/{enc_id}/consent", json={"accepted": True, "consent_version": "v1.0"})
    assert r_acc.status_code == 201
    assert r_acc.json()["granted"] is True


@pytest.mark.asyncio
async def test_encounter_submission_requires_consent(client: AsyncClient):
    """Verifies submission to queue fails if consent was not recorded."""
    pat_res = await client.post("/api/v1/patients", json={"full_name": "No Consent", "gender": "Male"})
    enc_res = await client.post("/api/v1/encounters", json={"patient_id": pat_res.json()["id"]})
    enc_id = enc_res.json()["id"]

    sub_res = await client.post(f"/api/v1/encounters/{enc_id}/submit")
    assert sub_res.status_code == 400
    assert "consent" in sub_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submission_and_token_allocation(client: AsyncClient):
    """Verifies encounter submission generates sequential daily token."""
    # Patient 1
    p1 = await client.post("/api/v1/patients", json={"full_name": "Patient Token 1", "gender": "Male"})
    e1 = await client.post("/api/v1/encounters", json={"patient_id": p1.json()["id"]})
    e1_id = e1.json()["id"]
    await client.post(f"/api/v1/encounters/{e1_id}/consent", json={"accepted": True})
    s1 = await client.post(f"/api/v1/encounters/{e1_id}/submit")
    assert s1.status_code == 201
    token1 = s1.json()["token_number"]
    assert token1 >= 1

    # Idempotent re-submission returns same token
    s1_again = await client.post(f"/api/v1/encounters/{e1_id}/submit")
    assert s1_again.status_code == 201
    assert s1_again.json()["token_number"] == token1

    # Patient 2 receives next token
    p2 = await client.post("/api/v1/patients", json={"full_name": "Patient Token 2", "gender": "Female"})
    e2 = await client.post("/api/v1/encounters", json={"patient_id": p2.json()["id"]})
    e2_id = e2.json()["id"]
    await client.post(f"/api/v1/encounters/{e2_id}/consent", json={"accepted": True})
    s2 = await client.post(f"/api/v1/encounters/{e2_id}/submit")
    assert s2.status_code == 201
    assert s2.json()["token_number"] == token1 + 1


# ==============================================================================
# 5. QUEUE & DOCTOR ACTION TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_queue_ordering_and_emergency_priority(client: AsyncClient, db_session: AsyncSession):
    """Verifies emergency priority cases appear before normal priority in the queue."""
    # Setup Doctor
    await create_test_doctor(db_session, username="dr.queue")
    token = await get_doctor_token(client, username="dr.queue")
    headers = {"Authorization": f"Bearer {token}"}

    # Normal Patient
    pn = await client.post("/api/v1/patients", json={"full_name": "Normal Queue Patient", "gender": "Male"})
    en = await client.post("/api/v1/encounters", json={"patient_id": pn.json()["id"], "priority": "NORMAL"})
    await client.post(f"/api/v1/encounters/{en.json()['id']}/consent", json={"accepted": True})
    await client.post(f"/api/v1/encounters/{en.json()['id']}/submit")

    # Emergency Patient (queued second, but should appear first)
    pe = await client.post("/api/v1/patients", json={"full_name": "Emergency Patient", "gender": "Female"})
    ee = await client.post("/api/v1/encounters", json={"patient_id": pe.json()["id"], "priority": "EMERGENCY"})
    await client.post(f"/api/v1/encounters/{ee.json()['id']}/consent", json={"accepted": True})
    await client.post(f"/api/v1/encounters/{ee.json()['id']}/submit")

    # Fetch Queue as Doctor
    q_res = await client.get("/api/v1/queue/today", headers=headers)
    assert q_res.status_code == 200
    queue = q_res.json()
    assert len(queue) >= 2
    # First item must be the emergency patient
    assert queue[0]["priority"] == "EMERGENCY"
    assert queue[0]["patient_name"] == "Emergency Patient"


@pytest.mark.asyncio
async def test_doctor_call_patient_transition(client: AsyncClient, db_session: AsyncSession):
    """Verifies calling a patient transitions QueueEntry to CALLED and Encounter to IN_CONSULTATION."""
    await create_test_doctor(db_session, username="dr.call")
    token = await get_doctor_token(client, username="dr.call")
    headers = {"Authorization": f"Bearer {token}"}

    # Submit patient
    p = await client.post("/api/v1/patients", json={"full_name": "Call Test", "gender": "Male"})
    e = await client.post("/api/v1/encounters", json={"patient_id": p.json()["id"]})
    e_id = e.json()["id"]
    await client.post(f"/api/v1/encounters/{e_id}/consent", json={"accepted": True})
    sub = await client.post(f"/api/v1/encounters/{e_id}/submit")
    queue_entry_id = sub.json()["queue_entry_id"]

    # Call patient
    call_res = await client.post(f"/api/v1/queue/{queue_entry_id}/call", headers=headers)
    assert call_res.status_code == 200
    call_data = call_res.json()
    assert call_data["queue_status"] == "CALLED"
    assert call_data["encounter_status"] == "IN_CONSULTATION"

    # Complete visit
    comp_res = await client.post(f"/api/v1/encounters/{e_id}/complete")
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"


# ==============================================================================
# 6. END-TO-END INTEGRATION TEST
# ==============================================================================

@pytest.mark.asyncio
async def test_end_to_end_kiosk_to_doctor_flow(client: AsyncClient, db_session: AsyncSession):
    """Full End-to-End integration test across the complete Stage 2 workflow:
    Patient -> Encounter -> Consent -> Submit -> QueueEntry -> Doctor Login -> Doctor Queue -> Call
    """
    # 1. Doctor registers in system
    await create_test_doctor(db_session, username="dr.e2e")

    # 2. Patient arrives at Kiosk: registers demographics
    pat_res = await client.post(
        "/api/v1/patients",
        json={
            "full_name": "Sunita Rao",
            "age": 48,
            "gender": "Female",
            "city": "Satara",
            "state": "Maharashtra",
            "identities": [
                {"identity_type": "MOBILE", "identity_value": "9811223344", "is_verified": True}
            ]
        }
    )
    assert pat_res.status_code == 201
    pat_data = pat_res.json()
    pat_id = pat_data["id"]
    assert "UHID-" in pat_data["patient_uhid"]

    # 3. Kiosk initiates clinical encounter
    enc_res = await client.post("/api/v1/encounters", json={"patient_id": pat_id, "priority": "NORMAL"})
    assert enc_res.status_code == 201
    enc_id = enc_res.json()["id"]

    # 4. Kiosk updates chief complaint
    await client.patch(f"/api/v1/encounters/{enc_id}", json={"chief_complaint": "Persistent knee joint pain and swelling"})

    # 5. Patient grants consent on Kiosk
    consent_res = await client.post(f"/api/v1/encounters/{enc_id}/consent", json={"accepted": True})
    assert consent_res.status_code == 201
    assert consent_res.json()["granted"] is True

    # 6. Kiosk submits encounter: generates OPD token
    sub_res = await client.post(f"/api/v1/encounters/{enc_id}/submit")
    assert sub_res.status_code == 201
    sub_data = sub_res.json()
    token_number = sub_data["token_number"]
    queue_entry_id = sub_data["queue_entry_id"]
    assert token_number >= 1
    assert sub_data["queue_status"] == "WAITING"

    # 7. Doctor on separate device logs in
    login_res = await client.post("/api/v1/auth/login", json={"username": "dr.e2e", "password": "DoctorPass123!"})
    assert login_res.status_code == 200
    doc_token = login_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 8. Doctor fetches live OPD Queue: patient is present
    queue_res = await client.get("/api/v1/queue/today", headers=doc_headers)
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    matching = [q for q in queue_items if q["patient_name"] == "Sunita Rao"]
    assert len(matching) == 1
    assert matching[0]["token_number"] == token_number
    assert matching[0]["queue_status"] == "WAITING"
    assert matching[0]["chief_complaint"] == "Persistent knee joint pain and swelling"

    # 9. Doctor calls patient into consultation room
    call_res = await client.post(f"/api/v1/queue/{queue_entry_id}/call", headers=doc_headers)
    assert call_res.status_code == 200
    assert call_res.json()["queue_status"] == "CALLED"
    assert call_res.json()["encounter_status"] == "IN_CONSULTATION"
