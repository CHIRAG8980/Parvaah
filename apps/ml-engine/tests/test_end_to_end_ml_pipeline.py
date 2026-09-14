import sys
from pathlib import Path
import pytest

_ML_SRC = Path(__file__).resolve().parents[1] / "src"
if str(_ML_SRC) not in sys.path:
    sys.path.insert(0, str(_ML_SRC))

try:
    from inference_pipeline import ParvaahInferencePipeline, InferenceResult
except ImportError:
    from src.inference_pipeline import ParvaahInferencePipeline, InferenceResult


@pytest.fixture(scope="module")
def pipeline():
    return ParvaahInferencePipeline()


def test_inference_pipeline_initialization(pipeline):
    assert pipeline.static_model is not None, "Static susceptibility model not loaded"
    assert pipeline.lead_model is not None, "Lead window classifier not loaded"
    assert pipeline.fusion_model is not None, "Fusion risk model not loaded"


def test_dry_condition_inference(pipeline):
    res = pipeline.predict(
        slope_deg=10.0,
        rainfall_24h_mm=0.0,
        rainfall_72h_mm=0.0,
        rainfall_antecedent_7d_mm=0.0,
        static_features={
            "elevation": 800.0, "slope": 10.0, "aspect": 180.0, "curvature": 5.0,
            "bhuvan_lulc": 140.0, "bhuvan_geomorphology": 210.0, "bhuvan_lineament": 240.0,
            "distance_to_road": 1500.0, "distance_to_streams": 100.0, "distance_to_settlements": 4000.0
        }
    )

    assert isinstance(res, InferenceResult)
    assert res.risk_level in ["LOW", "MEDIUM"]
    assert res.fused_risk_score < 40.0
    assert res.models["dynamic_hazard"]["trigger_state"] == "BASELINE"
    assert res.models["static_susceptibility"]["status"] == "AVAILABLE"
    assert res.models["lead_window"]["status"] == "AVAILABLE"
    assert res.models["fusion"]["status"] == "AVAILABLE"
    assert res.data_availability["soil_moisture_eos04"]["status"] == "UNAVAILABLE"
    assert res.data_availability["insar_nisar"]["status"] == "UNAVAILABLE"


def test_extreme_monsoon_trigger_inference(pipeline):
    res = pipeline.predict(
        slope_deg=38.0,
        rainfall_24h_mm=185.0,
        rainfall_72h_mm=380.0,
        rainfall_antecedent_7d_mm=620.0,
        rainfall_14d_mm=950.0,
        rainfall_30d_mm=1400.0,
        static_features={
            "elevation": 1400.0, "slope": 38.0, "aspect": 190.0, "curvature": 25.0,
            "bhuvan_lulc": 120.0, "bhuvan_geomorphology": 220.0, "bhuvan_lineament": 250.0,
            "distance_to_road": 200.0, "distance_to_streams": 40.0, "distance_to_settlements": 800.0
        }
    )

    assert isinstance(res, InferenceResult)
    assert res.risk_level in ["HIGH", "CRITICAL"]
    assert res.fused_risk_score >= 55.0
    assert res.models["dynamic_hazard"]["trigger_state"] in ["WARNING_TRIGGER", "CRITICAL_TRIGGER"]
    assert res.time_to_failure_window is not None
    assert len(res.contributing_factors) > 0


def test_controlled_multimodal_feature_consumption_sensitivity(pipeline):
    """
    Controlled Feature-Consumption Sensitivity Test:
    Verifies Model 4 feature vector transformation and heuristic integration when
    supplied with controlled scenario values for InSAR pairwise LOS displacement (-42 mm)
    and soil moisture (38.5%).
    NOTE: This is a controlled ablation test; these inputs are manually specified parameters,
    not live observed satellite rasters.
    """
    res = pipeline.predict(
        slope_deg=32.0,
        rainfall_24h_mm=65.0,
        rainfall_72h_mm=140.0,
        rainfall_antecedent_7d_mm=210.0,
        soil_moisture_pct=38.5,
        nisar_los_deformation_m=-0.042,
        nisar_coherence=0.74,
        static_features={
            "elevation": 1200.0, "slope": 32.0, "aspect": 170.0, "curvature": 15.0,
            "bhuvan_lulc": 130.0, "bhuvan_geomorphology": 215.0, "bhuvan_lineament": 245.0,
            "distance_to_road": 450.0, "distance_to_streams": 80.0, "distance_to_settlements": 1500.0
        }
    )

    assert res.data_availability["soil_moisture_eos04"]["status"] == "AVAILABLE"
    assert res.data_availability["insar_nisar"]["status"] == "AVAILABLE"
    assert res.data_availability["insar_nisar"]["quality"] == "GOOD"
    assert any("NISAR" in f for f in res.contributing_factors)
    assert any("EOS-04" in f for f in res.contributing_factors)


def test_real_observed_satellite_data_e2e(pipeline):
    """
    Real Observed Satellite-Data End-to-End Test:
    Performs fully automatic geospatial inference at authentic coordinate in Meghalaya
    where real on-disk CartoDEM 30m, Bhuvan 1:50k, and IMD raster grids are ingested from disk.
    Does NOT supply manual environmental or satellite values.
    """
    # Authentic coordinate in Meghalaya (East Khasi Hills / Shillong Plateau)
    lat, lon = 25.5788, 91.8933
    res = pipeline.predict(lat=lat, lon=lon)

    assert isinstance(res, InferenceResult)
    assert res.risk_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert res.fused_risk_score is not None
    assert res.confidence_score is not None
    assert res.models["static_susceptibility"]["status"] == "AVAILABLE"
    assert res.models["dynamic_hazard"]["status"] == "AVAILABLE"
    assert res.models["lead_window"]["status"] == "AVAILABLE"
    assert res.models["fusion"]["status"] == "AVAILABLE"

