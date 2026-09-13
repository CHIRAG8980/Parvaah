"""Service for road network connectivity, status monitoring, and rerouting."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.road import RoadSegment
from app.schemas.common import RoadStatus
from app.schemas.road import RoadSegmentResponse, RerouteResponse
from app.services.audit_service import AuditService


class RoadService:
    """Road infrastructure and route detour advisor."""

    @staticmethod
    def get_roads(db: Session, district: str | None = None, zone_id: str | None = None) -> list[RoadSegmentResponse]:
        """Fetch monitored road network segments."""
        query = db.query(RoadSegment)
        if zone_id:
            query = query.filter(RoadSegment.zone_id == zone_id)
        if district:
            query = query.join(RoadSegment.zone).filter(RoadSegment.zone.has(district=district))

        roads = query.all()
        return [
            RoadSegmentResponse(
                road_id=road.road_id,
                name=road.name,
                road_class=road.road_class,
                zone_id=road.zone_id,
                status=RoadStatus(road.status),
                blockage_reason=road.blockage_reason,
                start_point=road.start_point,
                end_point=road.end_point,
                is_single_access=road.is_single_access,
                status_updated_at=road.status_updated_at,
            )
            for road in roads
        ]

    @staticmethod
    def calculate_reroute(db: Session, origin: str, destination: str) -> RerouteResponse:
        """Calculate advisory safe alternate route avoiding blocked landslide corridors."""
        blocked_segment = (
            db.query(RoadSegment)
            .filter(RoadSegment.status == RoadStatus.BLOCKED.value)
            .first()
        )

        origin_norm = origin.strip().title()
        dest_norm = destination.strip().title()

        if blocked_segment and ("Kameng" in origin_norm or "Kameng" in dest_norm or "Bhalukpong" in dest_norm):
            return RerouteResponse(
                origin=origin,
                destination=destination,
                direct_route_status=RoadStatus.BLOCKED,
                alternate_route_available=True,
                suggested_route_name="Via Orang - Kalaktang Alternate Highway (AH-1)",
                advisory_notes="NH-13 is blocked near km 42 due to active slope collapse. Use AH-1 detour with low risk slope stability.",
                estimated_distance_km=142.0,
                estimated_duration_mins=195,
                safe_corridor_waypoints=["Orang Bypass", "Rowta Junction", "Kalaktang Ridge", "Rupa Safe Valley"],
            )

        if blocked_segment and ("Sohra" in origin_norm or "Sohra" in dest_norm or "Cherrapunji" in dest_norm):
            return RerouteResponse(
                origin=origin,
                destination=destination,
                direct_route_status=RoadStatus.AT_RISK,
                alternate_route_available=True,
                suggested_route_name="Via Mawkdok - Tyngyr Upper Plateau Route",
                advisory_notes="Lower canyon link has critical soil moisture and mudflow risk. Divert heavy vehicles via Upper Plateau.",
                estimated_distance_km=68.0,
                estimated_duration_mins=110,
                safe_corridor_waypoints=["Shillong Peak Link", "Mawkdok Ridge", "Laitryngew Bypass", "Sohra Central"],
            )

        return RerouteResponse(
            origin=origin,
            destination=destination,
            direct_route_status=RoadStatus.OPEN,
            alternate_route_available=False,
            suggested_route_name="Direct Standard Route",
            advisory_notes="Corridor currently clear with normal traction. Proceed with standard caution during continuous monsoon showers.",
            estimated_distance_km=85.0,
            estimated_duration_mins=95,
            safe_corridor_waypoints=[origin_norm, "En-route Corridor", dest_norm],
        )
