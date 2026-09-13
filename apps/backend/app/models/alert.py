"""Alert lifecycle and escalation ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Alert(Base):
    """Early warning alert record with officer review and escalation status."""

    __tablename__ = "alerts"

    alert_id = Column(String(64), primary_key=True, index=True)
    zone_id = Column(
        String(64), ForeignKey("zones.zone_id"), nullable=False, index=True
    )
    risk_score_id = Column(
        String(64), ForeignKey("risk_scores.risk_score_id"), nullable=True
    )
    severity = Column(String(16), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    draft_message = Column(Text, nullable=False)
    final_message = Column(Text, nullable=True)
    status = Column(
        String(32), nullable=False, default="pending_review", index=True
    )
    rejection_reason = Column(String(128), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    reviewed_by = Column(String(64), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    escalation_deadline = Column(
        DateTime(timezone=True), nullable=False, index=True
    )
    escalated_to = Column(String(64), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    channels_used = Column(
        Text,
        nullable=False,
        default='["sms", "app_push", "cap_sachet"]',
    )

    risk_score = relationship("RiskScore", back_populates="alerts")
    escalations = relationship(
        "AlertEscalation", back_populates="alert", lazy="select"
    )


class AlertEscalation(Base):
    """Log entry when an alert exceeds review deadline and auto-escalates."""

    __tablename__ = "alert_escalations"

    escalation_id = Column(String(64), primary_key=True, index=True)
    alert_id = Column(
        String(64), ForeignKey("alerts.alert_id"), nullable=False, index=True
    )
    from_level = Column(String(32), nullable=False)
    to_level = Column(String(32), nullable=False)
    triggered_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    reason = Column(String(256), nullable=False)

    alert = relationship("Alert", back_populates="escalations")
