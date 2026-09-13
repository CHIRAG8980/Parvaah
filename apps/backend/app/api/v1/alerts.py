"""API endpoints for alert review queue, approval, and auto-escalation."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.alert import (
    AlertQueueItem,
    AlertApproveRequest,
    AlertRejectRequest,
    ActiveAlertMobileResponse,
)
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts & Control Room"])


@router.get("/queue", response_model=list[AlertQueueItem])
def get_alert_review_queue(
    status: str | None = Query(None, description="pending_review | approved | rejected | auto_escalated"),
    db: Session = Depends(get_db),
):
    """Retrieve officer review queue with real-time countdown to auto-escalation."""
    return AlertService.get_review_queue(db, status_filter=status)


@router.get("/active", response_model=list[ActiveAlertMobileResponse])
def get_active_alerts(
    zone_id: str | None = Query(None, description="Filter active alerts by zone"),
    lang: str = Query("en", description="Language: en, as, bn, mni, kha, lus, hi"),
    db: Session = Depends(get_db),
):
    """Retrieve active alerts with pre-translated template messages for citizens."""
    return AlertService.get_active_alerts_for_mobile(db, zone_id=zone_id, language=lang)


@router.post("/{alert_id}/approve")
def approve_alert(
    alert_id: str,
    request: AlertApproveRequest,
    db: Session = Depends(get_db),
):
    """Disaster Management Officer approves alert and triggers dissemination pipeline."""
    try:
        alert = AlertService.approve_alert(
            db=db,
            alert_id=alert_id,
            officer_id=request.officer_id,
            final_message=request.final_message,
            channels=request.selected_channels,
        )
        return {
            "status": "success",
            "message": f"Alert {alert_id} approved and dispatched",
            "dispatched_at": alert.dispatched_at,
            "channels": alert.channels_used,
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{alert_id}/reject")
def reject_alert(
    alert_id: str,
    request: AlertRejectRequest,
    db: Session = Depends(get_db),
):
    """Disaster Management Officer rejects alert with mandatory ML feedback reason code."""
    try:
        alert = AlertService.reject_alert(
            db=db,
            alert_id=alert_id,
            officer_id=request.officer_id,
            reason_code=request.reason_code,
            notes=request.notes,
        )
        return {
            "status": "success",
            "message": f"Alert {alert_id} rejected",
            "reason_code": alert.rejection_reason,
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/check-escalation")
def trigger_escalation_check(db: Session = Depends(get_db)):
    """Heartbeat trigger to auto-escalate unactioned alerts exceeding time limits."""
    escalated_count = AlertService.check_and_auto_escalate(db)
    return {
        "status": "ok",
        "escalated_count": escalated_count,
        "message": f"{escalated_count} alert(s) escalated to next authority level.",
    }
