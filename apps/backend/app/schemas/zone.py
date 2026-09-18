"""Pydantic schemas for spatial monitoring zones."""

from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import RiskLevel, ConfidenceLevel
from app.schemas.risk import ExplainabilityFactors


class VillageResponse(BaseModel):
    """Infrastructure element within zone."""

    location_id: str
    type: str
    name: str
    latitude: float
    longitude: float
    population_estimate: int | None = None


class ZoneSummaryResponse(BaseModel):
    """Summary item for zone list views."""

    zone_id: str
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    avg_slope_deg: float
    avg_elevation_m: float
    risk_score: float
    risk_level: RiskLevel
    confidence: ConfidenceLevel
    time_to_failure_window: str | None = None
    factors: ExplainabilityFactors | None = None
    created_at: datetime


class HistoricalLandslideEvent(BaseModel):
    """Historical record for zone context."""

    event_id: str
    event_date: str
    landslide_type: str
    trigger_cause: str
    casualties: int
    infrastructure_damage_desc: str


class ZoneDetailResponse(BaseModel):
    """Full detail view for zone analysis panel."""

    zone_id: str
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    avg_slope_deg: float
    avg_elevation_m: float
    risk_score: float
    risk_level: RiskLevel
    confidence: ConfidenceLevel
    time_to_failure_window: str | None = None
    factors: ExplainabilityFactors
    infrastructures: list[VillageResponse] = Field(default_factory=list)
    historical_events: list[HistoricalLandslideEvent] = Field(
        default_factory=list
    )
