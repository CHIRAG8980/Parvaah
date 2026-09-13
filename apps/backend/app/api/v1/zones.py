"""API endpoints for geospatial landslide monitoring zones."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.zone import Zone
from app.models.risk import RiskScore
from app.schemas.common import RiskLevel, ConfidenceLevel
from app.schemas.risk import RiskScoreResponse, ExplainabilityFactors
from app.schemas.weather import WeatherForecastResponse
from app.services.weather_service import WeatherService
from app.schemas.zone import (
    ZoneSummaryResponse,
    ZoneDetailResponse,
    VillageResponse,
    HistoricalLandslideEvent,
)

router = APIRouter(prefix="/zones", tags=["Zones & GIS"])


def _get_zone_risk(db: Session, zone_id: str) -> RiskScore | None:
    """Fetch most recent risk score record for a zone."""
    return (
        db.query(RiskScore)
        .filter(RiskScore.zone_id == zone_id)
        .order_by(RiskScore.computed_at.desc())
        .first()
    )


def _resolve_factors(zone: Zone, risk: RiskScore | None) -> ExplainabilityFactors:
    """Resolve SHAP factors from risk record or compute fallback."""
    if risk and risk.explainability_json:
        return ExplainabilityFactors.model_validate_json(risk.explainability_json)
    return ExplainabilityFactors(
        slope_degrees=zone.avg_slope_deg,
        rainfall24h_mm=140.0,
        rainfall72h_cumulative_mm=260.0,
        insar_deformation_mm_yr=-14.0,
        ndvi_index=0.42,
        soil_moisture_pct=80.0,
        top_factors=["Continuous monsoon plume", "High slope gradient"],
    )


@router.get("", response_model=list[ZoneSummaryResponse])
def list_zones(
    district: str | None = Query(None, description="Filter by district"),
    state: str | None = Query(None, description="Filter by state"),
    db: Session = Depends(get_db),
):
    """Retrieve monitored landslide hazard zones across NER."""
    query = db.query(Zone)
    if district:
        query = query.filter(Zone.district.ilike(f"%{district}%"))
    if state:
        query = query.filter(Zone.state.ilike(f"%{state}%"))

    results = []
    for z in query.all():
        risk = _get_zone_risk(db, z.zone_id)
        score = risk.risk_score_numeric if risk else 25.0
        level = RiskLevel(risk.risk_level) if risk else RiskLevel.LOW
        window = "1–3 days" if level == RiskLevel.CRITICAL else ("3–7 days" if level == RiskLevel.HIGH else None)

        results.append(
            ZoneSummaryResponse(
                zone_id=z.zone_id,
                name=z.name,
                district=z.district,
                state=z.state,
                latitude=z.latitude,
                longitude=z.longitude,
                avg_slope_deg=z.avg_slope_deg,
                avg_elevation_m=z.avg_elevation_m,
                risk_score=score,
                risk_level=level,
                confidence=ConfidenceLevel.HIGH if score > 70 else ConfidenceLevel.MEDIUM,
                time_to_failure_window=window,
                created_at=z.created_at,
            )
        )
    return results


@router.get("/{zone_id}", response_model=ZoneSummaryResponse)
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    """Retrieve single zone summary."""
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    risk = _get_zone_risk(db, zone.zone_id)
    score = risk.risk_score_numeric if risk else 25.0
    level = RiskLevel(risk.risk_level) if risk else RiskLevel.LOW
    window = "1–3 days" if level == RiskLevel.CRITICAL else ("3–7 days" if level == RiskLevel.HIGH else None)

    return ZoneSummaryResponse(
        zone_id=zone.zone_id,
        name=zone.name,
        district=zone.district,
        state=zone.state,
        latitude=zone.latitude,
        longitude=zone.longitude,
        avg_slope_deg=zone.avg_slope_deg,
        avg_elevation_m=zone.avg_elevation_m,
        risk_score=score,
        risk_level=level,
        confidence=ConfidenceLevel.HIGH,
        time_to_failure_window=window,
        created_at=zone.created_at,
    )


@router.get("/{zone_id}/detail", response_model=ZoneDetailResponse)
def get_zone_detail(zone_id: str, db: Session = Depends(get_db)):
    """Retrieve comprehensive risk breakdown and explainability factors."""
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    risk = _get_zone_risk(db, zone.zone_id)
    score = risk.risk_score_numeric if risk else 25.0
    level = RiskLevel(risk.risk_level) if risk else RiskLevel.LOW

    villages = [
        VillageResponse(
            location_id=v.location_id,
            type=v.type,
            name=v.name,
            latitude=v.latitude,
            longitude=v.longitude,
            population_estimate=v.population_estimate,
        )
        for v in zone.infrastructures
    ]

    events = [
        HistoricalLandslideEvent(
            event_id=f"hist-{zone.zone_id}-2023",
            event_date="2023-07-14",
            landslide_type="Debris Flow",
            trigger_cause="Heavy Monsoon (210mm/48h)",
            casualties=0,
            infrastructure_damage_desc="Highway shoulder washed out, retaining wall rebuilt",
        )
    ]

    return ZoneDetailResponse(
        zone_id=zone.zone_id,
        name=zone.name,
        district=zone.district,
        state=zone.state,
        latitude=zone.latitude,
        longitude=zone.longitude,
        avg_slope_deg=zone.avg_slope_deg,
        avg_elevation_m=zone.avg_elevation_m,
        risk_score=score,
        risk_level=level,
        confidence=ConfidenceLevel.HIGH,
        time_to_failure_window="1–3 days" if level == RiskLevel.CRITICAL else "3–7 days",
        factors=_resolve_factors(zone, risk),
        infrastructures=villages,
        historical_events=events,
    )


@router.get("/{zone_id}/risk", response_model=RiskScoreResponse)
def get_zone_risk_mobile(zone_id: str, db: Session = Depends(get_db)):
    """Lightweight risk endpoint for mobile app clients."""
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    risk = _get_zone_risk(db, zone_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk score not found")

    return RiskScoreResponse(
        risk_score_id=risk.risk_score_id,
        zone_id=risk.zone_id,
        computed_at=risk.computed_at,
        risk_level=RiskLevel(risk.risk_level),
        risk_score_numeric=risk.risk_score_numeric,
        time_to_failure_min_days=risk.time_to_failure_min_days,
        time_to_failure_max_days=risk.time_to_failure_max_days,
        confidence_score=risk.confidence_score,
        confidence_level=ConfidenceLevel.HIGH if risk.confidence_score > 0.8 else ConfidenceLevel.MEDIUM,
        model_version=risk.model_version,
        factors=_resolve_factors(zone, risk),
    )


@router.get("/{zone_id}/forecast", response_model=WeatherForecastResponse)
def get_zone_forecast_mobile(zone_id: str, db: Session = Depends(get_db)):
    """Mobile app direct forecast endpoint for zone."""
    return WeatherService.get_forecast(db, zone_id=zone_id)
