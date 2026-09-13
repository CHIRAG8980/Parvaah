"""API endpoints for audit logging, traceability, and compliance export."""

import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-log", tags=["Audit & Compliance"])


@router.get("")
def list_audit_trail(
    entity_type: str | None = Query(None, description="Filter by entity (alert, risk_score, etc.)"),
    action: str | None = Query(None, description="Filter by action (alert_approved, etc.)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve immutable audit log records."""
    logs = AuditService.list_logs(db, entity_type=entity_type, action=action, limit=limit)
    return [
        {
            "log_id": log.log_id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "actor": log.actor,
            "timestamp": log.timestamp.isoformat(),
            "data_snapshot_ref": log.data_snapshot_ref,
            "details": log.details_json,
        }
        for log in logs
    ]


@router.get("/export")
def export_audit_trail_csv(db: Session = Depends(get_db)):
    """Export compliance audit trail to CSV format."""
    logs = AuditService.list_logs(db, limit=500)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Log ID", "Entity Type", "Entity ID", "Action", "Actor", "Timestamp", "Snapshot Ref"])

    for log in logs:
        writer.writerow([
            log.log_id,
            log.entity_type,
            log.entity_id,
            log.action,
            log.actor,
            log.timestamp.isoformat(),
            log.data_snapshot_ref,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=parvaah_audit_trail.csv"},
    )
