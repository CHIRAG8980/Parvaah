"""API endpoints for weather forecasts, rainfall readings, and gauge data."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.weather import WeatherForecastResponse, IngestRainfallRequest
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather & Forecasting"])


@router.get("/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(
    zone_id: str | None = Query(None, description="Zone ID for weather timeline"),
    district: str | None = Query(None, description="District name for weather timeline"),
    db: Session = Depends(get_db),
):
    """Retrieve 14-day rainfall trend vs. risk timeline comparing IMD and community gauges."""
    return WeatherService.get_forecast(db, zone_id=zone_id, district=district)



@router.post("/readings")
def ingest_rainfall_reading(
    request: IngestRainfallRequest,
    db: Session = Depends(get_db),
):
    """Ingest real-time rainfall data from IMD or community rain gauges."""
    reading = WeatherService.ingest_reading(db, request=request)
    return {
        "status": "success",
        "reading_id": reading.reading_id,
        "rainfall_mm": reading.rainfall_mm,
        "cumulative_24hr_mm": reading.cumulative_24hr_mm,
    }
