"""Database seeding routine to populate realistic NER baseline data."""

import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.zone import Zone, TerrainFeature, VillageInfrastructure
from app.models.risk import RiskScore
from app.models.road import RoadSegment
from app.models.weather import RainfallReading, CommunityGauge
from app.models.alert import Alert
from app.models.user import User
from app.services.ml_service import ml_service
from app.seed.ner_data import SEED_ZONES
from app.seed.infra_data import SEED_ROADS, SEED_OFFICERS


def seed_database(db: Session) -> None:
    """Populate database with initial North Eastern Region monitoring records."""
    if db.query(Zone).first() is not None:
        return

    now = datetime.now(timezone.utc)

    # 1. Insert Zones first and flush to satisfy PostgreSQL foreign keys
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
            geometry_geojson=json.dumps({"type": "Point", "coordinates": [item["longitude"], item["latitude"]]}),
            created_at=now,
        )
        db.add(zone)
    db.flush()

    # 2. Insert Terrain, Villages, Gauges, Rainfall, and Risk Scores
    for item in SEED_ZONES:
        zid = item["zone_id"]
        db.add(TerrainFeature(
            zone_id=zid,
            slope_deg=item["avg_slope_deg"],
            aspect_deg=180.0,
            curvature_type="concave",
            land_use="forest",
            lithology="Sandstone/Shale",
            soil_thickness_m=2.4,
        ))

        db.add(VillageInfrastructure(
            location_id=f"loc-{zid}-01",
            zone_id=zid,
            type="village",
            name=f"{item['name'].split('-')[0].strip()} Village",
            latitude=item["latitude"] + 0.005,
            longitude=item["longitude"] + 0.005,
            population_estimate=1250,
        ))

        db.add(CommunityGauge(
            gauge_id=f"cg-{zid}",
            zone_id=zid,
            name=f"Community Rain Gauge {item['district']}",
            maintainer_org="NER Disaster Response Volunteer Network",
            maintainer_contact="+919436000111",
            latitude=item["latitude"] - 0.003,
            longitude=item["longitude"] - 0.002,
            status="active",
        ))

        db.add(RainfallReading(
            reading_id=f"rf-{zid}",
            source_type="imd",
            source_id="IMD-REGIONAL-RADAR",
            zone_id=zid,
            timestamp=now,
            rainfall_mm=item["rainfall_24h"] / 6.0,
            cumulative_1hr_mm=item["rainfall_24h"] / 12.0,
            cumulative_24hr_mm=item["rainfall_24h"],
            cumulative_72hr_mm=item["rainfall_72h"],
            is_forecast=False,
            confidence_flag="high",
        ))

        score, level, conf, min_d, max_d, factors = ml_service.predict_risk(
            slope_deg=item["avg_slope_deg"],
            rainfall_24h_mm=item["rainfall_24h"],
            rainfall72h_mm=item["rainfall_72h"],
            insar_deformation_mm_yr=item["insar_deformation"],
            soil_moisture_pct=item["soil_moisture"],
        )

        db.add(RiskScore(
            risk_score_id=f"rs-{zid}",
            zone_id=zid,
            computed_at=now,
            risk_level=level.value,
            risk_score_numeric=score,
            time_to_failure_min_days=min_d,
            time_to_failure_max_days=max_d,
            confidence_score=0.92,
            model_version=ml_service.model_version,
            explainability_json=factors.model_dump_json(),
        ))
    db.flush()

    # 3. Insert Roads
    for r in SEED_ROADS:
        db.add(RoadSegment(
            road_id=r["road_id"],
            name=r["name"],
            road_class=r["road_class"],
            zone_id=r["zone_id"],
            status=r["status"],
            blockage_reason=r["blockage_reason"],
            start_point=r["start_point"],
            end_point=r["end_point"],
            is_single_access=r["is_single_access"],
            status_updated_at=now,
        ))

    # 4. Insert Officers
    for o in SEED_OFFICERS:
        db.add(User(
            user_id=o["user_id"],
            username=o["username"],
            full_name=o["full_name"],
            role=o["role"],
            district=o["district"],
            escalation_level=o["escalation_level"],
            contact_number=o["contact_number"],
            hashed_password=o["hashed_password"],
            created_at=now,
        ))

    # 5. Insert Initial Alerts
    initial_alerts = [
        {
            "id": "ALT-NER-0941",
            "zone_id": "NER-ARU-001",
            "severity": "Critical",
            "title": "Critical Landslide Threat: Active Escarpment Failure",
            "msg": "Rainfall 178mm/24h with InSAR displacement -24.6mm/yr. Slope stability critical near NH-13 corridor.",
            "status": "pending_review",
            "mins_left": 25,
        },
        {
            "id": "ALT-NER-0940",
            "zone_id": "NER-MEG-002",
            "severity": "High",
            "title": "High Soil Moisture & Pore Water Surcharge Warning",
            "msg": "Soil saturation reached 89% with continuous precipitation. High probability of debris flow in lower gorge.",
            "status": "pending_review",
            "mins_left": 55,
        },
        {
            "id": "ALT-NER-0939",
            "zone_id": "NER-MAN-003",
            "severity": "Critical",
            "title": "Major Debris Flow Detected on Highway Cutting",
            "msg": "Precipitation 164mm with slope cut fracture. Retaining structures showing active movement.",
            "status": "pending_review",
            "mins_left": 15,
        },
        {
            "id": "ALT-NER-0938",
            "zone_id": "NER-ASM-004",
            "severity": "Medium",
            "title": "Rainfall Exceeding Soil Retention Threshold",
            "msg": "Continuous cloud plume over Barail Range with 138mm accumulation. Visual track patrols mobilized.",
            "status": "pending_review",
            "mins_left": 90,
        },
    ]

    for a in initial_alerts:
        db.add(Alert(
            alert_id=a["id"],
            zone_id=a["zone_id"],
            risk_score_id=f"rs-{a['zone_id']}",
            severity=a["severity"],
            title=a["title"],
            draft_message=a["msg"],
            status=a["status"],
            created_at=now,
            escalation_deadline=now + timedelta(minutes=a["mins_left"]),
            channels_used=json.dumps(["sms", "app_push", "cap_sachet"]),
        ))

    db.commit()
