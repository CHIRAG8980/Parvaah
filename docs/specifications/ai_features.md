# AI/ML Engine — Feature Specification
## AI-Based Early Warning and Landslide Risk Monitoring System (NER)

**Audience:** AI/ML development team
**Role of this component:** Ingest multi-source geospatial and time-series data, compute per-zone landslide risk scores and time-to-failure estimates, and produce explainable outputs for the alerting and dashboard layers.

**Important framing note:** Treat satellite-based deformation (InSAR) as a susceptibility/trend signal, not a standalone early-warning oracle. Known limitations (6–12 day revisit cycle, decorrelation in dense vegetation/steep terrain, monsoon cloud interference) mean InSAR alone cannot reliably predict fast-failing slopes. Design the fusion engine to weight and flag confidence accordingly rather than treating all inputs as equally reliable.

---

## 1. Model Architecture Overview

```
Rainfall (IMD) --------\
Soil moisture/InSAR ----\
NDVI (vegetation) --------> Fusion Engine --> Risk Score + Time-to-Failure + Explainability
Terrain/DEM -------------/         |
Historical landslides --/          |
Community rain gauges --/    Confidence Scoring Layer
```

### 1.1 Susceptibility Model (static/slow-changing baseline)
- **Algorithm:** Random Forest / XGBoost / LightGBM
- **Inputs:** slope angle, aspect, curvature, geology/lithology, land use/land cover, soil thickness (where available), distance to roads/streams, historical landslide density
- **Output:** Baseline susceptibility score per zone (0–1), retrained seasonally or when new terrain data becomes available (not real-time)

### 1.2 Dynamic Trigger Model (short-term forecasting)
- **Algorithm:** Rainfall-threshold logic fused with LSTM or Temporal Fusion Transformer
- **Inputs:** Real-time + forecast rainfall (1hr/3hr/24hr/72hr cumulative), historical rainfall-intensity-duration thresholds calibrated per district
- **Output:** Short-term (1–7 day) risk trajectory per zone
- **Critical requirement:** Thresholds must be district-calibrated, not a single national default — generic thresholds have already failed in real Indian landslide events due to hyperlocal rainfall variance.

### 1.3 Deformation & Vegetation Analysis Module
- **InSAR change detection:** Sentinel-1 time-series displacement analysis (line-of-sight, mm/revisit-cycle)
  - Must output a coherence/confidence flag per grid cell alongside displacement value
  - Cells with persistent low coherence (dense vegetation, steep slopes) should be flagged as "insufficient satellite confidence" rather than silently producing unreliable numbers
- **NDVI anomaly detection:** Deviation from historical seasonal baseline per cell, cloud-cover-filtered
- **Output:** Deformation trend + vegetation stress score, each with an associated confidence flag

### 1.4 Ground-Truth Reinforcement Layer (recommended addition)
- **Low-cost GNSS sensors:** Deployed only at highest-priority slopes (not full-region coverage) to validate/correct InSAR readings where satellite coherence is poor
- **Community rain-gauge network:** NGO/panchayat-maintained gauges feeding hyperlocal rainfall data into the trigger model, filling gaps IMD's grid resolution misses
- Both feeds should carry a `source_reliability` flag distinct from satellite-derived data

### 1.5 Fusion Engine
- Combines susceptibility score, trigger model output, deformation trend, vegetation stress, and ground-truth reinforcement signals into:
  - **Risk score** (0–100 or low/medium/high/critical categorical)
  - **Time-to-failure window** (e.g., "3–10 days"), only produced when confidence thresholds are met — otherwise output "insufficient data for time estimate, elevated risk only"
  - **Explainability breakdown:** top 3–5 contributing factors per prediction (e.g., "72hr rainfall: 180mm (very high) | InSAR deformation: 12mm/month (moderate, high confidence) | NDVI anomaly: -0.15 (elevated stress)")
- **Serving:** FastAPI + MLflow for model versioning, with every prediction tagged to a specific model version and data snapshot ID

---

## 2. Confidence Scoring (Must-Have, Not Optional)

Every output must carry a confidence label, not just a risk number:

| Confidence level | Meaning | Trigger condition |
|---|---|---|
| High | All key signals present and coherent | Rainfall + InSAR (good coherence) + NDVI all available and agree |
| Medium | Partial signal coverage | One signal missing or stale (e.g., InSAR pass overdue >10 days) |
| Low | Insufficient reliable data | Multiple signals missing, low InSAR coherence, no ground-truth reinforcement | 

This confidence label must be surfaced to the web dashboard's Data Source Confidence Monitor and factored into whether a Time-to-Failure estimate is shown at all.

---

## 3. Dataset Schemas Required

### 3.1 Rainfall Dataset (IMD)
- `station_id`, `lat`, `lon`, `elevation`
- `timestamp`, `rainfall_mm`, `cumulative_1hr`, `cumulative_3hr`, `cumulative_24hr`, `cumulative_72hr`
- `forecast_rainfall_mm`, `forecast_confidence`
- `district_threshold_mm` (calibrated intensity-duration threshold)

### 3.2 Deformation Dataset (Sentinel-1 InSAR)
- `zone_id`, `lat`, `lon`, `acquisition_date`
- `displacement_rate_mm`, `direction_los`
- `coherence_score`, `confidence_flag` (high/medium/low)
- `revisit_cycle_days`

### 3.3 Vegetation Dataset (NDVI)
- `zone_id`, `lat`, `lon`, `acquisition_date`
- `ndvi_value`, `ndvi_anomaly` (vs. seasonal baseline)
- `cloud_cover_flag`

### 3.4 Terrain Dataset (DEM)
- `zone_id`, `elevation_m`, `slope_deg`, `aspect_deg`, `curvature`
- `land_use_class`, `lithology_type`, `soil_thickness_m` (nullable, flag if estimated vs. measured)
- `distance_to_road_m`, `distance_to_stream_m`, `distance_to_settlement_m`

### 3.5 Historical Landslide Dataset (NRSC/GSI)
- `event_id`, `date`, `location` (point/polygon), `landslide_type`, `volume_estimate`
- `trigger_cause` (rainfall/human-induced/seismic)
- `casualties`, `infrastructure_damage`, `source_reliability` (verified/media-reported)

### 3.6 Road/Infrastructure Dataset
- `road_segment_id`, `geometry`, `road_class`
- `nearby_villages`, `population_estimate`, `critical_infrastructure_points`
- `chokepoint_flag` (single-access-road villages)

### 3.7 Community Rain-Gauge Dataset
- `gauge_id`, `lat`, `lon`, `maintainer_contact`
- `reading_timestamp`, `rainfall_mm`
- `calibration_log`, `reliability_flag`

### Cross-cutting schema requirements
- Every table must include `zone_id` matching the fixed ~25 sq km grid (further subdivided by slope) for spatial joins across all datasets.
- Every table must include a `data_version`/`ingestion_timestamp` for audit traceability back to specific model predictions.
- Every table must include a `confidence_flag` or `source_reliability` field — no dataset should be treated as ground truth without a quality indicator.

---

## 4. Model Training & Retraining

- **Initial training:** Use NRSC/GSI historical landslide inventory + terrain data to train susceptibility model; validate against known landslide-prone corridors in NER.
- **Retraining cadence:** Seasonal (pre-monsoon) retraining minimum; ad hoc retraining after major events using verified outcome data (actual landslide / no event) fed back from the web dashboard.
- **Feedback loop fields needed from dashboard:**
  - `predicted_risk_level`, `actual_outcome` (landslide occurred / no event / false alarm), `officer_notes`
- **Evaluation metrics to track per district:**
  - Precision/recall on landslide prediction, false-alarm rate, lead time achieved (predicted vs. actual event timing), model drift indicators

---

## 5. API Contract (Model Serving)

| Endpoint | Purpose |
|---|---|
| `GET /predict/zone/{zone_id}` | Current risk score, time-to-failure (if confidence permits), explainability breakdown |
| `GET /predict/zone/{zone_id}/history` | Past risk score trend |
| `POST /feedback/outcome` | Submit verified actual outcome for a past prediction (from dashboard) |
| `GET /model/version` | Current deployed model version + training data snapshot ID |
| `GET /datasources/confidence` | Per-source data freshness/confidence for dashboard monitor |

---

## 6. Suggested Tech Stack

- **Model training/serving:** Python, scikit-learn/XGBoost/LightGBM, PyTorch (for LSTM/TFT), FastAPI for serving
- **Experiment tracking:** MLflow (model versioning, metrics logging)
- **Pipeline orchestration:** Apache Airflow (scheduled ingestion + retraining jobs)
- **Streaming (if needed for community gauge/ground-truth feeds):** Kafka
- **Storage:** S3/MinIO (raw GeoTIFF/Parquet), PostGIS (spatial), TimescaleDB (time-series)

---

## 7. Open Items for AI/ML Team to Confirm

- Exact district-level rainfall-intensity-duration thresholds — needs collaboration with GSI/state geology departments, not assumed defaults.
- Soil thickness data availability per state — confirm what's obtainable vs. needs estimation modeling.
- Final decision on which zones get low-cost GNSS ground-truth sensors (priority list based on historical landslide density + population exposure).
- Confidence threshold cutoffs for when to suppress a time-to-failure estimate vs. show it (needs sign-off from disaster management domain experts, not purely a data science decision).
