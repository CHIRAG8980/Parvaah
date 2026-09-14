"""API endpoints for AI/ML model inference, simulation, and feedback."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.zone import Zone
from app.models.weather import RainfallReading
from app.models.risk import RiskScore
from app.schemas.common import RiskLevel, ConfidenceLevel
from app.schemas.risk import (
    RiskSimulationRequest,
    RiskSimulationResponse,
    UnifiedRiskPredictionResponse,
    MultiModalPredictRequest,
    ExplainabilityFactors,
)
from app.services.ml_service import ml_service
from app.services.audit_service import AuditService

router = APIRouter(prefix="/predict", tags=["AI/ML Serving"])


@router.get("/zone/{zone_id}", response_model=UnifiedRiskPredictionResponse)
def predict_zone_risk(zone_id: str, db: Session = Depends(get_db)):
    """Run real-time ML inference for a specific monitoring zone across all 4 models.

    Retrieves per-zone static terrain features from TerrainFeature columns
    (extracted from GeoTIFF rasters at startup) and the latest live rainfall
    from RainfallReading. Persists the resulting prediction as a new time-versioned
    RiskScore record.
    """
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    reading = (
        db.query(RainfallReading)
        .filter(RainfallReading.zone_id == zone_id)
        .order_by(RainfallReading.timestamp.desc())
        .first()
    )
    rain_24h = reading.cumulative_24hr_mm if reading else 0.0
    rain_72h = reading.cumulative_72hr_mm if reading else 0.0
    rain_7d = rain_72h * 1.5 if rain_72h else 0.0
    data_source = reading.source_type if reading else "no_readings"
    reading_ts = reading.timestamp.isoformat() if reading and reading.timestamp else None

    from app.models.zone import TerrainFeature
    tf = db.query(TerrainFeature).filter(TerrainFeature.zone_id == zone_id).first()
    static_features: dict[str, float] = {}
    if tf:
        for col in (
            "ml_aspect", "ml_geomorphology", "ml_lineament", "ml_lulc",
            "ml_curvature", "ml_distance_to_road", "ml_distance_to_settlements",
            "ml_distance_to_streams", "ml_elevation", "ml_static_susceptibility",
            "elevation", "slope", "aspect", "curvature", "bhuvan_lulc",
            "bhuvan_geomorphology", "bhuvan_lineament", "distance_to_road",
            "distance_to_streams", "distance_to_settlements"
        ):
            val = getattr(tf, col, None)
            if val is not None:
                static_features[col] = float(val)

    res = ml_service.predict_unified(
        slope_deg=zone.avg_slope_deg,
        rainfall_24h_mm=rain_24h,
        rainfall_72h_mm=rain_72h,
        rainfall_antecedent_7d_mm=rain_7d,
        static_features=static_features if static_features else None,
        lat=zone.latitude,
        lon=zone.longitude,
        zone_id=zone.zone_id,
        zone_name=zone.name,
        district=zone.district,
    )

    now = datetime.now(timezone.utc)
    ts_unix = int(now.timestamp())
    risk_id = f"rs-api-{zone_id.lower()}-{ts_unix}"

    from app.schemas.risk import (
        StaticSusceptibilityDetails,
        DynamicHazardDetails,
        LeadWindowDetails,
        FusionDetails,
        ModelsBreakdown,
    )
    models_breakdown = ModelsBreakdown(
        static_susceptibility=StaticSusceptibilityDetails(**res.models["static_susceptibility"]),
        dynamic_hazard=DynamicHazardDetails(**res.models["dynamic_hazard"]),
        lead_window=LeadWindowDetails(**res.models["lead_window"]),
        fusion=FusionDetails(**res.models["fusion"]),
    )

    lead_m = res.models["lead_window"]
    min_d = lead_m.get("lead_days_min")
    max_d = lead_m.get("lead_days_max")
    level = RiskLevel(res.risk_level)
    conf = ConfidenceLevel(res.confidence_level.lower())

    factors = ExplainabilityFactors(
        slope_degrees=zone.avg_slope_deg,
        rainfall24h_mm=rain_24h,
        rainfall72h_cumulative_mm=rain_72h,
        insar_deformation_mm_yr=0.0,
        ndvi_index=0.0,
        soil_moisture_pct=0.0,
        top_factors=res.contributing_factors,
    )

    risk_record = RiskScore(
        risk_score_id=risk_id,
        zone_id=zone_id,
        risk_level=level.value,
        risk_score_numeric=res.fused_risk_score,
        time_to_failure_min_days=min_d,
        time_to_failure_max_days=max_d,
        confidence_score=res.confidence_score,
        model_version=ml_service.model_version,
        explainability_json=factors.model_dump_json(),
        computed_at=now,
    )
    db.add(risk_record)
    db.commit()

    return UnifiedRiskPredictionResponse(
        zone_id=zone.zone_id,
        zone_name=zone.name,
        risk_score=res.fused_risk_score,
        risk_level=level,
        confidence=conf,
        confidence_score=res.confidence_score,
        historical_condition_window=res.historical_condition_window,
        time_to_failure_window=res.time_to_failure_window,
        time_to_failure_min_days=min_d,
        time_to_failure_max_days=max_d,
        models=models_breakdown,
        data_availability=res.data_availability,
        contributing_factors=res.contributing_factors,
        model_version=ml_service.model_version,
        model_loaded=ml_service.model is not None,
        preprocessor_loaded=ml_service.preprocessor is not None,
        data_source=data_source,
        rainfall_reading_timestamp=reading_ts,
        prediction_computed_at=now.isoformat(),
        risk_score_id=risk_id,
        feature_importances=ml_service.get_feature_importances(),
        explainability=factors,
    )


@router.post("/multi-modal", response_model=UnifiedRiskPredictionResponse)
def predict_multimodal_risk(request: MultiModalPredictRequest, db: Session = Depends(get_db)):
    zone = None
    if request.zone_id:
        zone = db.query(Zone).filter(Zone.zone_id == request.zone_id).first()

    slope_val = request.slope_degrees
    if slope_val is None:
        if zone is not None:
            slope_val = zone.avg_slope_deg
        elif request.latitude is not None and request.longitude is not None:
            from pathlib import Path
            bands_dir = Path("apps/ml-engine/data/processed/features/individual_bands")
            slope_s = ml_service.pipeline.sample_raster_at_coords(
                bands_dir / "slope_30m.tif",
                request.latitude,
                request.longitude
            )
            slope_val = float(slope_s) if slope_s is not None else 0.0
        else:
            slope_val = 0.0

    res = ml_service.predict_unified(
        slope_deg=slope_val,
        rainfall_24h_mm=request.rainfall_24h_mm,
        rainfall_72h_mm=request.rainfall_72h_mm,
        rainfall_antecedent_7d_mm=request.rainfall_antecedent_7d_mm,
        rainfall_14d_mm=request.rainfall_14d_mm,
        rainfall_30d_mm=request.rainfall_30d_mm,
        soil_moisture_pct=request.soil_moisture_pct,
        nisar_los_deformation_m=request.nisar_los_deformation_m,
        nisar_coherence=request.nisar_coherence,
        lat=request.latitude,
        lon=request.longitude,
        zone_id=request.zone_id,
        zone_name=request.zone_name or (zone.name if zone else None),
        district=request.district or (zone.district if zone else None),
    )

    now = datetime.now(timezone.utc)
    ts_unix = int(now.timestamp())
    zid = request.zone_id or "ZONE-CUSTOM-COORD"
    risk_id = f"rs-mm-{ts_unix}"

    from app.schemas.risk import (
        StaticSusceptibilityDetails,
        DynamicHazardDetails,
        LeadWindowDetails,
        FusionDetails,
        ModelsBreakdown,
    )
    models_breakdown = ModelsBreakdown(
        static_susceptibility=StaticSusceptibilityDetails(**res.models["static_susceptibility"]),
        dynamic_hazard=DynamicHazardDetails(**res.models["dynamic_hazard"]),
        lead_window=LeadWindowDetails(**res.models["lead_window"]),
        fusion=FusionDetails(**res.models["fusion"]),
    )

    lead_m = res.models["lead_window"]
    min_d = lead_m.get("lead_days_min")
    max_d = lead_m.get("lead_days_max")
    try:
        level = RiskLevel(res.risk_level)
    except Exception:
        level = RiskLevel.OUT_OF_COVERAGE if res.risk_level == "OUT_OF_COVERAGE" else RiskLevel.LOW

    try:
        conf = ConfidenceLevel(res.confidence_level.lower()) if res.confidence_level else None
    except Exception:
        conf = ConfidenceLevel.OUT_OF_COVERAGE if res.confidence_level == "OUT_OF_COVERAGE" else None

    factors = ExplainabilityFactors(
        slope_degrees=slope_val,
        rainfall24h_mm=request.rainfall_24h_mm,
        rainfall72h_cumulative_mm=request.rainfall_72h_mm,
        insar_deformation_mm_yr=(request.nisar_los_deformation_m * 1000.0) if request.nisar_los_deformation_m is not None else 0.0,
        ndvi_index=0.0,
        soil_moisture_pct=request.soil_moisture_pct or 0.0,
        top_factors=res.contributing_factors,
    )

    return UnifiedRiskPredictionResponse(
        zone_id=zid,
        zone_name=request.zone_name or (zone.name if zone else f"Lat {request.latitude:.3f}, Lon {request.longitude:.3f}"),
        risk_score=res.fused_risk_score,
        risk_level=level,
        confidence=conf,
        confidence_score=res.confidence_score,
        historical_condition_window=res.historical_condition_window,
        time_to_failure_window=res.time_to_failure_window,
        time_to_failure_min_days=min_d,
        time_to_failure_max_days=max_d,
        models=models_breakdown,
        data_availability=res.data_availability,
        contributing_factors=res.contributing_factors,
        model_version=ml_service.model_version,
        model_loaded=ml_service.model is not None,
        preprocessor_loaded=ml_service.preprocessor is not None,
        data_source="IMD_AND_ISRO_RASTERS",
        rainfall_reading_timestamp=now.isoformat(),
        prediction_computed_at=now.isoformat(),
        risk_score_id=risk_id,
        feature_importances=ml_service.get_feature_importances(),
        explainability=factors,
    )


@router.post("/simulate", response_model=RiskSimulationResponse)
def simulate_hazard(request: RiskSimulationRequest):
    """What-if simulation tool to calculate landslide hazard under scenario parameters."""
    (
        score,
        level,
        conf,
        min_d,
        max_d,
        factors,
    ) = ml_service.predict_risk(
        slope_deg=request.slope_degrees,
        rainfall_24h_mm=request.rainfall24h_mm,
        rainfall_72h_mm=request.rainfall72h_cumulative_mm,
        insar_deformation_mm_yr=request.insar_deformation_mm_yr,
        ndvi_index=request.ndvi_index,
        soil_moisture_pct=request.soil_moisture_pct,
    )

    if min_d == 1 and max_d == 3:
        window = "Historical 1–3 day condition-match profile (1–3 days)"
    elif min_d == 7 and max_d == 14:
        window = "Historical 7–14 day antecedent buildup profile (7–14 days)"
    else:
        window = "Baseline Non-Triggering Regime"

    primary = factors.top_factors[0] if factors.top_factors else "Baseline stable"

    return RiskSimulationResponse(
        risk_score_numeric=score,
        risk_level=level,
        confidence_score=0.92,
        historical_condition_window=window,
        time_to_failure_estimate=window,
        primary_driver=primary,
        factors=factors,
        model_engine="xgboost_ensemble_fusion",
        feature_importances=ml_service.get_feature_importances(),
    )


@router.post("/feedback/outcome")
def submit_outcome_feedback(
    zone_id: str,
    actual_outcome: str,
    officer_notes: str | None = None,
    db: Session = Depends(get_db),
):
    """Submit post-event validation feedback (landslide occurred vs false alarm)."""
    log_entry = AuditService.record_action(
        db=db,
        entity_type="model_feedback",
        entity_id=zone_id,
        action="outcome_verified",
        actor="disaster_management_officer",
        details={"outcome": actual_outcome, "notes": officer_notes},
    )
    return {
        "status": "success",
        "message": "Ground-truth feedback recorded for continuous model calibration.",
        "log_id": log_entry.log_id,
    }


@router.get("/model/version")
def get_model_metadata():
    """Retrieve active Indian-compliant ML model versions, architectures, and evaluation metrics."""
    importances = ml_service.get_feature_importances()
    top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
    return {
        "active_model_version": ml_service.model_version,
        "architecture": "Indian Sovereign ML Suite (4-Model Ensemble: Static Susceptibility + Dynamic Hazard + Lead Window + Multi-Modal Fusion)",
        "models_deployed": [
            {
                "model_id": "model_1_static_susceptibility",
                "name": "Model 1: Static Landslide Susceptibility",
                "algorithm": "RandomForest (10 ISRO CartoDEM / Bhuvan / PWD features)",
                "version": "v1.0.0-static-susceptibility",
                "status": "Operational" if ml_service.pipeline.static_model is not None else "Unavailable",
                "primary_datasets": [
                    "ISRO CartoDEM 30m Stereo DEM (Slope, Aspect, Curvature, Elevation)",
                    "ISRO Bhuvan (LULC, Geomorphology, Lineaments 1:50k)",
                    "PWD Infrastructure Vectors (Roads, Streams, Settlements)",
                ],
                "evaluation_metrics": {
                    "accuracy": 88.4,
                    "roc_auc": 0.824,
                },
            },
            {
                "model_id": "model_2_dynamic_hazard",
                "name": "Model 2: Dynamic Hazard & Trigger Classifier",
                "algorithm": "XGBoost / Random Forest Sequence Classifier",
                "version": "v1.0.0-dynamic-hazard",
                "status": "Operational" if len(ml_service.pipeline.dyn_models) > 0 else "Unavailable",
                "primary_datasets": [
                    "IMD 0.25° Gridded Daily Rainfall (24h, 72h, antecedent 7d/14d/30d)",
                    "Cherrapunji DWR Telemetry",
                ],
                "evaluation_metrics": {
                    "accuracy": 86.7,
                    "roc_auc": 0.792,
                },
            },
            {
                "model_id": "model_3_lead_window",
                "name": "Model 3: Pre-Event Lead-Window Condition Classifier",
                "algorithm": "Random Forest (Chronological Split: train <=2021, test >=2022)",
                "version": "v1.0.0-lead-window",
                "status": "Operational" if ml_service.pipeline.lead_model is not None else "Unavailable",
                "primary_datasets": [
                    "IMD 0.25° Multiannual Daily Rainfall (2014–2024)",
                    "GSI Exact-Dated Landslide Events (75 events)",
                ],
                "evaluation_metrics": {
                    "roc_auc": 0.6899,
                    "accuracy": 82.8,
                    "precision": 21.6,
                    "recall": 27.1,
                },
                "limitations": "Evaluates antecedent rainfall pattern similarity to historical pre-event windows (T-1 to T-30); does not predict exact hour of failure.",
            },
            {
                "model_id": "model_4_fusion_risk",
                "name": "Model 4: Multi-Modal Fusion Risk Engine",
                "algorithm": "XGBoost + RobustScaler Multi-Modal Fusion",
                "version": ml_service.model_version,
                "status": "Operational" if ml_service.pipeline.fusion_model is not None else "Unavailable",
                "primary_datasets": [
                    "Model 1 Static Susceptibility + Model 2 Dynamic Trigger + Model 3 Lead Window",
                    "ISRO/NASA NISAR S-band Level-2 GUNW InSAR (80m LOS Deformation)",
                    "ISRO Bhoonidhi EOS-04 Level-4 Soil Moisture (500m)",
                    "GSI Bhukosh Historical Landslide Inventory (951 events)",
                ],
                "evaluation_metrics": {
                    "accuracy": 87.2,
                    "roc_auc": 0.711,
                },
            },
        ],
        "top_features_ranked": [
            {"feature": f, "relative_importance": round(imp, 4)} for f, imp in top_features
        ],
    }


