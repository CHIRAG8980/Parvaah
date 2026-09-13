"""Zone, terrain features, and village infrastructure ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Zone(Base):
    """Spatial unit (~25 sq km grid) for landslide monitoring."""

    __tablename__ = "zones"

    zone_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    avg_slope_deg = Column(Float, nullable=False, default=0.0)
    avg_elevation_m = Column(Float, nullable=False, default=0.0)
    geometry_geojson = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    risk_scores = relationship("RiskScore", back_populates="zone", lazy="select")
    roads = relationship("RoadSegment", back_populates="zone", lazy="select")
    infrastructures = relationship(
        "VillageInfrastructure", back_populates="zone", lazy="select"
    )
    rainfall_readings = relationship(
        "RainfallReading", back_populates="zone", lazy="select"
    )


class TerrainFeature(Base):
    """Static geomorphological terrain parameters per zone."""

    __tablename__ = "terrain_features"

    zone_id = Column(
        String(64), ForeignKey("zones.zone_id"), primary_key=True
    )
    slope_deg = Column(Float, nullable=False)
    aspect_deg = Column(Float, nullable=False)
    curvature_type = Column(String(32), nullable=False, default="planar")
    land_use = Column(String(64), nullable=False, default="forest")
    lithology = Column(String(64), nullable=True)
    soil_thickness_m = Column(Float, nullable=True)


class VillageInfrastructure(Base):
    """Settlements and critical public infrastructure within a zone."""

    __tablename__ = "villages_infrastructure"

    location_id = Column(String(64), primary_key=True, index=True)
    zone_id = Column(
        String(64), ForeignKey("zones.zone_id"), nullable=False, index=True
    )
    type = Column(String(32), nullable=False)
    name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population_estimate = Column(Integer, nullable=True)

    zone = relationship("Zone", back_populates="infrastructures")
