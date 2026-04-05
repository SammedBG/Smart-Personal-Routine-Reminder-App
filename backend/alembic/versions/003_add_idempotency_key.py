"""Add idempotency key to reminders

Revision ID: 003
Revises: 002
Create Date: 2026-04-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reminders", sa.Column("idempotency_key", sa.String(64), nullable=True))
    op.create_index(
        "ix_reminders_idempotency_key",
        "reminders",
        ["idempotency_key"],
        unique=False,
    )
    op.create_index(
        "ix_reminders_user_idempotency_key",
        "reminders",
        ["user_id", "idempotency_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_reminders_user_idempotency_key", table_name="reminders")
    op.drop_index("ix_reminders_idempotency_key", table_name="reminders")
    op.drop_column("reminders", "idempotency_key")
