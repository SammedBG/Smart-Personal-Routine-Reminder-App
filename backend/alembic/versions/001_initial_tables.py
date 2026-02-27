"""Initial tables: users, reminders, devices

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE reminder_type AS ENUM ('medicine', 'food', 'water', 'sleep', 'custom')")
    op.execute("CREATE TYPE repeat_type AS ENUM ('once', 'daily', 'weekly', 'custom')")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1024), nullable=True),
        sa.Column("reminder_type", postgresql.ENUM("medicine", "food", "water", "sleep", "custom", name="reminder_type", create_type=False), nullable=False),
        sa.Column("time_of_day", sa.Time(), nullable=False),
        sa.Column("repeat_type", postgresql.ENUM("once", "daily", "weekly", "custom", name="repeat_type", create_type=False), nullable=False),
        sa.Column("custom_days", postgresql.JSONB(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("next_trigger_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reminders_user_id", "reminders", ["user_id"], unique=False)
    op.create_index("ix_reminders_next_trigger_at", "reminders", ["next_trigger_at"], unique=False)

    op.create_table(
        "devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("device_id", sa.String(255), nullable=False),
        sa.Column("fcm_token", sa.String(512), nullable=False),
        sa.Column("platform", sa.String(32), nullable=False),
        sa.Column("app_version", sa.String(64), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "device_id", name="uq_devices_user_device"),
    )
    op.create_index("ix_devices_user_id", "devices", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_devices_user_id", table_name="devices")
    op.drop_table("devices")
    op.drop_index("ix_reminders_next_trigger_at", table_name="reminders")
    op.drop_index("ix_reminders_user_id", table_name="reminders")
    op.drop_table("reminders")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS reminder_type CASCADE")
    op.execute("DROP TYPE IF EXISTS repeat_type CASCADE")
