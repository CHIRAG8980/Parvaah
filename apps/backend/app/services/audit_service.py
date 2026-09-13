"""Service for recording and querying immutable audit trails."""

import json
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


class AuditService:
    """Provides methods to write and inspect audit records."""

    @staticmethod
    def record_action(
        db: Session,
        entity_type: str,
        entity_id: str,
        action: str,
        actor: str,
        data_snapshot_ref: str = "v1.0.0-ner-sensor-grid",
        details: dict | None = None,
    ) -> AuditLog:
        """Create and persist an append-only audit entry."""
        log_id = f"aud-{uuid.uuid4().hex[:12]}"
        details_str = json.dumps(details) if details else None

        entry = AuditLog(
            log_id=log_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor=actor,
            timestamp=datetime.now(timezone.utc),
            data_snapshot_ref=data_snapshot_ref,
            details_json=details_str,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def list_logs(
        db: Session,
        entity_type: str | None = None,
        action: str | None = None,
        limit: int = 50,
    ) -> list[AuditLog]:
        """Fetch audit trail ordered by most recent."""
        query = db.query(AuditLog)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if action:
            query = query.filter(AuditLog.action == action)
        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
