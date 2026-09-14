"""API endpoints for road network connectivity, hazards, and rerouting."""

import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.road import RoadSegment
from app.schemas.common import RoadStatus
from app.schemas.road import RoadSegmentResponse, RerouteRequest, RerouteResponse
from app.services.road_service import RoadService

router = APIRouter(prefix="/roads", tags=["Roads & Connectivity"])


@router.get("/export")
def export_roads_advisory_csv(db: Session = Depends(get_db)):
    """Export road network status and blockage advisory to CSV."""
    roads = RoadService.get_roads(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Road ID", "Highway Name", "Road Class", "District/Zone", "Status", "Blockage Reason", "Single Access", "Updated At"])
    for r in roads:
        writer.writerow([
            r.road_id,
            r.name,
            r.road_class,
            r.zone_id,
            r.status.value if hasattr(r.status, "value") else str(r.status),
            r.blockage_reason or "None",
            "Yes" if r.is_single_access else "No",
            r.status_updated_at.isoformat() if r.status_updated_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=parvaah_road_corridors_advisory.csv"},
    )


@router.get("", response_model=list[RoadSegmentResponse])
def get_roads(
    district: str | None = Query(None, description="Filter roads by district"),
    zone_id: str | None = Query(None, description="Filter roads by zone ID"),
    db: Session = Depends(get_db),
):
    """Retrieve monitored road segments with operational status and chokepoint flags."""
    return RoadService.get_roads(db, district=district, zone_id=zone_id)


@router.post("/reroute", response_model=RerouteResponse)
def calculate_advisory_reroute(
    request: RerouteRequest,
    db: Session = Depends(get_db),
):
    """Calculate safe alternate route avoiding blocked or high-hazard mountain corridors."""
    return RoadService.calculate_reroute(
        db, origin=request.origin, destination=request.destination
    )


@router.get("/{road_id}", response_model=RoadSegmentResponse)
def get_road_detail(road_id: str, db: Session = Depends(get_db)):
    """Retrieve status and metadata for a specific road corridor."""
    road = db.query(RoadSegment).filter(RoadSegment.road_id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road segment not found")

    return RoadSegmentResponse(
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
