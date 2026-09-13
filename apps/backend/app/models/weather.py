"""Time-series rainfall, gauges, and satellite readings ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class RainfallReading(Base):
    """Rainfall observation or forecast reading from IMD or community gauge."""

    __tablename__ = "rainfall_readings"

    reading_id = Column(String(64), primary_key=True, index=True)
    source_type = Column(String(32), nullable=False, index=True)
    source_id = Column(String(64), nullable=False)
    zone_id = Column(
        String(64), ForeignKey("zones.zone_id"), nullable=False, index=True
    )
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    rainfall_mm = Column(Float, nullable=False, default=0.0)
    cumulative_1hr_mm = Column(Float, nullable=False, default=0.0)
    cumulative_24hr_mm = Column(Float, nullable=False, default=0.0)
    cumulative_72hr_mm = Column(Float, nullable=False, default=0.0)
    is_forecast = Column(Boolean, nullable=False, default=False)
    confidence_flag = Column(String(16), nullable=False, default="high")

    zone = relationship("Zone", back_populates="rainfall_readings")


class CommunityGauge(Base):
    """Hyperlocal rain gauge deployed by NGO or village panchayat."""

    __tablename__ = "community_gauges"

    gauge_id = Column(String(64), primary_key=True, index=True)
    zone_id = Column(String(64), ForeignKey("zones.zone_id"), nullable=False)
    name = Column(String(128), nullable=False)
    maintainer_org = Column(String(128), nullable=False)
    maintainer_contact = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(32), nullable=False, default="active")


class DeformationReading(Base):
    """InSAR line-of-sight satellite displacement reading."""

    __tablename__ = "deformation_readings"

    reading_id = Column(String(64), primary_key=True, index=True)
    zone_id = Column(String(64), ForeignKey("zones.zone_id"), nullable=False)
    acquisition_date = Column(DateTime(timezone=True), nullable=False)
    displacement_mm = Column(Float, nullable=False)
    coherence_score = Column(Float, nullable=False, default=0.8)
    validated_by_gnss = Column(Boolean, nullable=False, default=False)


class NdviReading(Base):
    """Sentinel-2 vegetation health and NDVI anomaly reading."""

    __tablename__ = "ndvi_readings"

    reading_id = Column(String(64), primary_key=True, index=True)
    zone_id = Column(String(64), ForeignKey("zones.zone_id"), nullable=False)
    acquisition_date = Column(DateTime(timezone=True), nullable=False)
    ndvi_value = Column(Float, nullable=False)
    ndvi_anomaly = Column(Float, nullable=False)
    cloud_cover_pct = Column(Float, nullable=False, default=0.0)
    usable = Column(Boolean, nullable=False, default=True)
