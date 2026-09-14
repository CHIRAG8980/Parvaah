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


class DayForecastItem(BaseModel):
    """Single day forecast projection."""

    day_label: str
    date_str: str
    projected_rainfall_mm: float
    predicted_risk_level: str
    weather_condition: str
    temp_c: float


class HourlyPrecipitationItem(BaseModel):
    """Hourly rainfall observation or prediction."""

    hour_label: str
    rainfall_mm: float
    is_projected: bool


class WeatherForecastResponse(BaseModel):
    """Weather and rainfall trend panel response."""

    zone_id: str
    zone_name: str
    district: str = ""
    state: str = "Meghalaya"
    rainfall_24h_mm: float = 0.0
    cumulative_72h_mm: float = 0.0
    current_24h_rainfall_mm: float = 0.0
    cumulative_72h_rainfall_mm: float = 0.0
    rainfall_trend: str = Field(
        ..., description="e.g. rising, peak, receding"
    )
    community_gauges_count: int = 0
    active_community_gauges_count: int = 0
    imd_radar_station: str = "Cherrapunji Doppler Radar"
    last_updated: str = ""
    timeline: list[DailyForecastPoint] = Field(default_factory=list)
    forecast_days: list[DayForecastItem] = Field(default_factory=list)
    hourly_trend: list[HourlyPrecipitationItem] = Field(default_factory=list)


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
