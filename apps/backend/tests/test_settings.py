"""Tests for system settings GET and PUT endpoints."""

import pytest


def test_get_settings(client):
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password123"},
    )
    response = client.get("/api/v1/settings")
    assert response.status_code == 200
    data = response.json()
    assert "rainfall_warning" in data
    assert "rainfall_critical" in data
    assert "channels" in data
    assert isinstance(data["rainfall_warning"], (int, float))


def test_update_settings(client):
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password123"},
    )
    payload = {
        "rainfall_warning": 62.5,
        "rainfall_critical": 125.0,
        "insar_velocity": 18.2,
        "soil_saturation": 82.0,
        "edge_failover": True,
        "channels": {
            "ndmaCap": True,
            "whatsappSdma": True,
            "smsDisasterRelay": True,
            "broRadioPush": False,
            "sirenCivilDefense": True,
            "emailBulletin": True,
        },
    }
    response = client.put("/api/v1/settings", json=payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated["rainfall_warning"] == 62.5
    assert updated["rainfall_critical"] == 125.0
    assert updated["channels"]["sirenCivilDefense"] is True
    assert updated["channels"]["broRadioPush"] is False
