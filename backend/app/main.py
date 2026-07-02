from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .models import ResumeAnalysis, User, InterviewHistory, ResumeInterviewSession, PracticeQuestion
from .routers import auth, resume, interview, history, users, resume_interview
from .config import settings
from sqlalchemy import inspect
from .database import SessionLocal
from .services.question_bank import QUESTION_BANK

import sys
from sqlalchemy.exc import SQLAlchemyError

# Create database tables with clear error handling
try:
    print(f"Connecting to database and verifying tables... URL: {engine.url.render_as_string(hide_password=True)}")
    Base.metadata.create_all(bind=engine)
    print("Database tables verified/created successfully.")
except SQLAlchemyError as e:
    print("\n" + "="*80)
    print("CRITICAL: DATABASE CONNECTION AND INITIALIZATION FAILED!")
    print(f"Database URL: {engine.url.render_as_string(hide_password=True)}")
    print(f"Error Details: {e}")
    print("Please verify that your PostgreSQL/Supabase database is running and credentials are correct.")
    print("="*80 + "\n")
    raise

# Self-healing database migration for V1.0 specifications
try:
    inspector = inspect(engine)
    if "resume_analysis" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("resume_analysis")]
        if "version" not in columns:
            print("Detected old schema for 'resume_analysis'. Dropping and recreating table with version columns...")
            ResumeAnalysis.__table__.drop(bind=engine)
            # Recreate all tables including new resume_interview_sessions
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("Database tables recreated successfully with new V1.0 columns and models!")
except Exception as e:
    print(f"Self-healing database check encountered a warning: {e}")

# Seed practice questions database if empty
db = SessionLocal()
try:
    if db.query(PracticeQuestion).count() == 0:
        print("Seeding practice questions database...")
        seeded_count = 0
        for topic, q_list in QUESTION_BANK["technical"].items():
            for q_text in q_list:
                db.add(PracticeQuestion(category="technical", topic=topic, question=q_text))
                seeded_count += 1
        for topic, q_list in QUESTION_BANK["hr"].items():
            for q_text in q_list:
                db.add(PracticeQuestion(category="hr", topic=topic, question=q_text))
                seeded_count += 1
        db.commit()
        print(f"Seeded {seeded_count} practice questions successfully!")
except Exception as e:
    db.rollback()
    print(f"Failed to seed practice questions: {e}")
finally:
    db.close()

print("Loaded OLLAMA_API_KEY:", bool(settings.OLLAMA_API_KEY), "OLLAMA_HOST:", settings.OLLAMA_HOST or "Default")

app = FastAPI(
    title="NexPrep AI API",
    description="Backend API for the NexPrep AI Interview Preparation Platform",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ] + settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(history.router)
app.include_router(users.router)
app.include_router(resume_interview.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NexPrep AI API v1.0. The server is running."}
