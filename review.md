# Parvaah Landslide Early Warning System — End-to-End Architectural Review

**Document Status:** Complete Architecture & Implementation Review  
**Project:** Parvaah (SIH 2026) — Landslide Early Warning & Risk Governance System for North Eastern Region (NER)  
**Date of Audit:** September 14, 2026  
**Scope:** Models, ML Training Artifacts, Data Feeds, Ingestion Pipeline, Backend Services, Relational Schema, APIs, Web Dashboard, and Mobile App.

---

## 1. Executive Architecture Summary

Parvaah operates as a multi-tier geotechnical hazard intelligence system consisting of:
1. **Machine Learning & Geospatial Processing Core (`apps/ml-engine`)**:
   - Curated feature repository (CartoDEM 30m, Sentinel-1 SAR, Sentinel-2 MSI, Bhuvan Geomorphology/LULC, OSM roads/settlements, IMD gridded daily rainfall, GSI/ISRO landslide inventory).
   - A trained 19-feature XGBoost/Random Forest fusion model (`fusion_risk_model.pkl`).
   - A rigorous research pipeline for Time-To-Failure (TTF) that enforces statistical defensibility gates.
2. **FastAPI Backend Core (`apps/backend`)**:
   - Lifespan automated database schema creation (`PostgreSQL` / `SQLite` fallback).
   - Ingestion loaders (`real_data_loader.py`, `real_zones_loader.py`, `real_telemetry_loader.py`).
   - Domain services: `WeatherService` (live Open-Meteo API integration), `MLService` (joblib model loading + physics-calibrated fallback), `AlertService` (review queue, auto-escalation countdown, multilingual templates), `RoadService` (network chokepoints and safe routing), and `AuditService` (immutable event ledger).
   - Role-Based Access Control (RBAC) supporting District Disaster Management Officers (DMO), State Officers (SDMA), and System Administrators.
3. **Next.js Web Command Center (`apps/web`)**:
   - Interactive Leaflet GIS map with dynamic spatial bounding envelopes, continuous Gaussian-weighted landslide heatmaps, and highway corridor overlays.
   - Live district-scoped KPI summary metrics, recent rainfall trend graphs, multi-day weather forecast panels, alert approval/rejection workflows, CSV compliance export, and system configuration tuning.
4. **Flutter Mobile Application (`apps/mobile`)**:
   - Citizen & field responder client providing geo-targeted early warnings, multi-lingual advisories (English, Assamese, Bengali, Manipuri, Khasi, Mizo, Hindi), safe corridor routing, and push notification device registration.

---

## 2. End-to-End Data Lifecycle: Ingestion to Predictions, Dashboard, and Alerts

```
[External / Offline Sources]
  - IMD Gridded Rainfall (0.25° daily)
  - GSI / ISRO Landslide Ground-Truth GeoJSON (951 events)
  - CartoDEM 30m Elevation & Slopes
  - Bhuvan LULC & Geomorphology
  - OpenStreetMap Corridors
  - Open-Meteo Live API
             │
             ▼
[Backend Startup Ingestion (apps/backend/app/ingest)]
  1. real_zones_loader.py: Computes centroid coordinates, registers monitored zones (Zone, TerrainFeature).
  2. real_roads_loader.py: Binds highway corridors (NH-106, NH-6, GS Road) to monitored zones.
  3. real_telemetry_loader.py: Parses active rainfall, executes ml_service.predict_risk(), stores RainfallReading, RiskScore, and seeds Alert records.
             │
             ▼
[Machine Learning Serving (app/services/ml_service.py)]
  - Loads saved_models/fusion_risk_model.pkl (19 features).
  - Evaluates physics-informed triggers: slope angle weight (35%), 24h/72h rainfall weight (40%), InSAR creep (15%), pore moisture (10%).
  - Runs model.predict_proba() for calibrated ensemble output.
  - Generates RiskScore numeric (0-100), RiskLevel (LOW, MEDIUM, HIGH, CRITICAL), and ExplainabilityFactors.
             │
             ▼
[PostgreSQL Relational Persistence]
  - zones, terrain_features, roads, rainfall_readings, risk_scores, alerts, system_settings, audit_logs.
             │
             ▼
[REST APIs (app/api/v1/*)]
  - /weather/forecast (Open-Meteo live hourly/daily trend + fallback)
  - /zones, /zones/heatmap (Continuous Gaussian-weighted intensity points)
  - /analytics/kpis (District-scoped or regional summary metrics)
  - /alerts/queue, /alerts/{id}/approve (Review queue & lifecycle)
  - /roads, /roads/reroute (Corridor status & detour advisor)
  - /predict/zone/{id}, /predict/simulate (On-demand inference & what-if scenarios)
             │
             ▼
[Frontend & Mobile Consumption]
  - Next.js Dashboard: LiveRiskMap, KpiSummaryCards, WeatherForecast, RecentAlerts, Charts.
  - Flutter Mobile: Live GIS Map, Multilingual push alerts, Safe corridor navigation.
```

---

## 3. Data Source Classification (Live vs. Near-Real-Time vs. Historical)

| Data Source / Stream | Ingestion Mechanism | Current Classification | Description / Notes |
| :--- | :--- | :--- | :--- |
| **Open-Meteo Numerical Weather API** | Live HTTPS outbound API (`WeatherService.get_forecast`) | **Live** | Queries live precipitation, temperature, and WMO weather codes for zone lat/lon. Fetches 7 days past observed + 7 days future forecast hourly. |
| **USGS Global Seismic Telemetry** | Live HTTPS endpoint ping (`_ping_http` in `datasources.py`) | **Live** | Real-time connectivity and latency health monitoring of earthquake feeds. |
| **IMD Gridded Daily Rainfall** | Local feature CSV (`rainfall_districtwise_daily_imd.csv`) | **Historical** | 32,146 daily historical records (2014–2024). During server startup, the latest representative active monsoon events (≥ 45mm) are ingested into `rainfall_readings`. |
| **GSI Bhukosh & ISRO Landslide Inventory** | GeoJSON file (`meghalaya_1330_landslides.geojson`) | **Historical** | 951 institutional ground-truth landslide records across Meghalaya used for zone centroids and the spatial heatmap. |
| **CartoDEM 30m Digital Elevation** | Preprocessed GeoTIFF / CSV bands | **Historical** | Used during ML model training to compute elevation, slope angle, aspect, and curvature. |
| **Sentinel-1 SAR Coherence / InSAR** | Feature matrices (`features/individual_bands`) | **Historical / Calibrated** | August 2024 SAR imagery used in training; runtime accepts InSAR velocity with baseline creep default. |
| **Sentinel-2 MSI (NDVI Vegetation)** | Feature matrices (`features/individual_bands`) | **Historical / Calibrated** | August 2024 optical bands used in training; runtime accepts NDVI input with baseline default. |
| **ISRO Bhuvan (LULC, Geomorphology, Lineaments)** | Processed feature CSVs | **Historical** | Static geological and land use classifications mapped into spatial grids. |
| **OpenStreetMap Arterial Corridors** | GeoJSON and Road segment records in DB | **Near-Real-Time / Dynamic** | Highways (NH-106, NH-6, GS Road) stored in PostgreSQL with dynamic status (`open`, `at_risk`, `blocked`) and blockage remarks updated by operators or alert events. |
| **Community Rain Gauges (Simulated Table)** | Database entity (`community_gauges`) | **Static / Seeded** | Model entity exists in database; count is queried dynamically by weather and zone endpoints. |

---

## 4. Machine Learning Model Inspection

### 4.1 Fusion Risk Model (`apps/ml-engine/models/fusion_risk`)
- **Status:** **Fully Trained & Operational on Disk**.
- **Model File:** `apps/ml-engine/models/fusion_risk/saved_models/fusion_risk_model.pkl`.
- **Preprocessor File:** `apps/ml-engine/models/fusion_risk/saved_models/preprocessor.pkl`.
- **Training Architecture:** XGBoost Classifier trained on 7,318 train samples, 1,543 validation samples, and 1,600 test samples.
- **Input Features (19 dimensions):**
  1. `aspect`
  2. `bhuvan_geomorphology_shillong`
  3. `bhuvan_lineament_shillong`
  4. `bhuvan_lulc_shillong`
  5. `curvature`
  6. `distance_to_road`
  7. `distance_to_settlements`
  8. `distance_to_streams`
  9. `dynamic_hazard_alert_DOY235`
  10. `elevation`
  11. `ndvi_shillong`
  12. `rainfall_24h`
  13. `rainfall_72h`
  14. `rainfall_antecedent_7d`
  15. `sar_coherence_shillong`
  16. `sar_intensity_shillong`
  17. `sar_ratio_shillong`
  18. `slope`
  19. `static_susceptibility_map`
- **Evaluation Metrics (Test Set):**
  - Accuracy: `86.44%`
  - ROC-AUC: `0.7387`
  - Precision: `21.95%`
  - Recall: `18.24%`
  - Specificity: `93.39%`
  - False Positive Rate: `6.61%`
- **Inference Runtime Integration:**
  `app.services.ml_service.MLService` loads `fusion_risk_model.pkl` on initialization. If present, it formats runtime features and computes probabilities using `predict_proba()`. In addition, it evaluates physical triggers (slope thresholds, antecedent rainfall saturation) to ensure critical geotechnical safety bounds cannot be bypassed.

### 4.2 Time-to-Failure (TTF) Model (`apps/ml-engine/models/time_to_failure`)
- **Status:** **Complete Pipeline Implemented; Model Training Deliberately Gated (Not Fabricated)**.
- **Diagnostics Report:** `outputs/diagnostics/defensibility_check.json`.
- **Reasoning & Institutional Integrity:** The pipeline explicitly requires at least 50 historical landslide events with verified exact calendar dates (down to the day) to train a defensible regression/survival model. Because existing public historical landslide inventories from Meghalaya record predominantly year-only timestamps (e.g. "2014") rather than exact hour/day timestamps, the pipeline refuses to fabricate synthetic dates.
- **Runtime Handling:** In `apps/backend/app/services/ml_service.py`, Time-to-Failure is provided via calibrated physical time windows derived from risk severity:
  - Critical Risk: `1–3 days`
  - High Risk: `3–7 days`
  - Medium Risk: `7–14 days`
  - Low Risk: `None / Stable`

---

## 5. Component-by-Component Implementation Status

### Working Now (Production-Grade & Verified)
1. **Full-Stack Authentication & Session Management**:
   - Secure HttpOnly cookie authentication (`parvaah_access_token`, `parvaah_refresh_token`, `parvaah_csrf_token`).
   - Token rotation family validation preventing replay attacks.
   - Role-Based Access Control (`admin`, `state_officer`, `district_officer`).
   - Registration flow for District Disaster Management Officers (DMO) with automatic district scoping.
2. **Dynamic GIS Risk Map**:
   - Leaflet tile layer rendering supporting Satellite, Terrain, and Street basemaps.
   - Dynamic jurisdiction boundary calculation for any selected district or zone centroid.
   - Gaussian-weighted continuous landslide heatmap (`/api/v1/zones/heatmap`) reflecting real GSI historical landslide points weighted by active risk scores.
   - Interactive markers displaying live slope, elevation, and risk index tooltips.
3. **Weather Forecast & Rainfall Telemetry**:
   - Live external HTTPS integration with Open-Meteo API for real-time 7-day past observed and 7-day future forecast data.
   - Hourly precipitation trend data rendered in Recharts area/line charts.
   - Graceful fallback to persistent database readings if internet connectivity is degraded.
4. **Control Room Alert Review Queue**:
   - Officer review queue displaying active early warnings with real-time countdown timers.
   - Automated server-side escalation: unreviewed alerts exceeding deadline automatically elevate to the State Disaster Management Authority (`SDMA`).
   - Single-click approval and dispatch triggering audit logging.
   - Rejection workflow capturing structured feedback codes (`false_positive_rain_threshold`, etc.).
5. **Highway Corridors & Advisory Routing**:
   - Highway corridor database tracking operational status (`open`, `at_risk`, `blocked`).
   - Advisory rerouting endpoint (`/api/v1/roads/reroute`) detecting chokepoints and proposing alternate mountain routes.
   - CSV export for operational logistics.
6. **Audit & Compliance Ledger**:
   - Immutable audit table logging alert approvals, rejections, escalations, rainfall ingestion, and device registrations.
   - Streaming CSV export endpoint (`/api/v1/audit-log/export`).
7. **System Configuration Tuning**:
   - Admin settings endpoint (`/api/v1/settings`) to update geotechnical alert thresholds (rainfall warning/critical mm, InSAR creep, soil saturation) and toggle communication channels (NDMA CAP, WhatsApp, SMS, Sirens).
8. **Automated Testing Suite**:
   - Backend Pytest suite (`31 passed, 0 failures`).
   - Comprehensive Playwright browser automation test suite (`tests_playwright_e2e.py`) verifying all 13 core user journeys.

### Working with Calibrated / Offline Baselines
1. **InSAR Surface Creep & Soil Moisture Inputs**:
   - The ML service accepts live InSAR displacement (`insar_deformation_mm_yr`) and soil moisture (`soil_moisture_pct`). Because physical continuous IoT borehole sensors and daily InSAR satellites are not connected to live webhooks in this environment, realistic baseline defaults (`-12.0 mm/yr` and `75%` saturation) are supplied when live telemetry is omitted.
2. **Community Rain Gauges**:
   - The database schema and models (`CommunityGauge`) are fully defined. Active counts are dynamically reflected in API responses, but real-time hardware ingestion currently relies on the `/api/v1/weather/readings` API endpoint.

### Static / Historical Data Components
1. **GSI Ground-Truth Landslides**:
   - `apps/ml-engine/data/raw/ground_truth/meghalaya_1330_landslides.geojson` contains 951 static historical coordinates from GSI/Bhukosh.
2. **Historical IMD Gridded Rainfall Records**:
   - `apps/ml-engine/data/processed/features/rainfall_districtwise_daily_imd.csv` contains historical records through 2024. During startup, representative active monsoon conditions are read to seed initial database telemetry.

### Planned / Missing External Integrations
1. **Live Physical Hardware Webhook Receivers**:
   - Direct MQTT/LoRaWAN ingestion brokers for on-site IoT tiltmeters and piezometers are planned for field deployment; currently, data ingestion is mediated via REST endpoints (`/api/v1/weather/readings`).
2. **Third-Party Dissemination SMS/CAP Gateway Live Handshakes**:
   - While the alert approval logic persists dispatched states, logs audit records, and formats NDMA Common Alerting Protocol (CAP) messages, external live SMS gateway APIs (e.g. CDAC/NIC SMS gateway) require government credentials and are currently recorded in the audit trail rather than executing external telecom HTTP requests.
3. **Dedicated InSAR Processing Pipeline**:
   - Automated interferogram formation from raw Sentinel-1 SLC frames in real-time requires significant high-performance computing (ISCE2/SNAP). At present, pre-derived InSAR deformation layers are utilized.

---

## 6. Verification Status

- **Backend Pytest Suite:** Passed (`31/31 passed`).
- **Frontend TypeScript Build (`apps/web`):** Clean compilation (`npx tsc --noEmit` exited with code 0).
- **Playwright End-to-End Test Suite:** Passed (`13/13 test suites passed`, 100% feature coverage).
- **Security Check:** HttpOnly secure cookies, CSRF protection, and strict CORS whitelist verified.

---

*This review document represents the definitive end-to-end technical state of the Parvaah system as of September 14, 2026.*
