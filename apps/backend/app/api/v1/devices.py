"""API endpoints for mobile push notification device registration."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import DeviceToken
from app.schemas.device import DeviceRegisterRequest, DeviceRegisterResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/devices", tags=["Devices & Push Notifications"])


@router.post("/register", response_model=DeviceRegisterResponse)
def register_device(
    request: DeviceRegisterRequest,
    db: Session = Depends(get_db),
):
    """Register mobile citizen device FCM token with subscribed hazard zone."""
    device = db.query(DeviceToken).filter(DeviceToken.fcm_token == request.fcm_token).first()

    if not device:
        device = DeviceToken(
            device_id=f"dev-{uuid.uuid4().hex[:10]}",
            fcm_token=request.fcm_token,
            zone_id=request.zone_id,
            language=request.language,
            platform=request.platform,
            registered_at=datetime.now(timezone.utc),
        )
        db.add(device)
    else:
        device.zone_id = request.zone_id
        device.language = request.language
        device.platform = request.platform

    db.commit()
    db.refresh(device)

    AuditService.record_action(
        db=db,
        entity_type="device",
        entity_id=device.device_id,
        action="device_registered",
        actor="mobile_citizen",
        details={"zone_id": device.zone_id, "lang": device.language},
    )

    return DeviceRegisterResponse(
        status="registered",
        device_id=device.device_id,
        zone_id=device.zone_id,
        language=device.language,
        message="Device successfully registered for geo-targeted early warning alerts.",
    )
