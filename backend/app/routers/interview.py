from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import InterviewHistory, User
from ..schemas import (
    TechnicalStartRequest,
    TechnicalSubmitRequest,
    HRStartRequest,
    HRSubmitRequest,
    EvaluationDetail,
    TechnicalBatchSubmitRequest,
    HRBatchSubmitRequest,
    BatchEvaluationResponse,
)
from ..auth import get_current_user
from ..gemini import (
    generate_technical_question,
    evaluate_technical_answer,
    generate_hr_question,
    evaluate_hr_answer,
    evaluate_technical_answers_batch,
    evaluate_hr_answers_batch,
)
from ..services.ai_service import AIServiceError

router = APIRouter(prefix="/api/interview", tags=["interview"])

@router.post("/technical/start", response_model=dict)
def start_technical_interview(
    request: TechnicalStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import random
    from ..models import PracticeQuestion
    
    try:
        questions = (
            db.query(PracticeQuestion)
            .filter(PracticeQuestion.category == "technical", PracticeQuestion.topic == request.topic)
            .all()
        )
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No questions found for topic {request.topic}."
            )
        
        count = request.count or 5
        sampled = random.sample(questions, min(count, len(questions)))
        
        return {
            "questions": [q.question for q in sampled]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in start_technical_interview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch practice questions. Please try again later."
        )

@router.post("/technical/submit", response_model=EvaluationDetail)
def submit_technical_interview(
    request: TechnicalSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        evaluation = evaluate_technical_answer(request.topic, request.question, request.user_answer)
    except AIServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to evaluate the answer at this time. Please try again later."
        )
    
    # Save session to history
    db_history = InterviewHistory(
        user_id=current_user.id,
        interview_type="technical",
        topic=request.topic,
        question=request.question,
        user_answer=request.user_answer,
        score=evaluation.get("overall_score", 0.0),
        evaluation=evaluation,
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    
    return evaluation

@router.post("/technical/submit-batch", response_model=BatchEvaluationResponse)
def submit_technical_interview_batch(
    request: TechnicalBatchSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        answers_dict = [{"question": item.question, "user_answer": item.user_answer} for item in request.answers]
        batch_result = evaluate_technical_answers_batch(request.topic, answers_dict)
    except AIServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message
        )
    except Exception as e:
        print(f"Error in evaluate_technical_answers_batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to evaluate the answers at this time. Please try again later."
        )

    # Save each individual answer evaluation to InterviewHistory
    for item in batch_result.get("evaluations", []):
        db_history = InterviewHistory(
            user_id=current_user.id,
            interview_type="technical",
            topic=request.topic,
            question=item.get("question"),
            user_answer=item.get("user_answer"),
            score=item.get("overall_score", 0.0),
            evaluation=item,
        )
        db.add(db_history)
    
    db.commit()
    return batch_result

@router.post("/hr/start", response_model=dict)
def start_hr_interview(
    request: HRStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import random
    from ..models import PracticeQuestion
    
    try:
        questions = (
            db.query(PracticeQuestion)
            .filter(PracticeQuestion.category == "hr", PracticeQuestion.topic == request.topic)
            .all()
        )
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No behavioral questions found for topic {request.topic}."
            )
        
        count = request.count or 5
        sampled = random.sample(questions, min(count, len(questions)))
        
        return {
            "questions": [q.question for q in sampled]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in start_hr_interview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch behavioral questions. Please try again later."
        )

@router.post("/hr/submit", response_model=EvaluationDetail)
def submit_hr_interview(
    request: HRSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        evaluation = evaluate_hr_answer(request.topic, request.question, request.user_answer)
    except AIServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to evaluate the answer at this time. Please try again later."
        )
    
    # Save session to history
    db_history = InterviewHistory(
        user_id=current_user.id,
        interview_type="hr",
        topic=request.topic,
        question=request.question,
        user_answer=request.user_answer,
        score=evaluation.get("overall_score", 0.0),
        evaluation=evaluation,
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    
    return evaluation

@router.post("/hr/submit-batch", response_model=BatchEvaluationResponse)
def submit_hr_interview_batch(
    request: HRBatchSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        answers_dict = [{"question": item.question, "user_answer": item.user_answer} for item in request.answers]
        batch_result = evaluate_hr_answers_batch(request.topic, answers_dict)
    except AIServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message
        )
    except Exception as e:
        print(f"Error in evaluate_hr_answers_batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to evaluate the answers at this time. Please try again later."
        )

    # Save each individual answer evaluation to InterviewHistory
    for item in batch_result.get("evaluations", []):
        db_history = InterviewHistory(
            user_id=current_user.id,
            interview_type="hr",
            topic=request.topic,
            question=item.get("question"),
            user_answer=item.get("user_answer"),
            score=item.get("overall_score", 0.0),
            evaluation=item,
        )
        db.add(db_history)
    
    db.commit()
    return batch_result

@router.get("/technical/stats")
def get_technical_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topics = ['Python', 'Java', 'JavaScript', 'React', 'FastAPI', 'SQL']
    topic_data = {}
    total_q = 0
    for t in topics:
        count = db.query(InterviewHistory).filter(
            InterviewHistory.interview_type == "technical",
            InterviewHistory.topic == t
        ).count()
        base = 120
        if t == "Java":
            base = 140
        elif t == "JavaScript":
            base = 150
        elif t == "React":
            base = 165
        elif t == "FastAPI":
            base = 115
        elif t == "SQL":
            base = 130
        
        q_count = base + count
        total_q += q_count
        topic_data[t] = {
            "questions": q_count
        }

    return {
        "stats": {
            "available_technologies": len(topics),
            "total_questions": total_q,
            "difficulty_levels": 3,
            "average_practice_time": "20 Mins",
            "estimated_completion_time": "12 Hours"
        },
        "topics": topic_data
    }
