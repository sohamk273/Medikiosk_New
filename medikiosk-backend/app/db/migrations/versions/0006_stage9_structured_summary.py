"""Add structured_summary JSON column to clinical_cases for Stage 9

Revision ID: 0006_stage9_structured_summary
Revises: 0005_stage8_persistence
Create Date: 2026-09-19 23:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0006_stage9_structured_summary"
down_revision: Union[str, None] = "0005_stage8_persistence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "clinical_cases",
        sa.Column("structured_summary", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clinical_cases", "structured_summary")
