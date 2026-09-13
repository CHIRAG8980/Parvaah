"""System configuration and operational threshold settings model."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from app.database import Base


class SystemSettings(Base):
    """Operational settings, sensory thresholds, and dissemination preferences."""

    __tablename__ = "system_settings"

    key = Column(String(64), primary_key=True, default="default", index=True)
    rainfall_warning = Column(Float, nullable=False, default=55.0)
    rainfall_critical = Column(Float, nullable=False, default=115.0)
    insar_velocity = Column(Float, nullable=False, default=15.0)
    soil_saturation = Column(Float, nullable=False, default=78.0)
    seismic_threshold = Column(Float, nullable=False, default=0.08)

    channels_json = Column(
        Text,
        nullable=False,
        default='{"ndmaCap": true, "whatsappSdma": true, "smsDisasterRelay": true, "broRadioPush": true, "sirenCivilDefense": false, "emailBulletin": true}',
    )

    aws_poll_rate = Column(String(32), nullable=False, default="30s")
    insar_sync_interval = Column(String(32), nullable=False, default="30m")
    inclinometer_heartbeat = Column(String(32), nullable=False, default="1m")
    edge_failover = Column(Boolean, nullable=False, default=True)

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
