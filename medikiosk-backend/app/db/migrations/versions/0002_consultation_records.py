"""Add consultation_records table for physician consultation workflow

Revision ID: 0002_consultation_records
Revises: 0001_initial_foundation
Create Date: 2026-09-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0002_consultation_records"
down_revision: Union[str, None] = "0001_initial_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consultation_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("encounter_id", sa.Uuid(), nullable=False),
        sa.Column("doctor_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="DRAFT", nullable=False),
        sa.Column("findings", sa.Text(), nullable=True),
        sa.Column("assessment", sa.Text(), nullable=True),
        sa.Column("diagnosis", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("prescription", sa.JSON(), nullable=True),
        sa.Column("follow_up", sa.JSON(), nullable=True),
        sa.Column("ayush_assessment", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("encounter_id"),
    )
    op.create_index(op.f("ix_consultation_records_encounter_id"), "consultation_records", ["encounter_id"], unique=True)
    op.create_index(op.f("ix_consultation_records_doctor_id"), "consultation_records", ["doctor_id"], unique=False)
    op.create_index(op.f("ix_consultation_records_status"), "consultation_records", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_consultation_records_status"), table_name="consultation_records")
    op.drop_index(op.f("ix_consultation_records_doctor_id"), table_name="consultation_records")
    op.drop_index(op.f("ix_consultation_records_encounter_id"), table_name="consultation_records")
    op.drop_table("consultation_records")
