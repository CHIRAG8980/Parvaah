"""Pydantic schemas for authentication and officer profile."""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Credentials for officer authentication."""

    username: str
    password: str


class TokenResponse(BaseModel):
    """JWT / Bearer token payload for web dashboard."""

    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str
    role: str
    district: str | None = None
    escalation_level: int = 1


class UserProfile(BaseModel):
    """Disaster Management Officer profile schema."""

    user_id: str
    username: str
    full_name: str
    role: str
    district: str | None = None
    escalation_level: int
    contact_number: str | None = None
