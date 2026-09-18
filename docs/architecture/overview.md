# Parvaah — System Architecture

**Status:** Verified Production Architecture  
**Focus Area:** North Eastern Region (NER) of India  
**Compliance Standard:** Strict Indian Sovereign Primary Data Mandate

---

## 1. Architectural Overview

Parvaah is an enterprise-grade geotechnical disaster intelligence platform engineered specifically for the complex terrain of North East India. It operates across three tightly integrated tiers:

```
                  [ Authentic Sovereign Indian Data Sources ]
  ISRO CartoDEM 30m | ISRO Bhuvan (LULC/Geomorphology) | IMD 0.25° AWS Rainfall
      ISRO Bhoonidhi EOS-04 SAR | GSI Bhukosh (951 Landslides) | MoRTH/PWD Roads
                                      │
                                      ▼
             [ Backend & Ingestion Core (apps/backend - FastAPI) ]
     Startup Seed Loaders (GeoTIFF raster extraction & GSI/Road mapping)
     Continuous Background Scheduler (asyncio 30-minute operational cycles)
                                      │
                                      ▼
               [ 4-Model Sovereign Indian AI Ensemble (apps/ml-engine) ]
     Model 1: Static Susceptibility (RandomForest - 10 terrain features)
     Model 2: Dynamic Hazard Trigger (XGBoost - IMD multi-scale precipitation)
     Model 3: Hydrological Condition Similarity (RF - antecedent saturation match)
     Model 4: Multi-Modal Fusion Engine (19-Feature XGBoost + RobustScaler)
                                      │
                                      ▼
                      [ Persistence & Security Layer ]
      SQLite / PostgreSQL with PostGIS Spatial Extensions (SQLAlchemy ORM)
      RBAC Security (DMO, SDMA, SYSADMIN) & Tamper-Evident Action Audit Ledger
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   [ Web Command Center (apps/web) ]          [ Field Mobile Client (apps/mobile) ]
   - Next.js 14 App Router (Port 3000)        - Flutter 3.x Cross-Platform Client
   - Leaflet GIS Slope Heatmap                - Offline-First Local SQLite Cache
   - 10 Operational Management Routes         - GPS Proximity Risk Alerts
   - Human-in-the-Loop Review Queue           - Multilingual CAP Warning Bulletins
                 │
                 ▼
     [ Emergency Escalation Engine ]
   - Auto-escalation countdown timers
   - NDMA Common Alerting Protocol (CAP)
   - 6 NER Regional Languages
```

---

## 2. Ingestion & Preprocessing Tier

1. **Terrain Baselines (`apps/backend/app/ingest/real_zones_loader.py`)**:
   - Centroid coordinates are mapped against 30m GeoTIFF rasters from **ISRO CartoDEM** (`elevation_30m.tif`, `slope_30m.tif`, `aspect_30m.tif`, `curvature_30m.tif`).
   - Geological classifications are queried from **ISRO Bhuvan 1:50k** rasters (`bhuvan_geomorphology_shillong_30m.tif`, `bhuvan_lineament_shillong_30m.tif`, `bhuvan_lulc_shillong_30m.tif`).
   - Feature coordinates are extracted per-zone and persisted into `terrain_features.ml_*` database columns.
2. **Dynamic Meteorological Feeds**:
   - Telemetry is ingested from the **India Meteorological Department (IMD / MoES)** AWS station network and Cherrapunji Doppler Weather Radar (DWR).
   - Real-time readings are pushed via `POST /api/v1/weather/readings`.
3. **Foreign Data Policy**:
   - Foreign APIs (Open-Meteo, OpenStreetMap, USGS, Sentinel-1/2) have been audited and purged from runtime code to ensure complete sovereign compliance.

---

## 3. AI/ML Inference Pipeline

Managed through [`apps/backend/app/services/ml_service.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/services/ml_service.py) and executed by [`apps/ml-engine/src/inference_pipeline.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/ml-engine/src/inference_pipeline.py):

* **Feature Vector Assembly**: Combines 19 features (static terrain, dynamic precipitation, DOY seasonal indices, and ground truth baseline).
* **Scaling**: Applies a pre-trained `RobustScaler` (`preprocessor.pkl`).
* **Calibrated Output**: Predicts a continuous risk score ($0–100$), categorical risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), confidence score, and failure window ($1–3\text{ days}$ or $3–7\text{ days}$).
* **Explainability**: Computes SHAP factor contributions to identify whether slope steepness, 24h cloudburst, or antecedent saturation drove the warning.

---

## 4. Continuous Background Scheduler

Defined in [`apps/backend/app/services/scheduler.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/services/scheduler.py):

* Runs continuously inside the FastAPI lifespan as an asynchronous task every **30 minutes**.
* Queries active telemetry for all registered zones in Meghalaya and NER.
* Runs inference and appends time-versioned `RiskScore` records (`rs-imd-{zone_id}-{timestamp}`).
* Automatically queues an `Alert` when a zone enters `HIGH` or `CRITICAL` risk and starts an escalation countdown timer.

---

## 5. Early Warning Review & Escalation

Defined in [`apps/backend/app/services/alert_service.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/services/alert_service.py):

* **Human-in-the-Loop Review**: Alerts sit in `pending_review` in the Command Center queue (`/alerts`).
* **Officer Actions**: Disaster Management Officers (DMOs) can approve, edit warning messages, or reject with a documented reason code.
* **Auto-Escalation**: If unreviewed after the countdown expires, the system automatically escalates the alert to state and national authorities (SDMA/NDMA).
* **Localization**: Broadcasts are generated in 6 regional languages (English, Hindi, Khasi, Garo, Assamese, Bengali) using [`multilingual.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/services/multilingual.py).

---

## 6. Client Architecture

### A. Web Command Center (`apps/web`)
* Built with **Next.js 14 (App Router)**, **React 18**, and **Tailwind CSS**.
* Interactive Leaflet GIS map with custom high-performance HTML5 canvas heatmap rendering (`HeatmapCanvasLayer.ts`).
* 10 production dashboard modules for regional surveillance, weather, road logistics, and system administration.

### B. Mobile App (`apps/mobile`)
* Built with **Flutter 3.x** for Android and iOS.
* **Offline-First**: Caches zones, active alerts, and road blockages locally in SQLite so field officers retain life-saving visibility in deep mountain blackouts.
* Strict view-only security model to eliminate distractions and false user submissions.
