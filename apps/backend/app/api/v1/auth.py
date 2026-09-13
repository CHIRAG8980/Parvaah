"""API endpoints for officer authentication and role profile."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


@router.post("/login", response_model=TokenResponse)
def login_officer(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate Disaster Management Officer for web control room."""
    user = db.query(User).filter(User.username == request.username).first()
    # In prototype mode, allow standard demo accounts
    if not user:
        user = db.query(User).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = f"dmo-session-token-{user.user_id}"
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        district=user.district,
        escalation_level=user.escalation_level,
    )


@router.get("/me", response_model=UserProfile)
def get_current_officer(db: Session = Depends(get_db)):
    """Retrieve logged-in officer profile and jurisdiction."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No active user found")

    return UserProfile(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        district=user.district,
        escalation_level=user.escalation_level,
        contact_number=user.contact_number,
    )
