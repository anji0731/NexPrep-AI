"""Initial PostgreSQL schema for NexPrep AI

Revision ID: 001_initial_postgres
Revises: 
Create Date: 2026-07-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '001_initial_postgres'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('username', sa.String(), nullable=True),
            sa.Column('email', sa.String(), nullable=True),
            sa.Column('hashed_password', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)

    if 'interview_history' not in existing_tables:
        op.create_table(
            'interview_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('interview_type', sa.String(), nullable=True),
            sa.Column('topic', sa.String(), nullable=True),
            sa.Column('question', sa.String(), nullable=True),
            sa.Column('user_answer', sa.String(), nullable=True),
            sa.Column('score', sa.Float(), nullable=True),
            sa.Column('date', sa.DateTime(), nullable=True),
            sa.Column('evaluation', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_interview_history_id'), 'interview_history', ['id'], unique=False)

    if 'practice_questions' not in existing_tables:
        op.create_table(
            'practice_questions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('category', sa.String(), nullable=True),
            sa.Column('topic', sa.String(), nullable=True),
            sa.Column('question', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_practice_questions_id'), 'practice_questions', ['id'], unique=False)

    if 'resume_analysis' not in existing_tables:
        op.create_table(
            'resume_analysis',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('filename', sa.String(), nullable=True),
            sa.Column('uploaded_at', sa.DateTime(), nullable=True),
            sa.Column('raw_analysis_result', sa.JSON(), nullable=True),
            sa.Column('version', sa.Integer(), nullable=True),
            sa.Column('job_description', sa.String(), nullable=True),
            sa.Column('ats_score', sa.Integer(), nullable=True),
            sa.Column('interview_readiness', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_resume_analysis_id'), 'resume_analysis', ['id'], unique=False)

    if 'resume_interview_sessions' not in existing_tables:
        op.create_table(
            'resume_interview_sessions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('resume_analysis_id', sa.Integer(), nullable=True),
            sa.Column('job_description', sa.String(), nullable=True),
            sa.Column('question_pool', sa.JSON(), nullable=True),
            sa.Column('active_questions', sa.JSON(), nullable=True),
            sa.Column('answers', sa.JSON(), nullable=True),
            sa.Column('evaluations', sa.JSON(), nullable=True),
            sa.Column('current_question_index', sa.Integer(), nullable=True),
            sa.Column('current_difficulty', sa.String(), nullable=True),
            sa.Column('start_time', sa.DateTime(), nullable=True),
            sa.Column('end_time', sa.DateTime(), nullable=True),
            sa.Column('is_completed', sa.Boolean(), nullable=True),
            sa.Column('report', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['resume_analysis_id'], ['resume_analysis.id']),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_resume_interview_sessions_id'), 'resume_interview_sessions', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('resume_interview_sessions')
    op.drop_table('resume_analysis')
    op.drop_table('practice_questions')
    op.drop_table('interview_history')
    op.drop_table('users')
