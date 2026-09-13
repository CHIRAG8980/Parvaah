"""Pydantic schemas for rainfall readings and weather forecasts."""

from pydantic import BaseModel, Field


class DailyForecastPoint(BaseModel):
    """Daily datapoint comparing rainfall against predicted risk."""

    date: str
    day_label: str
    rainfall_imd_mm: float
    rainfall_community_mm: float
    predicted_risk_score: float
    is_forecast: bool


class WeatherForecastResponse(BaseModel):
    """Weather and rainfall trend panel response."""

    zone_id: str
    zone_name: str
    current_24h_rainfall_mm: float
    cumulative_72h_rainfall_mm: float
    rainfall_trend: str = Field(
        ..., description="e.g. rising, peak, receding"
    )
    community_gauges_count: int
    timeline: list[DailyForecastPoint]


class IngestRainfallRequest(BaseModel):
    """Payload to ingest a new rainfall reading."""

    source_type: str = Field(..., description="imd or community_gauge")
    source_id: str
    zone_id: str
    rainfall_mm: float
    cumulative_1hr_mm: float = 0.0
    cumulative_24hr_mm: float
    cumulative_72hr_mm: float
    is_forecast: bool = False
