"""Pydantic schemas for alert lifecycle, queue, and dispatch."""

from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import AlertSeverity, AlertStatus


class AlertQueueItem(BaseModel):
    """Alert record surfaced in Disaster Management Officer review queue."""

    alert_id: str
    title: str
    zone_id: str
    zone_name: str
    district: str
    state: str
    severity: AlertSeverity
    status: AlertStatus
    risk_score: float
    time_to_failure_window: str
    draft_message: str
    final_message: str | None = None
    trigger_reason: str
    suggested_action: str
    affected_infrastructure: str
    channels: list[str] = Field(default_factory=list)
    created_at: datetime
    escalation_deadline: datetime
    seconds_remaining: int
    escalated_to: str | None = None
    rejection_reason: str | None = None


class AlertApproveRequest(BaseModel):
    """Officer action approving an alert for dispatch."""

    final_message: str | None = Field(
        None, description="Optional custom officer edit"
    )
    selected_channels: list[str] | None = Field(
        None, description="Channels to dispatch to"
    )
    officer_id: str = Field(default="officer-dmo-01")


class AlertRejectRequest(BaseModel):
    """Officer action rejecting an alert with feedback code."""

    reason_code: str = Field(
        ...,
        description="Reason code: false_positive | insufficient_data | already_handled | sensor_anomaly",
    )
    notes: str | None = None
    officer_id: str = Field(default="officer-dmo-01")


class ActiveAlertMobileResponse(BaseModel):
    """Citizen-facing active alert formatted for mobile app."""

    alert_id: str
    title: str
    message: str
    severity: AlertSeverity
    zone_id: str
    zone_name: str
    district: str
    state: str
    dispatched_at: datetime
    language: str
    available_languages: list[str]
