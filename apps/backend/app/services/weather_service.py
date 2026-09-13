"""Service for real-time weather forecasting, live Open-Meteo telemetry, and rainfall ingestion."""

from datetime import datetime, timezone
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.weather import RainfallReading, CommunityGauge
from app.models.zone import Zone
from app.schemas.weather import WeatherForecastResponse, DailyForecastPoint, IngestRainfallRequest
from app.services.audit_service import AuditService


class WeatherService:
    """Live weather and rainfall telemetry provider backed by Open-Meteo and database readings."""

    @staticmethod
    def get_forecast(db: Session, zone_id: str | None = None) -> WeatherForecastResponse:
        """Fetch past 7 days observed and next 7 days forecast using live Open-Meteo API."""
        if zone_id:
            zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
        else:
            zone = db.query(Zone).first()

        if not zone:
            zone = db.query(Zone).first()

        if not zone:
            raise HTTPException(status_code=404, detail="No monitored zones registered")


        gauges_count = db.query(CommunityGauge).filter(CommunityGauge.zone_id == zone.zone_id).count()

        now_dt = datetime.now(timezone.utc)
        today_str = now_dt.strftime("%Y-%m-%d")

        timeline: list[DailyForecastPoint] = []
        current_24h = 0.0
        cumulative_72h = 0.0

        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={zone.latitude}&longitude={zone.longitude}"
                f"&daily=precipitation_sum,temperature_2m_max,weather_code"
                f"&hourly=precipitation&past_days=7&forecast_days=7&timezone=Asia%2FKolkata"
            )
            with httpx.Client(timeout=6.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    daily_data = data.get("daily", {})
                    dates = daily_data.get("time", [])
                    precip_sums = daily_data.get("precipitation_sum", [])
                    hourly_precip = data.get("hourly", {}).get("precipitation", [])

                    if len(hourly_precip) >= 72:
                        cumulative_72h = round(float(sum(hourly_precip[-72:])), 1)
                        current_24h = round(float(sum(hourly_precip[-24:])), 1)

                    for date_str, precip_val in zip(dates, precip_sums):
                        precip_float = round(float(precip_val or 0.0), 1)
                        is_future = date_str > today_str
                        day_obj = datetime.strptime(date_str, "%Y-%m-%d")
                        slope_component = zone.avg_slope_deg * 0.8
                        risk_score = round(min(12.0 + slope_component + (precip_float * 0.45), 98.0), 1)

                        timeline.append(
                            DailyForecastPoint(
                                date=date_str,
                                day_label=day_obj.strftime("%a"),
                                rainfall_imd_mm=precip_float,
                                rainfall_community_mm=precip_float,
                                predicted_risk_score=risk_score,
                                is_forecast=is_future,
                            )
                        )
        except Exception as exc:
            # Fallback to authentic physical sensor readings if live external API is unreachable
            readings = (
                db.query(RainfallReading)
                .filter(RainfallReading.zone_id == zone.zone_id)
                .order_by(RainfallReading.timestamp.desc())
                .first()
            )
            if readings:
                current_24h = readings.cumulative_24hr_mm
                cumulative_72h = readings.cumulative_72hr_mm
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Weather telemetry service unreachable for zone '{zone.zone_id}' and no verified sensor readings exist in database: {exc}",
                ) from exc

        trend = (
            "Peak runoff with high saturation"
            if current_24h > 120
            else ("Moderate steady accumulation" if current_24h > 25 else "Normal baseline precipitation")
        )

        return WeatherForecastResponse(
            zone_id=zone.zone_id,
            zone_name=zone.name,

            current_24h_rainfall_mm=current_24h,
            cumulative_72h_rainfall_mm=cumulative_72h,
            rainfall_trend=trend,
            community_gauges_count=gauges_count,
            timeline=timeline,
        )

    @staticmethod
    def ingest_reading(db: Session, request: IngestRainfallRequest) -> RainfallReading:
        """Ingest a new rainfall observation and persist to database."""
        reading = RainfallReading(
            reading_id=f"rf-{int(datetime.now(timezone.utc).timestamp())}",
            source_type=request.source_type,
            source_id=request.source_id,
            zone_id=request.zone_id,
            rainfall_mm=request.rainfall_mm,
            cumulative_1hr_mm=request.cumulative_1hr_mm,
            cumulative_24hr_mm=request.cumulative_24hr_mm,
            cumulative_72hr_mm=request.cumulative_72hr_mm,
            is_forecast=request.is_forecast,
            confidence_flag="high",
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        AuditService.record_action(
            db=db,
            entity_type="rainfall",
            entity_id=reading.reading_id,
            action="reading_ingested",
            actor=request.source_id,
            details={"rainfall_mm": request.rainfall_mm},
        )
        return reading
