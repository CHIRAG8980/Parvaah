"""Machine learning inference, hazard prediction, and lead-window classification service.

STRICT INDIAN PRIMARY DATA SOURCE COMPLIANCE
=============================================
This service computes landslide risk strictly using verified Indian government
and public institutional primary datasets:
  - Topography / Slopes / Elevation: ISRO/NRSC CartoDEM 30m (Cartosat-1 stereo DEM)
  - Geology / Geomorphology / LULC: ISRO NRSC Bhuvan 1:50,000 spatial layers
  - Rainfall (1d, 3d, 7d, 14d, 30d): India Meteorological Department (IMD / MoES) 0.25° gridded daily
  - Soil Moisture: ISRO/NRSC Bhoonidhi EOS-04 Level-4 Soil Moisture product
  - InSAR Deformation: ISRO/NASA NISAR Level-2 GUNW Interferometric Pair (80m)
  - Landslide Ground Truth: Geological Survey of India (GSI Bhukosh / NLSM Atlas)

MODEL SUITE:
  1. Static Susceptibility (Model 1 - CartoDEM/Bhuvan/PWD 10 features, RandomForest)
  2. Dynamic Hazard / Trigger (Model 2 - IMD multi-scale rainfall trigger, XGBoost)
  3. Pre-Event Lead-Window Condition (Model 3 - Historical antecedent saturation similarity, RandomForest)
  4. Multi-Modal Fusion Risk (Model 4 - 19-feature XGBoost/FusionRiskModel + RobustScaler)
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Any, Optional

from app.config import settings
from app.schemas.common import RiskLevel, ConfidenceLevel
from app.schemas.risk import (
    ExplainabilityFactors,
    StaticSusceptibilityDetails,
    DynamicHazardDetails,
    LeadWindowDetails,
    FusionDetails,
    ModelsBreakdown,
)

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger("parvaah.ml_service")

# Ensure ml-engine src is discoverable
ML_SRC = settings.WORKSPACE_ROOT / "apps" / "ml-engine" / "src"
if ML_SRC.exists() and str(ML_SRC) not in sys.path:
    sys.path.insert(0, str(ML_SRC))

try:
    from inference_pipeline import ParvaahInferencePipeline, InferenceResult
except ImportError:
    logger.warning("Could not import ParvaahInferencePipeline from inference_pipeline.py directly. Retrying relative path...")
    sys.path.append(str(settings.WORKSPACE_ROOT / "apps" / "ml-engine"))
    from src.inference_pipeline import ParvaahInferencePipeline, InferenceResult


class MLService:
    """Manages ML model serving, trained model pipeline, and explainability under Indian data compliance."""

    def __init__(self) -> None:
        self.pipeline = ParvaahInferencePipeline()
        self.model_version: str = "v2.0.0-parvaah-sovereign-indian"
        self.feature_names: list[str] = [
            "aspect", "bhuvan_geomorphology_shillong", "bhuvan_lineament_shillong",
            "bhuvan_lulc_shillong", "curvature", "distance_to_road",
            "distance_to_settlements", "distance_to_streams", "dynamic_hazard_alert_DOY235",
            "elevation", "ndvi_shillong", "rainfall_24h", "rainfall_72h",
            "rainfall_antecedent_7d", "sar_coherence_shillong", "sar_intensity_shillong",
            "sar_ratio_shillong", "slope", "static_susceptibility_map",
        ]

    @property
    def model(self) -> object | None:
        return self.pipeline.fusion_model

    @property
    def preprocessor(self) -> object | None:
        return self.pipeline.fusion_preprocessor

    @property
    def lead_window_model(self) -> object | None:
        return self.pipeline.lead_model

    def get_feature_importances(self) -> dict[str, float]:
        """Return trained model feature importances from XGBoost gain."""
        if self.pipeline.fusion_model and hasattr(self.pipeline.fusion_model, "get_feature_importance"):
            try:
                return self.pipeline.fusion_model.get_feature_importance()
            except Exception:
                pass
        return {f: round(1.0 / len(self.feature_names), 4) for f in self.feature_names}

    def predict_lead_window(
        self,
        rainfall_1d: float,
        rainfall_3d: float,
        rainfall_7d: float,
        rainfall_14d: float,
        rainfall_30d: float,
    ) -> tuple[float | None, str]:
        """Evaluate pre-event lead-window similarity using Model 3."""
        lead_out = self.pipeline.evaluate_lead_window(
            rainfall_1d=rainfall_1d,
            rainfall_3d=rainfall_3d,
            rainfall_7d=rainfall_7d,
            rainfall_14d=rainfall_14d,
            rainfall_30d=rainfall_30d,
        )
        return lead_out.similarity_score, lead_out.description

    def predict_unified(
        self,
        slope_deg: float,
        rainfall_24h_mm: float,
        rainfall_72h_mm: float = 0.0,
        rainfall_antecedent_7d_mm: Optional[float] = None,
        rainfall_14d_mm: Optional[float] = None,
        rainfall_30d_mm: Optional[float] = None,
        soil_moisture_pct: Optional[float] = None,
        nisar_los_deformation_m: Optional[float] = None,
        nisar_coherence: Optional[float] = None,
        static_features: Optional[dict[str, float]] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        zone_id: Optional[str] = None,
        zone_name: Optional[str] = None,
        district: Optional[str] = None,
    ) -> InferenceResult:
        """Run complete 4-model inference pipeline."""
        return self.pipeline.predict(
            slope_deg=slope_deg,
            rainfall_24h_mm=rainfall_24h_mm,
            rainfall_72h_mm=rainfall_72h_mm,
            rainfall_antecedent_7d_mm=rainfall_antecedent_7d_mm,
            rainfall_14d_mm=rainfall_14d_mm,
            rainfall_30d_mm=rainfall_30d_mm,
            soil_moisture_pct=soil_moisture_pct,
            nisar_los_deformation_m=nisar_los_deformation_m,
            nisar_coherence=nisar_coherence,
            static_features=static_features,
            lat=lat,
            lon=lon,
            zone_id=zone_id,
            zone_name=zone_name,
            district=district,
        )

    def predict_risk(
        self,
        slope_deg: float,
        rainfall_24h_mm: float,
        rainfall_72h_mm: float = 0.0,
        insar_deformation_mm_yr: float | None = None,
        ndvi_index: float | None = None,
        soil_moisture_pct: float | None = None,
        rainfall_antecedent_7d_mm: float | None = None,
        rainfall_14d_mm: float | None = None,
        rainfall_30d_mm: float | None = None,
        static_features: dict[str, float] | None = None,
        lat: float | None = None,
        lon: float | None = None,
    ) -> tuple[float, RiskLevel, ConfidenceLevel, int | None, int | None, ExplainabilityFactors, float]:
        """Evaluate full multi-modal risk and return standard 7-tuple.

        The 7th element is the real model-computed confidence score (0-1),
        as opposed to `conf` (the 3rd element) which is only the bucketed
        ConfidenceLevel. Callers persisting a RiskScore record should use
        the raw float, not a hardcoded constant keyed off the bucket.
        """
        nisar_m = (insar_deformation_mm_yr / 1000.0) if insar_deformation_mm_yr is not None else None
        res = self.predict_unified(
            slope_deg=slope_deg,
            rainfall_24h_mm=rainfall_24h_mm,
            rainfall_72h_mm=rainfall_72h_mm,
            rainfall_antecedent_7d_mm=rainfall_antecedent_7d_mm,
            rainfall_14d_mm=rainfall_14d_mm,
            rainfall_30d_mm=rainfall_30d_mm,
            soil_moisture_pct=soil_moisture_pct,
            nisar_los_deformation_m=nisar_m,
            static_features=static_features,
            lat=lat,
            lon=lon,
        )

        risk_level = RiskLevel(res.risk_level)
        conf_level = ConfidenceLevel(res.confidence_level.lower())

        lead_m = res.models["lead_window"]
        min_days = lead_m.get("lead_days_min")
        max_days = lead_m.get("lead_days_max")

        factors = ExplainabilityFactors(
            slope_degrees=slope_deg,
            rainfall24h_mm=rainfall_24h_mm,
            rainfall72h_cumulative_mm=rainfall_72h_mm,
            insar_deformation_mm_yr=insar_deformation_mm_yr or 0.0,
            ndvi_index=ndvi_index or 0.0,
            soil_moisture_pct=soil_moisture_pct or 0.0,
            top_factors=res.contributing_factors,
        )

        return (
            res.fused_risk_score,
            risk_level,
            conf_level,
            min_days,
            max_days,
            factors,
            res.confidence_score,
        )

    def predict_risk_for_zone(
        self,
        db: Session,
        zone_id: str,
        rainfall_24h_mm: float,
        rainfall_72h_mm: float,
        rainfall_antecedent_7d_mm: float | None = None,
        rainfall_14d_mm: float | None = None,
        rainfall_30d_mm: float | None = None,
    ) -> tuple[float, RiskLevel, ConfidenceLevel, int | None, int | None, ExplainabilityFactors, float]:
        """Fetch Indian primary features from DB for zone and evaluate risk."""
        from app.models.zone import Zone, TerrainFeature

        zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
        slope = zone.avg_slope_deg if zone else 0.0
        lat = zone.latitude if zone else None
        lon = zone.longitude if zone else None

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

        return self.predict_risk(
            slope_deg=slope,
            rainfall_24h_mm=rainfall_24h_mm,
            rainfall_72h_mm=rainfall_72h_mm,
            rainfall_antecedent_7d_mm=rainfall_antecedent_7d_mm,
            rainfall_14d_mm=rainfall_14d_mm,
            rainfall_30d_mm=rainfall_30d_mm,
            static_features=static_features if static_features else None,
            lat=lat,
            lon=lon,
        )


ml_service = MLService()
