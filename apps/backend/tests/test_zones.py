"""Tests for GIS monitoring zones endpoints."""

def test_list_zones(client):
    """Verify listing all monitored NER zones."""
    response = client.get("/api/v1/zones")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) >= 5
    assert any(z["district"] == "East Khasi Hills" for z in zones)
    assert any(z["district"] == "Ri-Bhoi" for z in zones)


def test_filter_zones_by_state(client):
    """Verify filtering zones by state."""
    response = client.get("/api/v1/zones?state=Meghalaya")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) >= 2
    assert all(z["state"] == "Meghalaya" for z in zones)


def test_get_zone_detail(client):
    """Verify zone detail with explainability factors and village infrastructure."""
    response = client.get("/api/v1/zones/ZONE-EAST-KHASI-HILLS/detail")
    assert response.status_code == 200
    detail = response.json()
    assert detail["zone_id"] == "ZONE-EAST-KHASI-HILLS"
    assert "factors" in detail
    assert detail["factors"]["slope_degrees"] > 25.0


def test_get_zone_risk_mobile(client):
    """Verify lightweight risk endpoint for mobile app."""
    response = client.get("/api/v1/zones/ZONE-EAST-KHASI-HILLS/risk")
    assert response.status_code == 200
    risk = response.json()
    assert risk["zone_id"] == "ZONE-EAST-KHASI-HILLS"
    assert risk["risk_level"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert 0.0 <= risk["risk_score_numeric"] <= 100.0


def test_get_zone_forecast_mobile(client):
    """Verify direct forecast endpoint for mobile app."""
    response = client.get("/api/v1/zones/ZONE-EAST-KHASI-HILLS/forecast")
    assert response.status_code == 200
    forecast = response.json()
    assert forecast["zone_id"] == "ZONE-EAST-KHASI-HILLS"
    assert len(forecast["timeline"]) == 14
