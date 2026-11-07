"""create decision_audits and idempotency_records

Revision ID: 0001_initial
Revises: 
Create Date: 2026-11-06 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'decision_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('booking_id', sa.String(length=6), nullable=False),
        sa.Column('action', sa.String(length=20), nullable=False),
        sa.Column('decision_type', sa.String(length=20), nullable=False),
        sa.Column('relevance', sa.String(length=20), nullable=False),
        sa.Column('policy_version', sa.String(length=40), nullable=True),
        sa.Column('applied_rules', sa.JSON(), nullable=False),
        sa.Column('evidence', sa.JSON(), nullable=False),
        sa.Column('outcome', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_decision_audits_booking_id', 'decision_audits', ['booking_id'])

    op.create_table(
        'idempotency_records',
        sa.Column('key', sa.String(length=64), primary_key=True),
        sa.Column('booking_id', sa.String(length=6), nullable=False),
        sa.Column('request_hash', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('response', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_idempotency_records_booking_id', 'idempotency_records', ['booking_id'])


def downgrade() -> None:
    op.drop_index('ix_idempotency_records_booking_id', table_name='idempotency_records')
    op.drop_table('idempotency_records')
    op.drop_index('ix_decision_audits_booking_id', table_name='decision_audits')
    op.drop_table('decision_audits')
