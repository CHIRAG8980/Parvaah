import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config import settings
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


@router.get("/heatmap")
def get_landslide_heatmap_data(
    district: str | None = Query(None, description="Filter by district"),
    db: Session = Depends(get_db),
):
    """Retrieve authentic geospatial landslide heatmap points with risk intensity weights."""
    geojson_path = (
        settings.WORKSPACE_ROOT
        / "apps"
        / "ml-engine"
        / "data"
        / "raw"
        / "ground_truth"
        / "meghalaya_1330_landslides.geojson"
    )

    # Fetch dynamic zone risk scores for weighting points
    zones = db.query(Zone).all()
    zone_risk_weights: dict[str, float] = {}
    for z in zones:
        risk = _get_zone_risk(db, z.zone_id)
        zone_risk_weights[z.district.lower().replace(" ", "_")] = (
            (risk.risk_score_numeric / 100.0) if risk else 0.5
        )

    points: list[list[float]] = []  # [lat, lng, intensity]

    if geojson_path.exists():
        try:
            with open(geojson_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                zone_key = str(props.get("zone", "East_Khasi_Hills")).lower()
                coords = feat.get("geometry", {}).get("coordinates", [])
                if len(coords) == 2:
                    lng, lat = float(coords[0]), float(coords[1])
                    norm_district = district.lower().replace(" ", "_") if district else None
                    if norm_district and norm_district not in zone_key:
                        continue
                    # Weight by real risk score of sector or default to 0.75
                    weight = zone_risk_weights.get(zone_key, 0.75)
                    points.append([round(lat, 5), round(lng, 5), round(weight, 2)])
        except Exception:
            pass

    # Fallback to zone centers if geojson has no points for that district
    if not points:
        for z in zones:
            if district and district.lower() not in z.district.lower():
                continue
            risk = _get_zone_risk(db, z.zone_id)
            intensity = (risk.risk_score_numeric / 100.0) if risk else 0.5
            points.append([z.latitude, z.longitude, intensity])

    return {
        "points": points,
        "count": len(points),
        "source": "GSI_Bhukosh_Validated_Landslides",
    }


def _get_zone_risk(db: Session, zone_id: str) -> RiskScore | None:
    """Fetch most recent risk score record for a zone."""
    return (
        db.query(RiskScore)
        .filter(RiskScore.zone_id == zone_id)
        .order_by(RiskScore.computed_at.desc())
        .first()
    )


def _resolve_factors(zone: Zone, risk: RiskScore | None) -> ExplainabilityFactors:
    """Resolve SHAP factors from risk record or return baseline zeroed factors."""
    if risk and risk.explainability_json:
        return ExplainabilityFactors.model_validate_json(risk.explainability_json)
    return ExplainabilityFactors(
        slope_degrees=zone.avg_slope_deg,
        rainfall24h_mm=0.0,
        rainfall72h_cumulative_mm=0.0,
        insar_deformation_mm_yr=0.0,
        ndvi_index=0.0,
        soil_moisture_pct=0.0,
        top_factors=[],
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
        score = risk.risk_score_numeric if risk else 0.0
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
                confidence=ConfidenceLevel.HIGH if score > 70 else (ConfidenceLevel.MEDIUM if score > 30 else ConfidenceLevel.LOW),
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
    score = risk.risk_score_numeric if risk else 0.0
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
        confidence=ConfidenceLevel.HIGH if score > 70 else (ConfidenceLevel.MEDIUM if score > 30 else ConfidenceLevel.LOW),
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
    score = risk.risk_score_numeric if risk else 0.0
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

    events: list[HistoricalLandslideEvent] = []

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
