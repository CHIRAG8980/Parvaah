"""Tests for road network status and alternate rerouting."""

def test_list_roads(client):
    """Verify listing monitored road segments with status."""
    response = client.get("/api/v1/roads")
    assert response.status_code == 200
    roads = response.json()
    assert len(roads) >= 4
    assert any(r["status"] == "blocked" for r in roads)


def test_road_reroute_kameng_blocked(client):
    """Verify detour calculation when primary corridor is blocked."""
    response = client.post(
        "/api/v1/roads/reroute",
        json={
            "origin": "Bhalukpong",
            "destination": "Kameng Sector",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["direct_route_status"] == "blocked"
    assert data["alternate_route_available"] is True
    assert "Orang" in data["suggested_route_name"]
    assert len(data["safe_corridor_waypoints"]) > 0


def test_road_reroute_open_corridor(client):
    """Verify normal routing response when no landslides block corridor."""
    response = client.post(
        "/api/v1/roads/reroute",
        json={
            "origin": "Guwahati",
            "destination": "Dispur",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["direct_route_status"] == "open"
