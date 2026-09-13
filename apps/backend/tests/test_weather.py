"""Tests for weather forecasting and rainfall ingestion."""

def test_weather_forecast(client):
    """Verify 14-day rainfall timeline comparing IMD and community gauges."""
    response = client.get("/api/v1/weather/forecast?zone_id=NER-MEG-001")
    assert response.status_code == 200
    forecast = response.json()
    assert forecast["zone_id"] == "NER-MEG-001"
    assert len(forecast["timeline"]) == 14
    assert forecast["community_gauges_count"] >= 1


def test_ingest_rainfall_reading(client):
    """Verify ingestion of real-time rainfall data."""
    response = client.post(
        "/api/v1/weather/readings",
        json={
            "source_type": "community_gauge",
            "source_id": "cg-sohra-04",
            "zone_id": "NER-MEG-001",
            "rainfall_mm": 18.5,
            "cumulative_1hr_mm": 24.0,
            "cumulative_24hr_mm": 165.0,
            "cumulative_72hr_mm": 310.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["rainfall_mm"] == 18.5
