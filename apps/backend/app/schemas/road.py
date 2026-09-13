"""Pydantic schemas for road network, connectivity, and rerouting."""

from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import RoadStatus


class RoadSegmentResponse(BaseModel):
    """Road segment status for web and mobile clients."""

    road_id: str
    name: str
    road_class: str
    zone_id: str
    status: RoadStatus
    blockage_reason: str | None = None
    start_point: str
    end_point: str
    is_single_access: bool
    status_updated_at: datetime


class RerouteRequest(BaseModel):
    """Request payload to calculate safe alternate route."""

    origin: str = Field(..., description="Origin location or town name")
    destination: str = Field(
        ..., description="Destination location or town name"
    )
    current_zone_id: str | None = None


class RerouteResponse(BaseModel):
    """Advisory alternate routing response for mobile clients."""

    origin: str
    destination: str
    direct_route_status: RoadStatus
    alternate_route_available: bool
    suggested_route_name: str
    advisory_notes: str
    estimated_distance_km: float
    estimated_duration_mins: int
    safe_corridor_waypoints: list[str]
