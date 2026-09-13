"""Service for alert queue management, officer review, and auto-escalation."""

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.alert import Alert, AlertEscalation
from app.models.zone import Zone
from app.schemas.alert import AlertQueueItem, ActiveAlertMobileResponse
from app.schemas.common import AlertSeverity, AlertStatus
from app.services.audit_service import AuditService
from app.services.multilingual import get_multilingual_alert, SUPPORTED_LANGUAGES


class AlertService:
    """Business logic for early warning alert operations."""

    @staticmethod
    def get_review_queue(db: Session, status_filter: str | None = None) -> list[AlertQueueItem]:
        """Fetch alert review queue with live countdown timers."""
        AlertService.check_and_auto_escalate(db)

        query = db.query(Alert, Zone).join(Zone, Alert.zone_id == Zone.zone_id)
        if status_filter:
            query = query.filter(Alert.status == status_filter)

        alerts = query.order_by(Alert.created_at.desc()).all()
        now = datetime.now(timezone.utc)

        items = []
        for alert, zone in alerts:
            channels = json.loads(alert.channels_used) if alert.channels_used else []
            deadline = alert.escalation_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            seconds_remaining = max(int((deadline - now).total_seconds()), 0)

            items.append(
                AlertQueueItem(
                    alert_id=alert.alert_id,
                    title=alert.title,
                    zone_id=zone.zone_id,
                    zone_name=zone.name,
                    district=zone.district,
                    state=zone.state,
                    severity=AlertSeverity(alert.severity),
                    status=AlertStatus(alert.status),
                    risk_score=alert.risk_score.risk_score_numeric if alert.risk_score else 85.0,
                    time_to_failure_window="1–3 days" if alert.severity == "Critical" else "3–7 days",
                    draft_message=alert.draft_message,
                    final_message=alert.final_message,
                    trigger_reason=alert.draft_message.split("\n")[0] if "\n" in alert.draft_message else alert.draft_message,
                    suggested_action="Immediate evacuation of downhill settlements" if alert.severity == "Critical" else "Mobilize SDRF inspection units",
                    affected_infrastructure="Key mountain highways and downhill settlements",
                    channels=channels,
                    created_at=alert.created_at,
                    escalation_deadline=alert.escalation_deadline,
                    seconds_remaining=seconds_remaining,
                    escalated_to=alert.escalated_to,
                    rejection_reason=alert.rejection_reason,
                )
            )
        return items

    @staticmethod
    def approve_alert(
        db: Session,
        alert_id: str,
        officer_id: str,
        final_message: str | None = None,
        channels: list[str] | None = None,
    ) -> Alert:
        """Approve an alert for immediate public dissemination."""
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.status = AlertStatus.APPROVED.value
        alert.reviewed_by = officer_id
        alert.reviewed_at = datetime.now(timezone.utc)
        alert.dispatched_at = datetime.now(timezone.utc)
        if final_message:
            alert.final_message = final_message
        if channels:
            alert.channels_used = json.dumps(channels)

        db.commit()
        db.refresh(alert)

        AuditService.record_action(
            db=db,
            entity_type="alert",
            entity_id=alert.alert_id,
            action="alert_approved",
            actor=officer_id,
            details={"channels": alert.channels_used, "severity": alert.severity},
        )
        return alert

    @staticmethod
    def reject_alert(db: Session, alert_id: str, officer_id: str, reason_code: str, notes: str | None = None) -> Alert:
        """Reject an AI-drafted alert and provide feedback for ML refinement."""
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.status = AlertStatus.REJECTED.value
        alert.reviewed_by = officer_id
        alert.reviewed_at = datetime.now(timezone.utc)
        alert.rejection_reason = reason_code

        db.commit()
        db.refresh(alert)

        AuditService.record_action(
            db=db,
            entity_type="alert",
            entity_id=alert.alert_id,
            action="alert_rejected",
            actor=officer_id,
            details={"reason_code": reason_code, "notes": notes},
        )
        return alert

    @staticmethod
    def check_and_auto_escalate(db: Session) -> int:
        """Evaluate unactioned alerts and escalate to higher authorities."""
        now = datetime.now(timezone.utc)
        pending_alerts = db.query(Alert).filter(
            Alert.status == AlertStatus.PENDING_REVIEW.value,
            Alert.escalation_deadline <= now,
        ).all()

        escalated_count = 0
        for alert in pending_alerts:
            alert.status = AlertStatus.AUTO_ESCALATED.value
            alert.escalated_to = "State Disaster Management Authority (SDMA)"
            escalation_entry = AlertEscalation(
                escalation_id=f"esc-{alert.alert_id[-8:]}-{int(now.timestamp())}",
                alert_id=alert.alert_id,
                from_level="District Collector",
                to_level="SDMA",
                triggered_at=now,
                reason="Alert unreviewed beyond defined escalation deadline",
            )
            db.add(escalation_entry)
            escalated_count += 1

            AuditService.record_action(
                db=db,
                entity_type="alert",
                entity_id=alert.alert_id,
                action="alert_escalated",
                actor="system_scheduler",
                details={"to_level": "SDMA", "severity": alert.severity},
            )

        if escalated_count > 0:
            db.commit()
        return escalated_count

    @staticmethod
    def get_active_alerts_for_mobile(
        db: Session, zone_id: str | None = None, language: str = "en"
    ) -> list[ActiveAlertMobileResponse]:
        """Fetch active alerts localized for citizen mobile app."""
        query = db.query(Alert, Zone).join(Zone, Alert.zone_id == Zone.zone_id).filter(
            Alert.status.in_([AlertStatus.APPROVED.value, AlertStatus.PENDING_REVIEW.value])
        )
        if zone_id:
            query = query.filter(Alert.zone_id == zone_id)

        records = query.order_by(Alert.created_at.desc()).all()
        results = []
        for alert, zone in records:
            title, action = get_multilingual_alert(
                severity=alert.severity,
                zone_name=zone.name,
                language=language,
            )
            results.append(
                ActiveAlertMobileResponse(
                    alert_id=alert.alert_id,
                    title=title,
                    message=f"{alert.draft_message} - {action}",
                    severity=AlertSeverity(alert.severity),
                    zone_id=zone.zone_id,
                    zone_name=zone.name,
                    district=zone.district,
                    state=zone.state,
                    dispatched_at=alert.dispatched_at or alert.created_at,
                    language=language,
                    available_languages=SUPPORTED_LANGUAGES,
                )
            )
        return results
