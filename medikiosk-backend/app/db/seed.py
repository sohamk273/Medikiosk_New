"""Development and demonstration database seed script.

Run explicitly via:
    python -m app.db.seed

THIS SCRIPT IS FOR LOCAL DEVELOPMENT AND TESTING ONLY.
Do not execute in production environments.
"""
import asyncio
import sys
from sqlalchemy import select
from app.core.logging import logger
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.hospital_settings import HospitalSettings
from app.models.user import User, UserRole

# Development doctor account credentials
DEV_DOCTOR_USERNAME = "dr.priya"
DEV_DOCTOR_PASSWORD = "DoctorPass123!"
DEV_DOCTOR_NAME = "Dr. Priya Sharma, MD (Ayu)"


async def seed_development_data():
    """Seeds hospital settings and a test doctor account."""
    logger.info("Starting development database seeding...")
    async with AsyncSessionLocal() as db:
        # 1. Ensure HospitalSettings row 1 exists
        settings_query = select(HospitalSettings).where(HospitalSettings.id == 1)
        res = await db.execute(settings_query)
        hospital_row = res.scalar_one_or_none()

        if not hospital_row:
            hospital_row = HospitalSettings(
                id=1,
                hospital_name="MediKiosk District Hospital OPD",
                opd_start_time="09:00",
                opd_end_time="17:00",
                kiosk_enabled=True,
                ayush_enabled=True,
            )
            db.add(hospital_row)
            await db.flush()
            logger.info("Created default HospitalSettings (id=1).")
        else:
            logger.info("HospitalSettings (id=1) already present.")

        # 2. Ensure Development Doctor user exists
        user_query = select(User).where(User.username == DEV_DOCTOR_USERNAME)
        res_user = await db.execute(user_query)
        doctor_user = res_user.scalar_one_or_none()

        if not doctor_user:
            hashed = hash_password(DEV_DOCTOR_PASSWORD)
            doctor_user = User(
                username=DEV_DOCTOR_USERNAME,
                password_hash=hashed,
                display_name=DEV_DOCTOR_NAME,
                role=UserRole.DOCTOR,
                is_active=True,
            )
            db.add(doctor_user)
            await db.commit()
            logger.info(
                "Created development doctor account: '%s' with password '%s'",
                DEV_DOCTOR_USERNAME,
                DEV_DOCTOR_PASSWORD,
            )
        else:
            logger.info("Development doctor account '%s' already exists.", DEV_DOCTOR_USERNAME)

    print("\n========================================================")
    print("MEDIKIOSK DEVELOPMENT SEED COMPLETE")
    print(f"Doctor Username: {DEV_DOCTOR_USERNAME}")
    print(f"Doctor Password: {DEV_DOCTOR_PASSWORD}")
    print(f"Role:            {UserRole.DOCTOR.value}")
    print("========================================================\n")


if __name__ == "__main__":
    asyncio.run(seed_development_data())
