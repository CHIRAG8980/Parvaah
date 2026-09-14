"""Automated compliance test suite ensuring STRICT Indian Primary Source policy.

Fails if:
- Open-Meteo appears in backend or web runtime code
- OpenStreetMap / Nominatim appears in runtime code
- USGS appears in runtime code
- Sentinel-1 or Sentinel-2 are used as runtime active model inputs
- Fake / default sensor values (-12 mm/yr InSAR, 75% soil moisture) exist
- Mock seed alerts exist
- Synthetic fallback values exist
"""

import os
import re
from pathlib import Path
import pytest
from app.services.ml_service import ml_service
from app.database import SessionLocal, init_db
from app.models.zone import Zone, TerrainFeature
from app.models.alert import Alert


def test_no_open_meteo_in_backend_runtime():
    """Verify that Open-Meteo does not appear in backend runtime python code."""
    backend_app_dir = Path(__file__).resolve().parents[1] / "app"
    forbidden_pattern = re.compile(r"open-meteo\.com|api\.open-meteo", re.IGNORECASE)

    violations = []
    for py_file in backend_app_dir.rglob("*.py"):
        content = py_file.read_text(encoding="utf-8")
        if forbidden_pattern.search(content):
            violations.append(str(py_file))

    assert not violations, f"Forbidden Open-Meteo reference found in runtime code: {violations}"


def test_no_open_meteo_in_web_runtime():
    """Verify that Open-Meteo does not appear in frontend components."""
    web_src_dir = Path(__file__).resolve().parents[3] / "apps" / "web" / "src"
    forbidden_pattern = re.compile(r"open-meteo\.com|api\.open-meteo", re.IGNORECASE)

    violations = []
    for ts_file in web_src_dir.rglob("*.tsx"):
        content = ts_file.read_text(encoding="utf-8")
        if forbidden_pattern.search(content):
            violations.append(str(ts_file))

    assert not violations, f"Forbidden Open-Meteo reference found in frontend code: {violations}"


def test_no_nominatim_in_web_runtime():
    """Verify that OpenStreetMap Nominatim does not appear in frontend code."""
    web_src_dir = Path(__file__).resolve().parents[3] / "apps" / "web" / "src"
    forbidden_pattern = re.compile(r"nominatim\.openstreetmap\.org", re.IGNORECASE)

    violations = []
    for ts_file in web_src_dir.rglob("*.tsx"):
        content = ts_file.read_text(encoding="utf-8")
        if forbidden_pattern.search(content):
            violations.append(str(ts_file))

    assert not violations, f"Forbidden Nominatim OSM reference found in frontend code: {violations}"


def test_no_usgs_in_backend_runtime():
    """Verify that USGS does not appear in backend runtime data sources."""
    backend_app_dir = Path(__file__).resolve().parents[1] / "app"
    forbidden_pattern = re.compile(r"earthquake\.usgs\.gov", re.IGNORECASE)

    violations = []
    for py_file in backend_app_dir.rglob("*.py"):
        content = py_file.read_text(encoding="utf-8")
        if forbidden_pattern.search(content):
            violations.append(str(py_file))

    assert not violations, f"Forbidden USGS reference found in runtime code: {violations}"


def test_no_fake_sensor_defaults_in_ml_service():
    """Verify that ml_service does not inject fake InSAR or soil moisture defaults."""
    score, level, conf, min_d, max_d, factors, conf_score = ml_service.predict_risk(
        slope_deg=30.0,
        rainfall_24h_mm=0.0,
        rainfall_72h_mm=0.0,
        insar_deformation_mm_yr=None,
        soil_moisture_pct=None,
    )

    assert factors.insar_deformation_mm_yr == 0.0
    assert factors.soil_moisture_pct == 0.0
    factors_str = " ".join(factors.top_factors).lower()
    assert "weight 0" in factors_str or "disabled" in factors_str or "normal" in factors_str


def test_no_mock_seed_alerts_in_db():
    """Verify that database does not contain ALT-SEED mock alerts."""
    init_db()
    db = SessionLocal()
    try:
        mock_alerts = db.query(Alert).filter(Alert.alert_id.like("%SEED%")).all()
        assert len(mock_alerts) == 0, f"Found mock seed alerts in database: {[a.alert_id for a in mock_alerts]}"
    finally:
        db.close()


def test_indian_primary_provenance_in_terrain_features():
    """Verify that loaded terrain features record official Indian government source provenance."""
    init_db()
    db = SessionLocal()
    try:
        tfs = db.query(TerrainFeature).all()
        for tf in tfs:
            assert tf.ml_features_source == "isro_cartodem_nrsc_bhuvan_30m"
            assert tf.ml_ndvi is None
            assert tf.ml_sar_coherence is None
            assert tf.ml_sar_intensity is None
            assert tf.ml_sar_ratio is None
    finally:
        db.close()


def test_model_3_lead_window_operational():
    """Verify that Model 3 (Pre-Event Lead-Window Classifier) is loaded and operational."""
    assert ml_service.lead_window_model is not None, "Model 3 artifact lead_window_model.pkl not loaded"
    prob, desc = ml_service.predict_lead_window(
        rainfall_1d=15.0,
        rainfall_3d=45.0,
        rainfall_7d=110.0,
        rainfall_14d=230.0,
        rainfall_30d=480.0,
    )
    assert prob is not None
    assert 0.0 <= prob <= 1.0
    assert isinstance(desc, str)
    assert len(desc) > 10


def test_nisar_units_and_quality_classification():
    """Verify NISAR pairwise LOS deformation units and coherence quality threshold classification."""
    from inference_pipeline import classify_nisar_quality

    # High coherence -> GOOD (full weight)
    q_good, w_good = classify_nisar_quality(-0.045, 0.75)
    assert q_good == "GOOD"
    assert w_good == 1.0

    # Moderate coherence -> MODERATE (scaled weight)
    q_mod, w_mod = classify_nisar_quality(-0.045, 0.30)
    assert q_mod == "MODERATE"
    assert 0.0 < w_mod < 1.0

    # Low coherence -> LOW_QUALITY (fusion weight = 0)
    q_low, w_low = classify_nisar_quality(-0.296, 0.075)
    assert q_low == "LOW_QUALITY"
    assert w_low == 0.0

    # Missing -> NOT_APPLICABLE (fusion weight = 0)
    q_none, w_none = classify_nisar_quality(None, None)
    assert q_none == "NOT_APPLICABLE"
    assert w_none == 0.0

    # Check that low-coherence NISAR does not artificially inflate risk
    res_clean = ml_service.pipeline.evaluate_fusion_risk(
        slope_deg=28.0,
        rainfall_24h_mm=30.0,
        rainfall_72h_mm=60.0,
        rainfall_antecedent_7d_mm=100.0,
        static_susc_prob=0.5,
        dynamic_hazard_score=0.3,
        lead_window=ml_service.pipeline.evaluate_lead_window(30.0, 60.0, 100.0),
        nisar_los_deformation_m=None,
        nisar_coherence=None,
    )

    res_low_q = ml_service.pipeline.evaluate_fusion_risk(
        slope_deg=28.0,
        rainfall_24h_mm=30.0,
        rainfall_72h_mm=60.0,
        rainfall_antecedent_7d_mm=100.0,
        static_susc_prob=0.5,
        dynamic_hazard_score=0.3,
        lead_window=ml_service.pipeline.evaluate_lead_window(30.0, 60.0, 100.0),
        nisar_los_deformation_m=-0.296, # -296 mm noisy phase
        nisar_coherence=0.075,          # Low coherence
    )

    # Risk score should not be boosted by low coherence observation
    assert abs(res_low_q.score - res_clean.score) < 0.5


def test_model_3_scientific_pre_event_similarity_semantics():
    """Verify Model 3 semantics strictly indicate historical condition similarity, not deterministic countdown."""
    out_crit = ml_service.pipeline.evaluate_lead_window(120.0, 250.0, 350.0)
    assert "Critical Pre-Event Condition Similarity" in out_crit.description
    assert "pattern match" in out_crit.description.lower()
    assert out_crit.lead_days_min == 1 and out_crit.lead_days_max == 3

    out_elev = ml_service.pipeline.evaluate_lead_window(45.0, 120.0, 200.0)
    assert "Elevated Antecedent Buildup Similarity" in out_elev.description
    assert out_elev.lead_days_min == 7 and out_elev.lead_days_max == 14

    out_base = ml_service.pipeline.evaluate_lead_window(0.0, 0.0, 0.0)
    assert "Baseline Non-Triggering" in out_base.description
    assert out_base.lead_days_min is None


def test_strict_geographic_domain_enforcement():
    """Verify out-of-domain coordinates return OUT_OF_COVERAGE with null scores and OUT_OF_COVERAGE risk level."""
    # Delhi coordinate (28.6139, 77.2090) - Far out of domain
    res_delhi = ml_service.pipeline.predict(
        lat=28.6139,
        lon=77.2090,
        rainfall_24h_mm=150.0,
        rainfall_72h_mm=300.0,
        zone_id="ZONE-DELHI-TEST",
    )
    assert res_delhi.data_availability["geographic_coverage"]["status"] == "OUT_OF_COVERAGE"
    assert res_delhi.confidence_score is None
    assert res_delhi.fused_risk_score is None
    assert res_delhi.risk_level == "OUT_OF_COVERAGE"
    assert res_delhi.confidence_level == "OUT_OF_COVERAGE"
    assert res_delhi.models["fusion"]["score"] is None
    assert res_delhi.models["fusion"]["risk_level"] == "OUT_OF_COVERAGE"
    assert res_delhi.models["static_susceptibility"]["status"] == "OUT_OF_COVERAGE"
    assert "OUT OF COVERAGE" in res_delhi.contributing_factors[0]

    # Coordinate inside rectangular bbox corner but outside actual Meghalaya AOI polygon
    # (Lat: 24.60, Lon: 89.60) - Bangladesh plains south-west of Garo Hills
    res_corner = ml_service.pipeline.predict(
        lat=24.60,
        lon=89.60,
        rainfall_24h_mm=50.0,
        rainfall_72h_mm=100.0,
    )
    assert res_corner.risk_level == "OUT_OF_COVERAGE"
    assert res_corner.fused_risk_score is None
    assert res_corner.confidence_score is None


def test_georeference_and_crs_transformation():
    """Verify raster sampling correctly handles EPSG:4326 to EPSG:32645 reprojection."""
    from pathlib import Path
    nisar_path = Path("apps/ml-engine/data/processed/features/NISAR/nisar_gunw_20260709_20260721_los_deformation_80m.tif")
    if nisar_path.exists():
        # Valid point in Meghalaya UTM 45N footprint
        val_in = ml_service.pipeline.sample_raster_at_coords(nisar_path, 25.3600, 90.6846)
        assert val_in is not None
        assert isinstance(val_in, float)

        # Point outside footprint
        val_out = ml_service.pipeline.sample_raster_at_coords(nisar_path, 25.5788, 91.8933)
        assert val_out is None


def test_source_provenance_wording_accuracy():
    """Verify precise governance wording regarding ISRO and ISRO-NASA joint mission data."""
    res = ml_service.pipeline.predict(
        lat=25.5788,
        lon=91.8933,
        rainfall_24h_mm=50.0,
        rainfall_72h_mm=100.0,
    )
    prov = res.data_availability.get("operational_provenance", "")
    assert "ISRO-NASA joint mission" in prov
    assert "Bhoonidhi" in prov
    nisar_source = res.data_availability.get("insar_nisar", {}).get("source", "")
    assert "ISRO-NASA" in nisar_source

