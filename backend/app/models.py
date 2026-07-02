import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    interviews = relationship("InterviewHistory", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    resume_interviews = relationship("ResumeInterviewSession", back_populates="user", cascade="all, delete-orphan")

class InterviewHistory(Base):
    __tablename__ = "interview_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    interview_type = Column(String)  # 'technical' or 'hr'
    topic = Column(String)           # e.g., 'Python', 'React', 'Behavioral'
    question = Column(String)
    user_answer = Column(String)
    score = Column(Float)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    evaluation = Column(JSON)        # Stores the detailed AI response JSON

    user = relationship("User", back_populates="interviews")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Store the entire RAG structured JSON output returned by Gemini/Groq
    raw_analysis_result = Column(JSON)

    # Added columns for Version 1.0 Specifications
    version = Column(Integer, default=1)
    job_description = Column(String, nullable=True)
    ats_score = Column(Integer, default=0)
    interview_readiness = Column(Integer, default=0)

    user = relationship("User", back_populates="resumes")
    resume_interviews = relationship("ResumeInterviewSession", back_populates="resume_analysis", cascade="all, delete-orphan")

class ResumeInterviewSession(Base):
    __tablename__ = "resume_interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    resume_analysis_id = Column(Integer, ForeignKey("resume_analysis.id"))
    job_description = Column(String, nullable=True)
    
    # Pool of 30 generated questions with metadata (Difficulty, Topic, expected_answer, why_selected, etc.)
    question_pool = Column(JSON)
    # The presented/active list of questions
    active_questions = Column(JSON)
    # Mapping of question index (as string) to candidate's answer
    answers = Column(JSON)
    # Detailed individual evaluations for each answered question (score, mistakes, suggestions)
    evaluations = Column(JSON)
    
    current_question_index = Column(Integer, default=0)
    current_difficulty = Column(String, default="medium")  # easy, medium, hard
    
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    # Final compiled report (roadmap, overall scores)
    report = Column(JSON, nullable=True)

    user = relationship("User", back_populates="resume_interviews")
    resume_analysis = relationship("ResumeAnalysis", back_populates="resume_interviews")

class PracticeQuestion(Base):
    __tablename__ = "practice_questions"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)  # 'technical' or 'hr'
    topic = Column(String)     # 'Python', 'React', 'Tell me about yourself', etc.
    question = Column(String)
