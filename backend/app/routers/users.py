from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Any

from ..database import get_db
from ..models import InterviewHistory, ResumeInterviewSession, User
from ..schemas import StatsResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/stats", response_model=StatsResponse)
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch standard mock interviews
    interviews = (
        db.query(InterviewHistory)
        .filter(InterviewHistory.user_id == current_user.id)
        .order_by(InterviewHistory.date.desc())
        .all()
    )
    
    # 2. Fetch completed resume interview sessions
    resume_sessions = (
        db.query(ResumeInterviewSession)
        .filter(ResumeInterviewSession.user_id == current_user.id, ResumeInterviewSession.is_completed == True)
        .order_by(ResumeInterviewSession.start_time.desc())
        .all()
    )
    
    total_interviews = len(interviews) + len(resume_sessions)
    
    # Calculate score metrics (scaled out of 10)
    score_sum = 0.0
    latest_item = None
    latest_date = None
    
    activities = []
    
    # Process standard interviews
    for item in interviews:
        score_sum += item.score
        activities.append({
            "date": item.date,
            "score": item.score,
            "type": item.interview_type.capitalize()
        })
        if latest_date is None or item.date > latest_date:
            latest_date = item.date
            latest_item = {
                "id": item.id,
                "interview_type": item.interview_type,
                "topic": item.topic,
                "score": item.score,
                "date": item.date.strftime("%Y-%m-%d %H:%M")
            }
            
    # Process resume sessions
    for session in resume_sessions:
        report_data = session.report or {}
        # overall_readiness is 0-100, scale to 0-10 for average calculation
        readiness_score = float(report_data.get("overall_readiness", 0.0)) / 10.0
        score_sum += readiness_score
        activities.append({
            "date": session.start_time,
            "score": readiness_score,
            "type": "Resume RAG"
        })
        if latest_date is None or session.start_time > latest_date:
            latest_date = session.start_time
            latest_item = {
                "id": session.id,
                "interview_type": "resume",
                "topic": session.resume_analysis.filename if session.resume_analysis else "Resume Analysis",
                "score": readiness_score,
                "date": session.start_time.strftime("%Y-%m-%d %H:%M")
            }
            
    if total_interviews > 0:
        average_score = round(score_sum / total_interviews, 1)
    else:
        average_score = 0.0
        
    # Sort activities by date descending
    activities.sort(key=lambda x: x["date"], reverse=True)
    
    # Format activities list
    recent_activity = []
    for act in activities[:5]:
        recent_activity.append({
            "date": act["date"].strftime("%b %d, %Y"),
            "score": act["score"],
            "type": act["type"]
        })
        
    return {
        "total_interviews": total_interviews,
        "average_score": average_score,
        "latest_interview": latest_item,
        "recent_activity": recent_activity
    }
