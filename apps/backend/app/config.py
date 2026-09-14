"""Application configuration module using Pydantic."""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load global .env from repository root
WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(dotenv_path=WORKSPACE_ROOT / ".env")


class Settings(BaseModel):
    """System settings and environment configuration."""

    PROJECT_NAME: str = Field(
        default_factory=lambda: os.getenv(
            "PROJECT_NAME", "Parvaah - Landslide Early Warning System API"
        )
    )
    VERSION: str = "1.0.0"
    API_V1_STR: str = Field(
        default_factory=lambda: os.getenv("API_V1_PREFIX", "/api/v1")
    )

    # PostgreSQL Database URL (defaults to unix socket peer authentication)
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "postgresql:///parvaah"
        )
    )
    FALLBACK_SQLITE_URL: str = "sqlite:///./parvaah_dev.db"

    # CORS configuration (explicit origins required for credentials/cookies)
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # ML Engine paths relative to workspace root
    WORKSPACE_ROOT: Path = Path(__file__).resolve().parents[3]
    ML_MODEL_PATH: Path = (
        WORKSPACE_ROOT
        / "apps"
        / "ml-engine"
        / "models"
        / "fusion_risk"
        / "saved_models"
        / "fusion_risk_model.pkl"
    )

    # Escalation policy default timeouts in minutes
    CRITICAL_ESCALATION_MINUTES: int = 30
    HIGH_ESCALATION_MINUTES: int = 60

    # Authentication, Cookie & Session Security
    JWT_SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "JWT_SECRET_KEY", "parvaah-secure-jwt-secret-key-ner-disaster-mgmt-2026"
        )
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Backwards-compat alias

    COOKIE_SECURE: bool = Field(
        default_factory=lambda: os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1")
    )
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = Field(
        default_factory=lambda: None if os.getenv("COOKIE_DOMAIN") in (None, "", "localhost") else os.getenv("COOKIE_DOMAIN")
    )
    ACCESS_TOKEN_COOKIE_NAME: str = "parvaah_access_token"
    REFRESH_TOKEN_COOKIE_NAME: str = "parvaah_refresh_token"
    CSRF_COOKIE_NAME: str = "parvaah_csrf_token"


settings = Settings()
