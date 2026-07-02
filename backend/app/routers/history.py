from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import InterviewHistory, User
from ..schemas import InterviewHistoryResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("", response_model=list[InterviewHistoryResponse])
def get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = (
        db.query(InterviewHistory)
        .filter(InterviewHistory.user_id == current_user.id)
        .order_by(InterviewHistory.date.desc())
        .all()
    )
    return history

@router.delete("/{history_id}", response_model=dict)
def delete_interview_history(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history_item = (
        db.query(InterviewHistory)
        .filter(InterviewHistory.id == history_id, InterviewHistory.user_id == current_user.id)
        .first()
    )
    if not history_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview history not found"
        )
    
    db.delete(history_item)
    db.commit()
    return {"message": "Interview history deleted successfully"}
