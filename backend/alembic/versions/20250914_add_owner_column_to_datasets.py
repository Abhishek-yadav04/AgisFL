"""
Add owner column to datasets table

Revision ID: 20250914_owner_col
Revises: None
Create Date: 2025-09-14
"""

# Alembic revision identifiers, used by Alembic.
revision = '20250914_owner_col'
down_revision = None
branch_labels = None
depends_on = None
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('datasets', sa.Column('owner', sa.String(length=255), nullable=True))

def downgrade():
    op.drop_column('datasets', 'owner')
