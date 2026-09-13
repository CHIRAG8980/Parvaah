"""RefreshToken ORM model for rotating token families and session revocation."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class RefreshToken(Base):
    """Database-backed refresh token registry supporting rotation and family revocation."""

    __tablename__ = "refresh_tokens"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    family_id = Column(String(64), nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(256), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


Index("idx_refresh_tokens_family_revoked", RefreshToken.family_id, RefreshToken.is_revoked)
