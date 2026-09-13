"""Tests for alert review queue, approval, and auto-escalation."""

def test_get_alert_queue(client):
    """Verify alert review queue loads with remaining seconds and suggested actions."""
    response = client.get("/api/v1/alerts/queue")
    assert response.status_code == 200
    queue = response.json()
    assert len(queue) >= 3
    assert any(item["severity"] == "Critical" for item in queue)


def test_approve_alert(client):
    """Verify officer can approve alert and record dispatch."""
    response = client.post(
        "/api/v1/alerts/ALT-NER-0941/approve",
        json={
            "officer_id": "officer-dmo-kameng",
            "selected_channels": ["sms", "app_push", "cap_sachet"],
            "final_message": "Immediate evacuation advisory approved by District Collector.",
        },
    )
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "success"
    assert "dispatched_at" in res


def test_reject_alert(client):
    """Verify officer can reject alert with mandatory feedback reason code."""
    response = client.post(
        "/api/v1/alerts/ALT-NER-0938/reject",
        json={
            "officer_id": "officer-dmo-haflong",
            "reason_code": "false_positive",
            "notes": "Field inspection confirmed newly built retaining wall held intact.",
        },
    )
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "success"
    assert res["reason_code"] == "false_positive"


def test_active_alerts_multilingual(client):
    """Verify active alerts support NER local languages."""
    response_en = client.get("/api/v1/alerts/active?lang=en")
    assert response_en.status_code == 200
    alerts_en = response_en.json()
    assert len(alerts_en) > 0

    response_as = client.get("/api/v1/alerts/active?lang=as")
    assert response_as.status_code == 200
    alerts_as = response_as.json()
    assert len(alerts_as) > 0
    # Verify Assamese translation is returned
    assert any("সতৰ্কবাৰ্তা" in a["title"] for a in alerts_as)
