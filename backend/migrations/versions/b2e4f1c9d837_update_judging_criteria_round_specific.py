"""update_judging_criteria_round_specific

Revision ID: b2e4f1c9d837
Revises: ad96a3a74053
Create Date: 2026-09-30 15:17:00.000000

Changes:
  - Remove old shared criteria columns: qa_score, innovation_score, execution_score
    and their check constraints.
  - Add Round 1 criteria columns:
      innovation_creativity_score, technical_implementation_score, ui_ux_score,
      impact_scope_score, research_development_score
  - Add Round 2 criteria columns:
      project_completeness_score, deployment_github_score, qa_score,
      testing_prototype_score, documentation_score
  - Update check constraints:
      - Per-column 0-10 range checks for all 10 new criteria
      - Round-conditional total_score check
  - total_score column retained (still computed server-side, now per-round formula)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2e4f1c9d837'
down_revision: Union[str, Sequence[str], None] = 'ad96a3a74053'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Replace old 3-criteria columns with 10 round-specific criteria columns."""

    # ── 1. Drop old check constraints ────────────────────────────────────────
    op.drop_constraint('ck_qa_score', 'scores', type_='check')
    op.drop_constraint('ck_innovation_score', 'scores', type_='check')
    op.drop_constraint('ck_execution_score', 'scores', type_='check')
    op.drop_constraint('ck_total_score', 'scores', type_='check')

    # ── 2. Drop old criteria columns ─────────────────────────────────────────
    op.drop_column('scores', 'qa_score')
    op.drop_column('scores', 'innovation_score')
    op.drop_column('scores', 'execution_score')

    # ── 3. Add Round 1 criteria columns ──────────────────────────────────────
    op.add_column('scores', sa.Column('innovation_creativity_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('technical_implementation_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('ui_ux_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('impact_scope_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('research_development_score', sa.Integer(), nullable=False, server_default='0'))

    # ── 4. Add Round 2 criteria columns ──────────────────────────────────────
    op.add_column('scores', sa.Column('project_completeness_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('deployment_github_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('qa_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('testing_prototype_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('documentation_score', sa.Integer(), nullable=False, server_default='0'))

    # ── 5. Add new per-column range check constraints ─────────────────────────
    # Round 1
    op.create_check_constraint(
        'ck_innovation_creativity_score', 'scores',
        'innovation_creativity_score >= 0 AND innovation_creativity_score <= 10'
    )
    op.create_check_constraint(
        'ck_technical_implementation_score', 'scores',
        'technical_implementation_score >= 0 AND technical_implementation_score <= 10'
    )
    op.create_check_constraint(
        'ck_ui_ux_score', 'scores',
        'ui_ux_score >= 0 AND ui_ux_score <= 10'
    )
    op.create_check_constraint(
        'ck_impact_scope_score', 'scores',
        'impact_scope_score >= 0 AND impact_scope_score <= 10'
    )
    op.create_check_constraint(
        'ck_research_development_score', 'scores',
        'research_development_score >= 0 AND research_development_score <= 10'
    )
    # Round 2
    op.create_check_constraint(
        'ck_project_completeness_score', 'scores',
        'project_completeness_score >= 0 AND project_completeness_score <= 10'
    )
    op.create_check_constraint(
        'ck_deployment_github_score', 'scores',
        'deployment_github_score >= 0 AND deployment_github_score <= 10'
    )
    op.create_check_constraint(
        'ck_qa_score', 'scores',
        'qa_score >= 0 AND qa_score <= 10'
    )
    op.create_check_constraint(
        'ck_testing_prototype_score', 'scores',
        'testing_prototype_score >= 0 AND testing_prototype_score <= 10'
    )
    op.create_check_constraint(
        'ck_documentation_score', 'scores',
        'documentation_score >= 0 AND documentation_score <= 10'
    )

    # ── 6. Add round-conditional total_score check constraint ─────────────────
    op.create_check_constraint(
        'ck_total_score', 'scores',
        """
        (round = 1 AND total_score = innovation_creativity_score + technical_implementation_score + ui_ux_score + impact_scope_score + research_development_score)
        OR
        (round = 2 AND total_score = project_completeness_score + deployment_github_score + qa_score + testing_prototype_score + documentation_score)
        """
    )


def downgrade() -> None:
    """Revert to original 3-criteria schema (qa_score, innovation_score, execution_score)."""

    # ── 1. Drop new check constraints ─────────────────────────────────────────
    op.drop_constraint('ck_total_score', 'scores', type_='check')
    op.drop_constraint('ck_documentation_score', 'scores', type_='check')
    op.drop_constraint('ck_testing_prototype_score', 'scores', type_='check')
    op.drop_constraint('ck_qa_score', 'scores', type_='check')
    op.drop_constraint('ck_deployment_github_score', 'scores', type_='check')
    op.drop_constraint('ck_project_completeness_score', 'scores', type_='check')
    op.drop_constraint('ck_research_development_score', 'scores', type_='check')
    op.drop_constraint('ck_impact_scope_score', 'scores', type_='check')
    op.drop_constraint('ck_ui_ux_score', 'scores', type_='check')
    op.drop_constraint('ck_technical_implementation_score', 'scores', type_='check')
    op.drop_constraint('ck_innovation_creativity_score', 'scores', type_='check')

    # ── 2. Drop new criteria columns ──────────────────────────────────────────
    op.drop_column('scores', 'documentation_score')
    op.drop_column('scores', 'testing_prototype_score')
    op.drop_column('scores', 'qa_score')
    op.drop_column('scores', 'deployment_github_score')
    op.drop_column('scores', 'project_completeness_score')
    op.drop_column('scores', 'research_development_score')
    op.drop_column('scores', 'impact_scope_score')
    op.drop_column('scores', 'ui_ux_score')
    op.drop_column('scores', 'technical_implementation_score')
    op.drop_column('scores', 'innovation_creativity_score')

    # ── 3. Restore original criteria columns ──────────────────────────────────
    op.add_column('scores', sa.Column('qa_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('innovation_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('scores', sa.Column('execution_score', sa.Integer(), nullable=False, server_default='0'))

    # ── 4. Restore original check constraints ─────────────────────────────────
    op.create_check_constraint(
        'ck_qa_score', 'scores',
        'qa_score >= 0 AND qa_score <= 10'
    )
    op.create_check_constraint(
        'ck_innovation_score', 'scores',
        'innovation_score >= 0 AND innovation_score <= 10'
    )
    op.create_check_constraint(
        'ck_execution_score', 'scores',
        'execution_score >= 0 AND execution_score <= 10'
    )
    op.create_check_constraint(
        'ck_total_score', 'scores',
        'total_score = qa_score + innovation_score + execution_score'
    )
