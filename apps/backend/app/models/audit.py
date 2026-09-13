"""Immutable audit log ORM model."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class AuditLog(Base):
    """Append-only audit trail for all system actions and decisions."""

    __tablename__ = "audit_log"

    log_id = Column(String(64), primary_key=True, index=True)
    entity_type = Column(String(32), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)
    actor = Column(String(64), nullable=False, index=True)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    data_snapshot_ref = Column(String(128), nullable=False)
    details_json = Column(Text, nullable=True)
