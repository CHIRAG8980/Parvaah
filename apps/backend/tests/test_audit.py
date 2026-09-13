"""Tests for immutable audit trail and CSV compliance export."""

def test_list_audit_log(client):
    """Verify listing audit trail records."""
    response = client.get("/api/v1/audit-log")
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)


def test_export_audit_csv(client):
    """Verify CSV export of audit logs."""
    response = client.get("/api/v1/audit-log/export")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    content = response.text
    assert "Log ID" in content
    assert "Action" in content
