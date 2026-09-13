"""Tests for ML serving, what-if simulations, and feedback loop."""

def test_predict_zone_risk(client):
    """Verify live inference for monitoring zone."""
    response = client.get("/api/v1/predict/zone/ZONE-EAST-KHASI-HILLS")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-EAST-KHASI-HILLS"
    assert 0.0 <= data["risk_score"] <= 100.0
    assert "explainability" in data


def test_simulate_hazard(client):
    """Verify what-if simulation response under extreme rainfall."""
    response = client.post(
        "/api/v1/predict/simulate",
        json={
            "rainfall24h_mm": 210.0,
            "rainfall72h_cumulative_mm": 390.0,
            "slope_degrees": 42.0,
            "soil_moisture_pct": 92.0,
            "insar_deformation_mm_yr": -26.0,
            "ndvi_index": 0.35,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score_numeric"] >= 80.0
    assert data["risk_level"] == "CRITICAL"
    assert "days" in data["time_to_failure_estimate"]


def test_model_version(client):
    """Verify active model metadata endpoint."""
    response = client.get("/api/v1/predict/model/version")
    assert response.status_code == 200
    data = response.json()
    assert "active_model_version" in data
    assert "architecture" in data


def test_feedback_outcome(client):
    """Verify submitting post-event validation feedback."""
    response = client.post(
        "/api/v1/predict/feedback/outcome?zone_id=ZONE-EAST-KHASI-HILLS&actual_outcome=landslide_occurred&officer_notes=Road%20blocked"
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"
