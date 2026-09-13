"""API endpoints for user authentication, registration, and profile management."""

import secrets
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


def _extract_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Extract authenticated user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization Bearer header",
        )

    token = authorization[7:].strip()
    # Format: parvaah-token-<user_id> or dmo-session-token-<user_id>
    user_id = None
    for prefix in ("parvaah-token-", "dmo-session-token-"):
        if token.startswith(prefix):
            user_id = token[len(prefix):]
            break

    if not user_id:
        # Check if token itself is user_id
        user = db.query(User).filter(User.user_id == token).first()
        if user:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User session does not exist or has been revoked",
        )
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new officer or citizen account."""
    clean_username = request.username.strip().lower()
    if not clean_username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if not request.password or len(request.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    existing = db.query(User).filter(User.username == clean_username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    user_id = f"usr-{secrets.token_hex(8)}"
    hashed = hash_password(request.password)

    user = User(
        user_id=user_id,
        username=clean_username,
        full_name=request.full_name.strip(),
        role=request.role,
        district=request.district,
        escalation_level=2 if "director" in clean_username or "sdma" in clean_username else 1,
        contact_number=request.contact_number,
        hashed_password=hashed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = f"parvaah-token-{user.user_id}"
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


@router.post("/login", response_model=TokenResponse)
def login_officer(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate officer/user with genuine credential verification."""
    clean_username = request.username.strip().lower()
    user = db.query(User).filter(User.username == clean_username).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = f"parvaah-token-{user.user_id}"
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
def get_current_officer(user: User = Depends(_extract_current_user)):
    """Retrieve logged-in user profile verified from token."""
    return UserProfile(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        district=user.district,
        escalation_level=user.escalation_level,
        contact_number=user.contact_number,
    )


@router.get("/officers", response_model=list[UserProfile])
def list_officers(db: Session = Depends(get_db)):
    """Retrieve list of registered emergency authority officers."""
    users = db.query(User).all()
    return [
        UserProfile(
            user_id=u.user_id,
            username=u.username,
            full_name=u.full_name,
            role=u.role,
            district=u.district,
            escalation_level=u.escalation_level,
            contact_number=u.contact_number,
        )
        for u in users
    ]


@router.post("/officers", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def create_officer(request: RegisterRequest, db: Session = Depends(get_db)):
    """Authorize and register a new official in the emergency directory."""
    clean_username = request.username.strip().lower()
    if not clean_username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(status_code=400, detail="Official username already exists")

    pwd = request.password if request.password else "Gov@Secure2026"
    user = User(
        user_id=f"usr-{secrets.token_hex(6)}",
        username=clean_username,
        full_name=request.full_name.strip(),
        role=request.role,
        district=request.district,
        escalation_level=2 if "director" in clean_username or "sdma" in clean_username else 1,
        contact_number=request.contact_number,
        hashed_password=hash_password(pwd),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserProfile(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        district=user.district,
        escalation_level=user.escalation_level,
        contact_number=user.contact_number,
    )


