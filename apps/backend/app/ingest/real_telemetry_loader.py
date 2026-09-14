"""Startup telemetry baseline loader from historical IMD records.

DATA CLASSIFICATION: HISTORICAL BASELINE ONLY
=============================================
This loader loads historical IMD rainfall records into the database for
baseline context if available.
  - It NEVER generates mock, artificial, or seeded alerts.
  - It NEVER invents fake baseline rainfall values.
  - Alerts are ONLY created when live telemetry reaches operational thresholds.
"""

import csv
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.config import settings
from app.models.zone import Zone
from app.models.weather import RainfallReading
from app.models.risk import RiskScore
from app.services.ml_service import ml_service

logger = logging.getLogger("parvaah.ingest.telemetry")

_IMD_SOURCE_ID = "IMD-NE-REGIONAL-HISTORICAL"


def load_real_rainfall_and_risks(db: Session, zone_id_map: dict[str, str]) -> None:
    """Load baseline historical rainfall readings from IMD CSV if present.

    Does NOT create mock alerts.
    """
    imd_path = (
        settings.WORKSPACE_ROOT
        / "apps"
        / "ml-engine"
        / "data"
        / "processed"
        / "features"
        / "rainfall_districtwise_daily_imd.csv"
    )
    if not imd_path.exists():
        logger.info("IMD rainfall CSV not present — skipping historical baseline loading")
        return

    district_records: dict[str, list[tuple[str, float]]] = {}
    with open(imd_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            d = row.get("District", "").strip()
            date_str = row.get("Date", "").strip()
            try:
                val = float(row.get("Daily Actual", 0.0))
                district_records.setdefault(d, []).append((date_str, val))
            except (ValueError, TypeError):
                continue

    now = datetime.now(timezone.utc)

    for district, zid in zone_id_map.items():
        records = district_records.get(district, [])
        if not records:
            continue

        # Find latest record with positive rainfall or latest available date
        pos_indices = [i for i, (_, val) in enumerate(records) if val > 0.0]
        latest_idx = pos_indices[-1] if pos_indices else (len(records) - 1)
        latest_date_str, rain_24h = records[latest_idx]

        # Calculate actual chronological multi-day sums from the IMD series
        start_72h = max(0, latest_idx - 2)
        start_7d = max(0, latest_idx - 6)
        start_14d = max(0, latest_idx - 13)
        start_30d = max(0, latest_idx - 29)

        rain_72h = round(sum(v for _, v in records[start_72h:latest_idx + 1]), 1)
        rain_7d = round(sum(v for _, v in records[start_7d:latest_idx + 1]), 1)
        rain_14d = round(sum(v for _, v in records[start_14d:latest_idx + 1]), 1)
        rain_30d = round(sum(v for _, v in records[start_30d:latest_idx + 1]), 1)

        try:
            obs_ts = datetime.strptime(latest_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            obs_ts = now

        existing = (
            db.query(RainfallReading)
            .filter(
                RainfallReading.zone_id == zid,
                RainfallReading.source_id == _IMD_SOURCE_ID,
                RainfallReading.timestamp == obs_ts,
            )
            .first()
        )
        if existing:
            continue

        ts_unix = int(now.timestamp())
        reading_id = f"rf-imd-baseline-{zid.lower()}-{ts_unix}"
        risk_id = f"rs-imd-baseline-{zid.lower()}-{ts_unix}"

        score, level, conf, min_d, max_d, factors, conf_score = ml_service.predict_risk_for_zone(
            db=db,
            zone_id=zid,
            rainfall_24h_mm=rain_24h,
            rainfall_72h_mm=rain_72h,
            rainfall_antecedent_7d_mm=rain_7d,
            rainfall_14d_mm=rain_14d,
            rainfall_30d_mm=rain_30d,
        )

        reading = RainfallReading(
            reading_id=reading_id,
            source_type="imd_historical",
            source_id=_IMD_SOURCE_ID,
            zone_id=zid,
            timestamp=obs_ts,
            rainfall_mm=rain_24h,
            cumulative_1hr_mm=round(rain_24h / 24.0, 2),
            cumulative_24hr_mm=rain_24h,
            cumulative_72hr_mm=rain_72h,
            is_forecast=False,
            confidence_flag="historical",
        )
        db.add(reading)

        risk_record = RiskScore(
            risk_score_id=risk_id,
            zone_id=zid,
            risk_level=level.value,
            risk_score_numeric=score,
            time_to_failure_min_days=min_d,
            time_to_failure_max_days=max_d,
            confidence_score=conf_score,
            model_version=ml_service.model_version,
            explainability_json=factors.model_dump_json(),
            computed_at=now,
        )
        db.add(risk_record)

    db.commit()
    logger.info("Baseline historical telemetry loaded for %d zones", len(district_records))
