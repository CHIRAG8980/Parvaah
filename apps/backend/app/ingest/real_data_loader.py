"""Real geospatial and meteorological dataset ingestion orchestrator for Parvaah."""

import logging
from sqlalchemy.orm import Session
from app.models.zone import Zone
from app.models.road import RoadSegment
from app.models.weather import RainfallReading
from app.models.risk import RiskScore
from app.ingest.real_zones_loader import load_real_zones, load_real_roads
from app.ingest.real_telemetry_loader import load_real_rainfall_and_risks

logger = logging.getLogger("parvaah.ingest")


def run_real_ingestion(db: Session) -> dict[str, int]:
    """Execute complete ingestion pipeline using authentic datasets."""
    logger.info("Starting real dataset ingestion...")
    zone_id_map = load_real_zones(db)
    load_real_roads(db, zone_id_map)
    load_real_rainfall_and_risks(db, zone_id_map)

    counts = {
        "zones": db.query(Zone).count(),
        "roads": db.query(RoadSegment).count(),
        "rainfall_readings": db.query(RainfallReading).count(),
        "risk_scores": db.query(RiskScore).count(),
    }
    logger.info("Ingestion completed: %s", counts)
    return counts


if __name__ == "__main__":
    from app.database import SessionLocal, init_db
    init_db()
    session = SessionLocal()
    try:
        run_real_ingestion(session)
    finally:
        session.close()
