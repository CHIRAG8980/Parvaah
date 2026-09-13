"""Risk score and explainability factors ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class RiskScore(Base):
    """Time-versioned append-only landslide risk record per zone."""

    __tablename__ = "risk_scores"

    risk_score_id = Column(String(64), primary_key=True, index=True)
    zone_id = Column(
        String(64), ForeignKey("zones.zone_id"), nullable=False, index=True
    )
    computed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    risk_level = Column(String(16), nullable=False)
    risk_score_numeric = Column(Float, nullable=False)
    time_to_failure_min_days = Column(Integer, nullable=True)
    time_to_failure_max_days = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.85)
    model_version = Column(String(64), nullable=False, default="v1.0.0-fusion")
    explainability_json = Column(Text, nullable=True)

    zone = relationship("Zone", back_populates="risk_scores")
    alerts = relationship("Alert", back_populates="risk_score", lazy="select")
