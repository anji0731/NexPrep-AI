from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Any

from ..database import get_db
from ..models import ResumeInterviewSession, ResumeAnalysis, User
from ..schemas import (
    ResumeInterviewStartRequest,
    ResumeInterviewSessionResponse,
    ResumeInterviewAnswerRequest,
    ResumeInterviewAnswerResponse,
)
from ..auth import get_current_user
from ..services.question_generator import QuestionGenerator
from ..services.interview_evaluator import InterviewEvaluator
from ..services.roadmap_generator import RoadmapGenerator

router = APIRouter(prefix="/api/resume-interview", tags=["resume-interview"])

@router.post("/start", response_model=ResumeInterviewSessionResponse)
def start_resume_interview(
    request: ResumeInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve Resume Analysis
    resume_analysis = None
    if request.resume_analysis_id is not None:
        resume_analysis = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.id == request.resume_analysis_id, ResumeAnalysis.user_id == current_user.id)
            .first()
        )

    if resume_analysis is None:
        # Fall back to the latest successful resume analysis for this user.
        resume_analysis = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.user_id == current_user.id)
            .order_by(ResumeAnalysis.version.desc(), ResumeAnalysis.uploaded_at.desc())
            .first()
        )

    if not resume_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume analysis not found. Please upload and analyze a resume first."
        )
    
    # Formulate rich resume context from RAG details stored in database
    rag_data = resume_analysis.raw_analysis_result
    if not isinstance(rag_data, dict):
        rag_data = {}
    
    # Retrieve persisted chunks from database
    retrieved_resume = rag_data.get("retrieved_resume_chunks", [])
    retrieved_jd = rag_data.get("retrieved_jd_chunks", [])
    
    if retrieved_resume:
        resume_context = "\n---\n".join(retrieved_resume)
    else:
        # Fallback for older cached history records
        resume_context = f"""
        Filename: {resume_analysis.filename}
        Summary: {rag_data.get('profile_summary', '')}
        Strengths: {', '.join(rag_data.get('strengths', []))}
        Gaps/Weaknesses: {', '.join(rag_data.get('weaknesses', []))}
        Technical Stack Feedback: {', '.join(rag_data.get('technical_feedback', []))}
        Keyword Coverage Feedback: {', '.join(rag_data.get('keyword_analysis', []))}
        Skills Matched: {', '.join(rag_data.get('skills_matched', []))}
        """
        
    if retrieved_jd:
        jd_context_text = "\n---\n".join(retrieved_jd)
    else:
        # Fallback to request job_description or database cached string
        jd_context_text = request.job_description or resume_analysis.job_description or ""
    
    # Generate pool of 10 adaptive questions using resume + JD-aware metadata
    question_pool = QuestionGenerator.generate_question_pool(
        resume_context=resume_context,
        job_description=jd_context_text,
        analysis_data=rag_data
    )
    
    if not question_pool:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate interview questions. Please try again."
        )
    
    # Select the first question of medium difficulty
    medium_questions = [q for q in question_pool if q["difficulty"] == "medium"]
    first_question = medium_questions[0] if medium_questions else question_pool[0]

    def serialize_question(question: dict[str, Any]) -> dict[str, Any]:
        return {
            "question": question.get("question", ""),
            "difficulty": question.get("difficulty", "medium"),
            "topic": question.get("topic", question.get("category", "General")),
            "reference": question.get("resume_reference", ""),
            "why_selected": question.get("why_selected", f"Selected based on {question.get('resume_reference', 'your resume')}."),
            "estimated_time": int(question.get("estimated_time", question.get("time_limit", 120))),
        }
    
    question_payloads = [serialize_question(q) for q in question_pool]
    first_payload = serialize_question(first_question)
    
    # Create session in database
    db_session = ResumeInterviewSession(
        user_id=current_user.id,
        resume_analysis_id=resume_analysis.id,
        job_description=request.job_description,
        question_pool=question_pool,
        active_questions=[first_question],
        answers={},
        evaluations={},
        current_question_index=0,
        current_difficulty=first_question["difficulty"],
        start_time=datetime.utcnow(),
        is_completed=False
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return {
        "id": db_session.id,
        "session_id": db_session.id,
        "current_question_index": 0,
        "total_questions": len(question_pool),
        "questions": question_payloads,
        "question": first_payload["question"],
        "difficulty": first_payload["difficulty"],
        "topic": first_payload["topic"],
        "reference": first_payload["reference"],
        "why_selected": first_payload["why_selected"],
        "estimated_time": first_payload["estimated_time"],
        "is_completed": False
    }

@router.post("/{session_id}/answer", response_model=ResumeInterviewAnswerResponse)
def submit_interview_answer(
    session_id: int,
    request: ResumeInterviewAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(ResumeInterviewSession)
        .filter(ResumeInterviewSession.id == session_id, ResumeInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume interview session not found."
        )
    
    if session.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This interview session is already completed."
        )
    
    current_idx = session.current_question_index

    # Check if this is an autosave (draft save)
    if request.question_index is None:
        answers = dict(session.answers or {})
        answers[str(current_idx)] = request.answer
        session.answers = answers
        db.commit()
        return {
            "success": True,
            "current_question_index": current_idx,
            "next_question": None,
            "is_completed": session.is_completed
        }

    target_idx = request.question_index

    if target_idx < 0 or target_idx >= len(session.active_questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question index."
        )

    idx_str = str(target_idx)
    answers = dict(session.answers or {})
    answers[idx_str] = request.answer
    session.answers = answers

    current_question = session.active_questions[target_idx]
    expected_answer = current_question.get("expected_answer") or "Please provide a complete response that clearly addresses the question and technical context."
    evaluation = InterviewEvaluator.evaluate_answer_on_the_fly(
        question_text=current_question["question"],
        expected_answer=expected_answer,
        user_answer=request.answer
    )

    evaluations = dict(session.evaluations or {})
    evaluations[idx_str] = evaluation
    session.evaluations = evaluations

    if target_idx != current_idx:
        db.commit()
        current_q = session.active_questions[current_idx]
        next_payload = {
            "question": current_q["question"],
            "difficulty": current_q["difficulty"],
            "topic": current_q["topic"],
            "reference": current_q["resume_reference"],
            "why_selected": current_q["why_selected"],
            "estimated_time": current_q["estimated_time"]
        }
        return {
            "success": True,
            "current_question_index": current_idx,
            "next_question": next_payload,
            "is_completed": session.is_completed
        }

    # Determine adaptive next difficulty based on score
    score = evaluation["score"]
    curr_diff = session.current_difficulty
    next_diff = curr_diff

    if score >= 7.0:
        if curr_diff == "easy":
            next_diff = "medium"
        elif curr_diff == "medium":
            next_diff = "hard"
    elif score <= 4.0:
        if curr_diff == "hard":
            next_diff = "medium"
        elif curr_diff == "medium":
            next_diff = "easy"

    session.current_difficulty = next_diff
    
    total_active_limit = len(session.question_pool)
    next_idx = current_idx + 1
    
    if next_idx >= total_active_limit:
        session.is_completed = True
        db.commit()
        return {
            "success": True,
            "current_question_index": current_idx,
            "next_question": None,
            "is_completed": True
        }
    
    # Select next question from pool of 30 that is NOT yet active
    active_ids = {q["id"] for q in session.active_questions}
    pool = session.question_pool
    
    candidates = [q for q in pool if q["id"] not in active_ids and q["difficulty"] == next_diff]
    if not candidates:
        candidates = [q for q in pool if q["id"] not in active_ids]
        
    if not candidates:
        session.is_completed = True
        db.commit()
        return {
            "success": True,
            "current_question_index": current_idx,
            "next_question": None,
            "is_completed": True
        }

    next_question = candidates[0]
    active_questions = list(session.active_questions or [])
    active_questions.append(next_question)
    session.active_questions = active_questions
    session.current_question_index = next_idx
    
    db.commit()
    
    # Clean output payload
    next_payload = {
        "question": next_question["question"],
        "difficulty": next_question["difficulty"],
        "topic": next_question["topic"],
        "reference": next_question["resume_reference"],
        "why_selected": next_question["why_selected"],
        "estimated_time": next_question["estimated_time"]
    }
    
    return {
        "success": True,
        "current_question_index": next_idx,
        "next_question": next_payload,
        "is_completed": False
    }

@router.post("/{session_id}/submit", response_model=dict)
def submit_and_compile_report(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(ResumeInterviewSession)
        .filter(ResumeInterviewSession.id == session_id, ResumeInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume interview session not found."
        )
    
    # Allow submissions even if not completed questions, but evaluate all answered
    session.is_completed = True
    session.end_time = datetime.utcnow()
    
    # Ensure there are evaluations for the answered questions
    answered_evals = {}
    for idx_str, ans_text in session.answers.items():
        if idx_str not in session.evaluations:
            # Evaluate missing on submission
            q_idx = int(idx_str)
            q = session.active_questions[q_idx]
            answered_evals[idx_str] = InterviewEvaluator.evaluate_answer_on_the_fly(
                question_text=q["question"],
                expected_answer=q["expected_answer"],
                user_answer=ans_text
            )
        else:
            answered_evals[idx_str] = session.evaluations[idx_str]
            
    if answered_evals:
        session.evaluations = answered_evals
        
    # Compile final score report
    report_data = InterviewEvaluator.compile_final_report(
        active_questions=session.active_questions,
        answers=session.answers,
        evaluations=session.evaluations
    )
    
    # Generate personalized Roadmap
    roadmap = RoadmapGenerator.generate_roadmap(
        weak_topics=report_data.get("weak_topics", []),
        strong_topics=report_data.get("strong_topics", []),
        recruiter_summary=report_data.get("recruiter_summary", "")
    )
    
    # Compile everything into final report
    report_data["roadmap"] = roadmap
    
    # Incorporate detailed question-wise audit inside report payload
    question_audits = []
    for idx, q in enumerate(session.active_questions):
        idx_str = str(idx)
        ans = session.answers.get(idx_str, "No response provided.")
        ev = session.evaluations.get(idx_str, {"score": 0.0, "mistakes": ["Omitted answer."], "suggestions": ["Provide a response."] })
        question_audits.append({
            "id": idx + 1,
            "question": q["question"],
            "topic": q["topic"],
            "difficulty": q["difficulty"],
            "expected_answer": q["expected_answer"],
            "user_answer": ans,
            "score": ev.get("score", 0.0),
            "mistakes": ev.get("mistakes", []),
            "suggestions": ev.get("suggestions", []),
            "better_answer": ev.get("better_answer", q["expected_answer"])
        })
        
    report_data["question_audits"] = question_audits
    session.report = report_data
    
    db.commit()
    
    return report_data

@router.get("/history", response_model=list[dict])
def get_resume_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(ResumeInterviewSession)
        .filter(ResumeInterviewSession.user_id == current_user.id, ResumeInterviewSession.is_completed == True)
        .order_by(ResumeInterviewSession.start_time.desc())
        .all()
    )
    
    result = []
    for s in sessions:
        report_data = s.report or {}
        result.append({
            "id": s.id,
            "date": s.start_time.strftime("%b %d, %Y"),
            "ats_score": s.resume_analysis.ats_score if s.resume_analysis else 0,
            "filename": s.resume_analysis.filename if s.resume_analysis else "Resume.pdf",
            "overall_readiness": report_data.get("overall_readiness", 0.0),
            "technical_score": report_data.get("technical_score", 0.0),
            "communication_score": report_data.get("communication_score", 0.0),
            "problem_solving_score": report_data.get("problem_solving_score", 0.0)
        })
    return result

@router.get("/{session_id}", response_model=dict)
def get_session_status(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(ResumeInterviewSession)
        .filter(ResumeInterviewSession.id == session_id, ResumeInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )
        
    # Construct response status payload
    current_idx = session.current_question_index
    current_q = session.active_questions[current_idx] if not session.is_completed and current_idx < len(session.active_questions) else None
    
    return {
        "session_id": session.id,
        "current_question_index": current_idx,
        "total_questions": len(session.question_pool),
        "is_completed": session.is_completed,
        "current_difficulty": session.current_difficulty,
        "current_question": {
            "question": current_q["question"] if current_q else "",
            "difficulty": current_q["difficulty"] if current_q else "",
            "topic": current_q["topic"] if current_q else "",
            "reference": current_q["resume_reference"] if current_q else "",
            "why_selected": current_q["why_selected"] if current_q else "",
            "estimated_time": current_q["estimated_time"] if current_q else 0
        } if current_q else None,
        "active_questions": session.active_questions,
        "answers": session.answers,
        "report": session.report
    }
