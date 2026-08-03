"""add salary and visa type

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('salary_min', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('salary_max', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('visa_type', sa.String(length=50), nullable=True))
    op.create_index(op.f('ix_jobs_visa_type'), 'jobs', ['visa_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_jobs_visa_type'), table_name='jobs')
    op.drop_column('jobs', 'visa_type')
    op.drop_column('jobs', 'salary_max')
    op.drop_column('jobs', 'salary_min')
