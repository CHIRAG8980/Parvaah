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
        """Calculate advisory safe alternate route querying real road segment statuses."""
        origin_norm = origin.strip()
        dest_norm = destination.strip()

        roads = db.query(RoadSegment).all()

        matching_blocked = [
            r for r in roads
            if r.status == RoadStatus.BLOCKED.value
            and (
                origin_norm.lower() in r.name.lower()
                or dest_norm.lower() in r.name.lower()
                or origin_norm.lower() in r.start_point.lower()
                or dest_norm.lower() in r.end_point.lower()
            )
        ]
        matching_at_risk = [
            r for r in roads
            if r.status == RoadStatus.AT_RISK.value
            and (
                origin_norm.lower() in r.name.lower()
                or dest_norm.lower() in r.name.lower()
                or origin_norm.lower() in r.start_point.lower()
                or dest_norm.lower() in r.end_point.lower()
            )
        ]
        open_roads = [r for r in roads if r.status == RoadStatus.OPEN.value]

        if matching_blocked:
            blocked_r = matching_blocked[0]
            alt = open_roads[0] if open_roads else None
            return RerouteResponse(
                origin=origin,
                destination=destination,
                direct_route_status=RoadStatus.BLOCKED,
                alternate_route_available=alt is not None,
                suggested_route_name=f"Detour via {alt.name}" if alt else "No verified alternate corridor available",
                advisory_notes=f"{blocked_r.name} is currently blocked: {blocked_r.blockage_reason or 'Active hazard'}.",
                estimated_distance_km=0.0,
                estimated_duration_mins=0,
                safe_corridor_waypoints=[origin_norm, alt.name, dest_norm] if alt else [origin_norm, dest_norm],
            )

        if matching_at_risk:
            risk_r = matching_at_risk[0]
            alt = open_roads[0] if open_roads else None
            return RerouteResponse(
                origin=origin,
                destination=destination,
                direct_route_status=RoadStatus.AT_RISK,
                alternate_route_available=alt is not None,
                suggested_route_name=f"Cautionary bypass via {alt.name}" if alt else f"Direct {risk_r.name} (Proceed with high caution)",
                advisory_notes=f"{risk_r.name} has elevated hazard status: {risk_r.blockage_reason or 'Slope instability'}.",
                estimated_distance_km=0.0,
                estimated_duration_mins=0,
                safe_corridor_waypoints=[origin_norm, alt.name, dest_norm] if alt else [origin_norm, dest_norm],
            )

        return RerouteResponse(
            origin=origin,
            destination=destination,
            direct_route_status=RoadStatus.OPEN,
            alternate_route_available=False,
            suggested_route_name="Direct Corridor Route",
            advisory_notes="No active road blockages recorded along corridor.",
            estimated_distance_km=0.0,
            estimated_duration_mins=0,
            safe_corridor_waypoints=[origin_norm, dest_norm],
        )
