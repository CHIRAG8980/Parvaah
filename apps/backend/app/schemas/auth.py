"""Pydantic schemas for production authentication, session management, and officer profile."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Credentials for officer authentication."""

    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class CreateOfficerRequest(BaseModel):
    """Admin-only payload for official onboarding."""

    username: str = Field(..., min_length=3)
    password: str = Field("Gov@Secure2026", min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = Field("district_officer", description="admin | state_officer | district_officer")
    district: str | None = None
    state: str | None = "Meghalaya"
    contact_number: str | None = None


# Deprecated alias for backwards compatibility in existing tests/calls
RegisterRequest = CreateOfficerRequest


class PasswordChangeRequest(BaseModel):
    """Authenticated password change."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    """Authentication response payload for client verification."""

    status: str = "authenticated"
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str
    role: str
    district: str | None = None
    state: str | None = None
    escalation_level: int = 1
    csrf_token: str | None = None


class UserProfile(BaseModel):
    """Disaster Management Officer profile schema."""

    user_id: str
    username: str
    full_name: str
    role: str
    district: str | None = None
    state: str | None = None
    escalation_level: int
    contact_number: str | None = None
    csrf_token: str | None = None


class SessionStatusResponse(BaseModel):
    """Session validation and status query response."""

    authenticated: bool
    user: UserProfile | None = None
