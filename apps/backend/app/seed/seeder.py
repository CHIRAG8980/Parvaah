"""Geospatial GIS monitoring station registry initializer."""

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.zone import Zone, TerrainFeature
from app.models.user import User
from app.security import hash_password
from app.seed.ner_data import SEED_ZONES


def seed_database(db: Session) -> None:
    """Initialize real North Eastern Region GIS monitoring stations and topography."""
    now = datetime.now(timezone.utc)

    # Seed default disaster management officers if not already present
    initial_officers = [
        {
            "user_id": "usr-dmo-east-khasi",
            "username": "dmo_east_khasi",
            "full_name": "Dr. Bahunlang Nongbri",
            "role": "District Disaster Management Officer",
            "district": "East Khasi Hills",
            "contact_number": "+91-364-2224010",
            "password": "password123",
            "escalation_level": 1,
        },
        {
            "user_id": "usr-director-sdma",
            "username": "sdma_director",
            "full_name": "Shri P. Lyngdoh, IAS",
            "role": "State Disaster Management Authority Director",
            "district": "Statewide HQ",
            "contact_number": "+91-364-2501234",
            "password": "password123",
            "escalation_level": 2,
        },
    ]
    for off in initial_officers:
        if not db.query(User).filter(User.username == off["username"]).first():
            user = User(
                user_id=off["user_id"],
                username=off["username"],
                full_name=off["full_name"],
                role=off["role"],
                district=off["district"],
                escalation_level=off["escalation_level"],
                contact_number=off["contact_number"],
                hashed_password=hash_password(off["password"]),
                created_at=now,
            )
            db.add(user)
    db.commit()

    if db.query(Zone).first() is None:
        for item in SEED_ZONES:
            zone = Zone(
                zone_id=item["zone_id"],
                name=item["name"],
                district=item["district"],
                state=item["state"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                avg_slope_deg=item["avg_slope_deg"],
                avg_elevation_m=item["avg_elevation_m"],
                geometry_geojson=json.dumps(
                    {"type": "Point", "coordinates": [item["longitude"], item["latitude"]]}
                ),
                created_at=now,
            )
            db.add(zone)
        db.flush()

        for item in SEED_ZONES:
            zid = item["zone_id"]
            db.add(
                TerrainFeature(
                    zone_id=zid,
                    slope_deg=item["avg_slope_deg"],
                    aspect_deg=180.0,
                    curvature_type="concave",
                    land_use="forest",
                    lithology="Sandstone/Shale",
                    soil_thickness_m=2.4,
                )
            )
        db.commit()

    # Seed operational alerts for control room review queue if none exist
    from app.models.alert import Alert
    from datetime import timedelta
    if db.query(Alert).first() is None:
        alerts = [
            Alert(
                alert_id="ALT-EKH-2026-001",
                zone_id="ZONE-EAST-KHASI-HILLS",
                severity="Critical",
                title="Critical Landslide Hazard Warning - Sohra Sector",
                draft_message="Continuous high precipitation has triggered near-saturated soil pore moisture along the Sohra-Shillong escarpment. Urgent precautionary slope clearance advised.",
                status="pending_review",
                created_at=now,
                escalation_deadline=now + timedelta(minutes=30),
                channels_used='["sms", "app_push", "cap_sachet"]',
            ),
            Alert(
                alert_id="ALT-WKH-2026-002",
                zone_id="ZONE-WEST-KHASI-HILLS",
                severity="High",
                title="Moderate Slope Destabilization Advisory - Nongstoin Corridor",
                draft_message="InSAR deformation trends indicate accelerated surface creeping along NH-106 mountain cut. Transport authorities on standby.",
                status="pending_review",
                created_at=now,
                escalation_deadline=now + timedelta(minutes=60),
                channels_used='["sms", "app_push", "cap_sachet"]',
            ),
        ]
        for a in alerts:
            db.add(a)
        db.commit()
