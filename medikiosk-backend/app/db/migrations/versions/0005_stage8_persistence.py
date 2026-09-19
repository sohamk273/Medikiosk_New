"""Add audit_events and ayush_assessments tables for Stage 8

Revision ID: 0005_stage8_persistence
Revises: 0004_document_extractions
Create Date: 2026-09-19 21:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0005_stage8_persistence"
down_revision: Union[str, None] = "0004_document_extractions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create audit_events table
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("encounter_id", sa.Uuid(), nullable=True),
        sa.Column("patient_id", sa.Uuid(), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.String(length=100), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_events_encounter_id"), "audit_events", ["encounter_id"], unique=False)
    op.create_index(op.f("ix_audit_events_patient_id"), "audit_events", ["patient_id"], unique=False)
    op.create_index(op.f("ix_audit_events_user_id"), "audit_events", ["user_id"], unique=False)
    op.create_index(op.f("ix_audit_events_action"), "audit_events", ["action"], unique=False)
    op.create_index(op.f("ix_audit_events_entity_type"), "audit_events", ["entity_type"], unique=False)
    op.create_index(op.f("ix_audit_events_created_at"), "audit_events", ["created_at"], unique=False)

    # 2. Create ayush_assessments table
    op.create_table(
        "ayush_assessments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("encounter_id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("prakriti_scores", sa.JSON(), nullable=False),
        sa.Column("dominant_prakriti", sa.String(length=50), server_default="Tridoshaja", nullable=False),
        sa.Column("patient_responses", sa.JSON(), nullable=False),
        sa.Column("doctor_assessment", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="COMPLETED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ayush_assessments_encounter_id"), "ayush_assessments", ["encounter_id"], unique=True)
    op.create_index(op.f("ix_ayush_assessments_patient_id"), "ayush_assessments", ["patient_id"], unique=False)
    op.create_index(op.f("ix_ayush_assessments_dominant_prakriti"), "ayush_assessments", ["dominant_prakriti"], unique=False)
    op.create_index(op.f("ix_ayush_assessments_status"), "ayush_assessments", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ayush_assessments_status"), table_name="ayush_assessments")
    op.drop_index(op.f("ix_ayush_assessments_dominant_prakriti"), table_name="ayush_assessments")
    op.drop_index(op.f("ix_ayush_assessments_patient_id"), table_name="ayush_assessments")
    op.drop_index(op.f("ix_ayush_assessments_encounter_id"), table_name="ayush_assessments")
    op.drop_table("ayush_assessments")

    op.drop_index(op.f("ix_audit_events_created_at"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_entity_type"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_action"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_user_id"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_patient_id"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_encounter_id"), table_name="audit_events")
    op.drop_table("audit_events")
