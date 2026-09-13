"""API endpoints for operational parameters and geotechnical threshold configuration."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import SystemSettings
from app.schemas.settings import SystemSettingsResponse, SystemSettingsUpdateRequest, BroadcastChannelsSchema
from app.services.audit_service import AuditService

router = APIRouter(prefix="/settings", tags=["System Configuration"])


def _get_or_create_settings(db: Session) -> SystemSettings:
    settings_record = db.query(SystemSettings).filter(SystemSettings.key == "default").first()
    if not settings_record:
        settings_record = SystemSettings(key="default")
        db.add(settings_record)
        db.commit()
        db.refresh(settings_record)
    return settings_record


@router.get("", response_model=SystemSettingsResponse)
def get_system_settings(db: Session = Depends(get_db)):
    """Fetch current geotechnical thresholds, polling rates, and broadcast channels."""
    record = _get_or_create_settings(db)
    try:
        channels_dict = json.loads(record.channels_json)
    except Exception:
        channels_dict = {}
    
    return SystemSettingsResponse(
        rainfall_warning=record.rainfall_warning,
        rainfall_critical=record.rainfall_critical,
        insar_velocity=record.insar_velocity,
        soil_saturation=record.soil_saturation,
        seismic_threshold=record.seismic_threshold,
        channels=BroadcastChannelsSchema(**channels_dict),
        aws_poll_rate=record.aws_poll_rate,
        insar_sync_interval=record.insar_sync_interval,
        inclinometer_heartbeat=record.inclinometer_heartbeat,
        edge_failover=record.edge_failover,
        updated_at=record.updated_at,
    )


@router.put("", response_model=SystemSettingsResponse)
def update_system_settings(
    request: SystemSettingsUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update geotechnical thresholds, polling rates, or broadcast channels with audit recording."""
    record = _get_or_create_settings(db)

    if request.rainfall_warning is not None:
        record.rainfall_warning = request.rainfall_warning
    if request.rainfall_critical is not None:
        record.rainfall_critical = request.rainfall_critical
    if request.insar_velocity is not None:
        record.insar_velocity = request.insar_velocity
    if request.soil_saturation is not None:
        record.soil_saturation = request.soil_saturation
    if request.seismic_threshold is not None:
        record.seismic_threshold = request.seismic_threshold
    if request.channels is not None:
        record.channels_json = json.dumps(request.channels.model_dump())
    if request.aws_poll_rate is not None:
        record.aws_poll_rate = request.aws_poll_rate
    if request.insar_sync_interval is not None:
        record.insar_sync_interval = request.insar_sync_interval
    if request.inclinometer_heartbeat is not None:
        record.inclinometer_heartbeat = request.inclinometer_heartbeat
    if request.edge_failover is not None:
        record.edge_failover = request.edge_failover

    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    AuditService.record_action(
        db=db,
        entity_type="system_configuration",
        entity_id="default",
        action="settings_updated",
        actor="control_room_officer",
        details={
            "rainfall_warning": record.rainfall_warning,
            "rainfall_critical": record.rainfall_critical,
            "insar_velocity": record.insar_velocity,
            "edge_failover": record.edge_failover,
        },
    )

    channels_dict = json.loads(record.channels_json)
    return SystemSettingsResponse(
        rainfall_warning=record.rainfall_warning,
        rainfall_critical=record.rainfall_critical,
        insar_velocity=record.insar_velocity,
        soil_saturation=record.soil_saturation,
        seismic_threshold=record.seismic_threshold,
        channels=BroadcastChannelsSchema(**channels_dict),
        aws_poll_rate=record.aws_poll_rate,
        insar_sync_interval=record.insar_sync_interval,
        inclinometer_heartbeat=record.inclinometer_heartbeat,
        edge_failover=record.edge_failover,
        updated_at=record.updated_at,
    )
