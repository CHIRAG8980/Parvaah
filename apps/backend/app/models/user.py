"""User accounts and mobile device push tokens ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from app.database import Base


class User(Base):
    """System operators and Disaster Management Officers."""

    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    role = Column(
        String(128),
        nullable=False,
        default="disaster_management_officer",
        index=True,
    )
    district = Column(String(64), nullable=True, index=True)
    escalation_level = Column(Integer, nullable=False, default=1)
    contact_number = Column(String(32), nullable=True)
    hashed_password = Column(String(128), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class DeviceToken(Base):
    """Mobile citizen device push notification registrations."""

    __tablename__ = "device_tokens"

    device_id = Column(String(64), primary_key=True, index=True)
    fcm_token = Column(String(256), nullable=False, unique=True, index=True)
    zone_id = Column(String(64), nullable=False, index=True)
    language = Column(String(16), nullable=False, default="en")
    platform = Column(String(16), nullable=False, default="android")
    registered_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
