"""Add document_extractions table for OCR extraction records

Revision ID: 0004_document_extractions
Revises: 0003_documents
Create Date: 2026-09-19 18:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0004_document_extractions"
down_revision: Union[str, None] = "0003_documents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "document_extractions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("extraction_type", sa.String(length=50), server_default="OCR", nullable=False),
        sa.Column("raw_text", sa.Text(), server_default="", nullable=False),
        sa.Column("page_count", sa.Integer(), server_default="1", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="PENDING", nullable=False),
        sa.Column("engine", sa.String(length=50), server_default="PADDLEOCR", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_document_extractions_document_id"), "document_extractions", ["document_id"], unique=False)
    op.create_index(op.f("ix_document_extractions_extraction_type"), "document_extractions", ["extraction_type"], unique=False)
    op.create_index(op.f("ix_document_extractions_status"), "document_extractions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_document_extractions_status"), table_name="document_extractions")
    op.drop_index(op.f("ix_document_extractions_extraction_type"), table_name="document_extractions")
    op.drop_index(op.f("ix_document_extractions_document_id"), table_name="document_extractions")
    op.drop_table("document_extractions")
