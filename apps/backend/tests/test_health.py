"""Tests for root and health check endpoints."""

def test_health_check(client):
    """Verify backend health returns 200 and operational status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["region"] == "NER India"


def test_root_endpoint(client):
    """Verify root landing endpoint points to docs and API prefix."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "/docs" in data["docs_url"]
    assert data["api_v1_prefix"] == "/api/v1"
