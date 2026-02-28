"""Add completion_records, medicine/exercise details, timezone, start/end dates

Revision ID: 002
Revises: 001
Create Date: 2026-02-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New columns on users
    op.add_column("users", sa.Column("timezone", sa.String(64), nullable=True, server_default="UTC"))

    # New columns on reminders
    op.add_column("reminders", sa.Column("start_date", sa.Date(), nullable=True))
    op.add_column("reminders", sa.Column("end_date", sa.Date(), nullable=True))
    op.add_column("reminders", sa.Column("medicine_details", sa.JSON(), nullable=True))
    op.add_column("reminders", sa.Column("exercise_details", sa.JSON(), nullable=True))

    # Completion records table
    op.create_table(
        "completion_records",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("reminder_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("snoozed_to", sa.DateTime(), nullable=True),
        sa.Column("date_key", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["reminder_id"], ["reminders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_completion_records_reminder_id", "completion_records", ["reminder_id"])
    op.create_index("ix_completion_records_user_id", "completion_records", ["user_id"])
    op.create_index("ix_completion_records_date_key", "completion_records", ["date_key"])


def downgrade() -> None:
    op.drop_index("ix_completion_records_date_key", table_name="completion_records")
    op.drop_index("ix_completion_records_user_id", table_name="completion_records")
    op.drop_index("ix_completion_records_reminder_id", table_name="completion_records")
    op.drop_table("completion_records")

    op.drop_column("reminders", "exercise_details")
    op.drop_column("reminders", "medicine_details")
    op.drop_column("reminders", "end_date")
    op.drop_column("reminders", "start_date")

    op.drop_column("users", "timezone")
