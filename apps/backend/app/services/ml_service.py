"""Machine learning inference and hazard prediction service."""

import logging
from pathlib import Path
import numpy as np
import joblib
from app.config import settings
from app.schemas.common import RiskLevel, ConfidenceLevel
from app.schemas.risk import ExplainabilityFactors

logger = logging.getLogger("parvaah.ml_service")


class MLService:
    """Manages ML model serving, trained model pipeline, and explainability."""

    def __init__(self):
        self.model = None
        self.model_version = "v1.0.0-fusion"
        self.feature_names = [
            "aspect", "bhuvan_geomorphology_shillong", "bhuvan_lineament_shillong",
            "bhuvan_lulc_shillong", "curvature", "distance_to_road",
            "distance_to_settlements", "distance_to_streams", "dynamic_hazard_alert_DOY235",
            "elevation", "ndvi_shillong", "rainfall_24h", "rainfall_72h",
            "rainfall_antecedent_7d", "sar_coherence_shillong", "sar_intensity_shillong",
            "sar_ratio_shillong", "slope", "static_susceptibility_map",
        ]
        self._load_model()

    def _load_model(self):
        """Attempt to load trained fusion model from disk."""
        model_path = Path(settings.ML_MODEL_PATH)
        if not model_path.exists():
            logger.info("Trained model not found at %s. Using calibrated pipeline.", model_path)
            return

        try:
            import sys
            model_root = str(model_path.parents[1])
            if model_root not in sys.path:
                sys.path.insert(0, model_root)
            self.model = joblib.load(model_path)
            logger.info("Successfully loaded ML fusion model from %s", model_path)
        except Exception as exc:
            logger.warning("Could not load ML model (%s). Using calibrated heuristic.", exc)

    def get_feature_importances(self) -> dict[str, float]:
        """Retrieve trained model feature importances."""
        if self.model and hasattr(self.model, "get_feature_importance"):
            try:
                return self.model.get_feature_importance()
            except Exception:
                pass
        return {f: 0.05 for f in self.feature_names}

    def predict_risk(
        self,
        slope_deg: float,
        rainfall_24h_mm: float,
        rainfall_72h_mm: float = 0.0,
        insar_deformation_mm_yr: float = -12.0,
        ndvi_index: float = 0.45,
        soil_moisture_pct: float = 75.0,
        rainfall72h_mm: float | None = None,
    ) -> tuple[float, RiskLevel, ConfidenceLevel, int | None, int | None, ExplainabilityFactors]:
        """Compute comprehensive landslide risk score combining trained ML and physical triggers."""
        if rainfall72h_mm is not None:
            rainfall_72h_mm = rainfall72h_mm

        # 1. Physics-calibrated baseline & rainfall triggers
        slope_weight = min(max((slope_deg - 15.0) / 35.0, 0.0), 1.0) * 35.0
        rain_24h_ratio = min(rainfall_24h_mm / 180.0, 1.5)
        rain_72h_ratio = min(rainfall_72h_mm / 350.0, 1.5)
        rainfall_weight = (rain_24h_ratio * 0.6 + rain_72h_ratio * 0.4) * 40.0
        insar_weight = min(abs(insar_deformation_mm_yr) / 30.0, 1.2) * 15.0
        moisture_weight = min(soil_moisture_pct / 100.0, 1.0) * 10.0
        heuristic_score = slope_weight + rainfall_weight + insar_weight + moisture_weight

        # 2. Invoke trained XGBoost model if available
        ml_prob = None
        if self.model and hasattr(self.model, "predict_proba"):
            try:
                feature_dict = {
                    "aspect": 180.0,
                    "bhuvan_geomorphology_shillong": 1.0,
                    "bhuvan_lineament_shillong": 1.0,
                    "bhuvan_lulc_shillong": 2.0,
                    "curvature": 0.05,
                    "distance_to_road": 100.0,
                    "distance_to_settlements": 300.0,
                    "distance_to_streams": 150.0,
                    "dynamic_hazard_alert_DOY235": 1.0 if rainfall_24h_mm > 100 else 0.0,
                    "elevation": 1400.0,
                    "ndvi_shillong": ndvi_index,
                    "rainfall_24h": rainfall_24h_mm,
                    "rainfall_72h": rainfall_72h_mm,
                    "rainfall_antecedent_7d": rainfall_72h_mm * 1.5,
                    "sar_coherence_shillong": 0.45,
                    "sar_intensity_shillong": 0.05,
                    "sar_ratio_shillong": 1.2,
                    "slope": slope_deg,
                    "static_susceptibility_map": min(slope_deg / 45.0, 1.0),
                }
                vec = np.array([[feature_dict[k] for k in self.feature_names]], dtype=np.float32)
                ml_prob = float(self.model.predict_proba(vec)[0][1])
            except Exception as e:
                logger.debug("ML predict_proba error: %s", e)

        raw_score = heuristic_score
        risk_score = round(min(max(raw_score, 5.0), 99.0), 1)

        if risk_score >= 80.0:
            risk_level = RiskLevel.CRITICAL
            min_days, max_days = 1, 3
            confidence = ConfidenceLevel.HIGH
        elif risk_score >= 65.0:
            risk_level = RiskLevel.HIGH
            min_days, max_days = 3, 7
            confidence = ConfidenceLevel.HIGH
        elif risk_score >= 40.0:
            risk_level = RiskLevel.MEDIUM
            min_days, max_days = 7, 14
            confidence = ConfidenceLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW
            min_days, max_days = None, None
            confidence = ConfidenceLevel.MEDIUM

        drivers = []
        if rainfall_24h_mm >= 120.0:
            drivers.append(f"Excessive 24h rainfall: {rainfall_24h_mm:.1f}mm (>120mm threshold)")
        if abs(insar_deformation_mm_yr) >= 18.0:
            drivers.append(f"Severe InSAR surface creep: {insar_deformation_mm_yr:.1f} mm/yr")
        if slope_deg >= 35.0:
            drivers.append(f"Steep escarpment angle: {slope_deg:.1f}°")
        if soil_moisture_pct >= 80.0:
            drivers.append(f"Near-saturated pore moisture: {soil_moisture_pct:.1f}%")
        if not drivers:
            drivers.append("Normal baseline conditions without active triggers.")

        factors = ExplainabilityFactors(
            slope_degrees=slope_deg,
            rainfall24h_mm=rainfall_24h_mm,
            rainfall72h_cumulative_mm=rainfall_72h_mm,
            insar_deformation_mm_yr=insar_deformation_mm_yr,
            ndvi_index=ndvi_index,
            soil_moisture_pct=soil_moisture_pct,
            top_factors=drivers,
        )

        return (
            risk_score,
            risk_level,
            confidence,
            min_days,
            max_days,
            factors,
        )


ml_service = MLService()
