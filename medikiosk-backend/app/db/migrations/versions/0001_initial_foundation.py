"""Initial schema foundation for MediKiosk

Revision ID: 0001_initial_foundation
Revises: 
Create Date: 2026-09-14 03:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_foundation"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("role", sa.String(length=30), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # 2. patients
    op.create_table(
        "patients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_uhid", sa.String(length=30), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(length=20), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("pincode", sa.String(length=10), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("patient_uhid"),
    )
    op.create_index(op.f("ix_patients_patient_uhid"), "patients", ["patient_uhid"], unique=True)

    # 3. patient_identities
    op.create_table(
        "patient_identities",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("identity_type", sa.String(length=20), nullable=False),
        sa.Column("identity_value", sa.String(length=50), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("identity_type", "identity_value", name="uq_patient_identity_type_val"),
    )
    op.create_index(op.f("ix_patient_identities_patient_id"), "patient_identities", ["patient_id"], unique=False)
    op.create_index(op.f("ix_patient_identities_identity_type"), "patient_identities", ["identity_type"], unique=False)
    op.create_index(op.f("ix_patient_identities_identity_value"), "patient_identities", ["identity_value"], unique=False)

    # 4. encounters
    op.create_table(
        "encounters",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("encounter_number", sa.String(length=50), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("chief_complaint", sa.Text(), nullable=True),
        sa.Column("red_flag_triggered", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("registered_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("encounter_number"),
    )
    op.create_index(op.f("ix_encounters_encounter_number"), "encounters", ["encounter_number"], unique=True)
    op.create_index(op.f("ix_encounters_patient_id"), "encounters", ["patient_id"], unique=False)
    op.create_index(op.f("ix_encounters_status"), "encounters", ["status"], unique=False)
    op.create_index(op.f("ix_encounters_priority"), "encounters", ["priority"], unique=False)
    op.create_index(op.f("ix_encounters_red_flag_triggered"), "encounters", ["red_flag_triggered"], unique=False)

    # 5. queue_entries
    op.create_table(
        "queue_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("encounter_id", sa.Uuid(), nullable=False),
        sa.Column("token_number", sa.Integer(), nullable=False),
        sa.Column("queue_status", sa.String(length=30), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("queued_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("called_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_queue_entries_encounter_id"), "queue_entries", ["encounter_id"], unique=False)
    op.create_index(op.f("ix_queue_entries_token_number"), "queue_entries", ["token_number"], unique=False)
    op.create_index(op.f("ix_queue_entries_queue_status"), "queue_entries", ["queue_status"], unique=False)

    # 6. consent_records
    op.create_table(
        "consent_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("encounter_id", sa.Uuid(), nullable=True),
        sa.Column("consent_version", sa.String(length=20), nullable=False),
        sa.Column("granted", sa.Boolean(), nullable=False),
        sa.Column("abdm_sharing", sa.Boolean(), nullable=False),
        sa.Column("voice_recording", sa.Boolean(), nullable=False),
        sa.Column("consented_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_consent_records_patient_id"), "consent_records", ["patient_id"], unique=False)
    op.create_index(op.f("ix_consent_records_encounter_id"), "consent_records", ["encounter_id"], unique=False)

    # 7. hospital_settings
    op.create_table(
        "hospital_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("hospital_name", sa.String(length=100), nullable=False),
        sa.Column("opd_start_time", sa.String(length=10), nullable=False),
        sa.Column("opd_end_time", sa.String(length=10), nullable=False),
        sa.Column("kiosk_enabled", sa.Boolean(), nullable=False),
        sa.Column("ayush_enabled", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("hospital_settings")
    op.drop_table("consent_records")
    op.drop_table("queue_entries")
    op.drop_table("encounters")
    op.drop_table("patient_identities")
    op.drop_table("patients")
    op.drop_table("users")
