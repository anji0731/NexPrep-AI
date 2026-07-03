from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, Token, GoogleLoginRequest
from ..auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from google.oauth2 import id_token
from google.auth.transport import requests
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=dict)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
        }
    }

@router.post("/login", response_model=dict)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    }

@router.post("/swagger-token", response_model=dict, include_in_schema=False)
def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Dedicated endpoint for Swagger UI's Authorize button which uses form-data instead of JSON."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/google", response_model=dict)
def google_login(login_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        if not settings.GOOGLE_CLIENT_ID:
            raise ValueError("Google Client ID is not configured on the server")
            
        idinfo = id_token.verify_oauth2_token(
            login_data.token, requests.Request(), settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=60
        )
        
        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google token did not contain an email")
            
        user = db.query(User).filter(User.email == email).first()
        if not user:
            import secrets
            random_password = secrets.token_urlsafe(32)
            hashed_password = get_password_hash(random_password)
            
            user = User(
                username=name,
                email=email,
                hashed_password=hashed_password,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(data={"sub": user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
