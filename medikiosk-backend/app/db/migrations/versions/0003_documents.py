"""Add documents table for medical document metadata storage

Revision ID: 0003_documents
Revises: 0002_consultation_records
Create Date: 2026-09-17 13:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0003_documents"
down_revision: Union[str, None] = "0002_consultation_records"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("encounter_id", sa.Uuid(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("document_type", sa.String(length=50), nullable=True),
        sa.Column("processing_status", sa.String(length=50), server_default="UPLOADED", nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index(op.f("ix_documents_patient_id"), "documents", ["patient_id"], unique=False)
    op.create_index(op.f("ix_documents_encounter_id"), "documents", ["encounter_id"], unique=False)
    op.create_index(op.f("ix_documents_storage_key"), "documents", ["storage_key"], unique=True)
    op.create_index(op.f("ix_documents_processing_status"), "documents", ["processing_status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_documents_processing_status"), table_name="documents")
    op.drop_index(op.f("ix_documents_storage_key"), table_name="documents")
    op.drop_index(op.f("ix_documents_encounter_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_patient_id"), table_name="documents")
    op.drop_table("documents")
