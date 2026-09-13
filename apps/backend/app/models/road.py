"""Road network connectivity and corridor ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class RoadSegment(Base):
    """Road segments monitored for landslide blockage and route safety."""

    __tablename__ = "roads"

    road_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    road_class = Column(String(32), nullable=False, index=True)
    zone_id = Column(
        String(64), ForeignKey("zones.zone_id"), nullable=False, index=True
    )
    status = Column(String(16), nullable=False, default="open", index=True)
    blockage_reason = Column(String(256), nullable=True)
    start_point = Column(String(64), nullable=False)
    end_point = Column(String(64), nullable=False)
    geometry_geojson = Column(Text, nullable=True)
    is_single_access = Column(Boolean, nullable=False, default=False)
    status_updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    zone = relationship("Zone", back_populates="roads")
