# Architecture
## AI-Based Early Warning and Landslide Risk Monitoring System (NER) — Final Version

---

## Overview

The system has five layers: data ingestion, AI/ML prediction, storage and GIS, application/API, and alerting. The mobile app is view-only (no citizen/field reporting); the web dashboard is the sole control-room interface for monitoring, review, and alert approval.

```
IMD Rainfall + Community Rain Gauges + Satellite (ISRO/Sentinel) + Historical Records + Road/Infra Data
                                        |
                        Ingestion Pipeline (Airflow, Kafka)
                                        |
                        Data Quality & Confidence Scoring Layer
                                        |
                        AI/ML Fusion Engine (risk score + time-to-failure + explainability)
                                        |
                        PostGIS + TimescaleDB + GeoServer (storage, map layers)
                                        |
                        Backend API (FastAPI / NestJS)
                                        |
                        ---------------------------------------------------
                        |                                                 |
                Web Dashboard (control room)                    Mobile App (view-only)
                district admin, state authority,                 citizens, field officials —
                duty officers — monitoring & alert approval        offline-first risk viewer only
                        |
                Alert Dispatch Engine
                (SMS, IVR, App Push, CAP → Sachet → Radio/TV/Siren fallback)
                        |
                Escalation Monitor (auto-escalates unactioned critical alerts)
```

---

## 1. Data Ingestion Layer

**Sources:**
- IMD API (rainfall, real-time + forecast)
- Community rain-gauge network (NGO/panchayat-run, hyperlocal rainfall)
- Sentinel-1 (InSAR deformation, soil moisture proxy)
- Sentinel-2 (NDVI vegetation stress)
- ISRO Bhuvan/Bhoonidhi (satellite imagery, DEM)
- NRSC/GSI (historical landslide records)
- OpenStreetMap + state PWD/NHAI (road and infrastructure layers)

**Pipeline:**
- Apache Airflow for scheduled institutional pulls (IMD, satellite sources)
- Kafka for streaming community rain-gauge and web-submitted field-official data
- Raw data stored in S3/MinIO as GeoTIFF and Parquet

**Data Quality Layer (new):**
- Every incoming record is tagged with a confidence/quality flag (e.g., InSAR coherence score, NDVI cloud-cover flag, gauge calibration status)
- Low-confidence data is down-weighted, not silently used, in the fusion engine

---

## 2. AI/ML Prediction Engine

- **Susceptibility model:** XGBoost/LightGBM trained on slope, geology, land use, historical landslide density, and (where available) soil thickness/depth-to-bedrock proxies
- **Dynamic trigger model:** Rainfall-threshold logic (calibrated per district, not generic) fused with LSTM/Temporal Fusion Transformer for short-term forecasting
- **Deformation and vegetation analysis:** InSAR change detection and NDVI anomaly detection, explicitly flagged as trend indicators rather than standalone predictors given known revisit-time and vegetation-decorrelation limits
- **Ground-truth validation:** Low-cost GNSS sensors at a small number of highest-priority slopes, used to validate/correct InSAR readings where satellite coherence is poor
- **Fusion engine:** Combines all signals into a single risk score and a time-to-failure estimate per zone, with confidence bounds
- **Explainability:** SHAP-based factor breakdown attached to every alert (e.g., "72hr rainfall: 180mm; deformation trend: rising; NDVI anomaly: moderate")
- **Serving:** FastAPI + MLflow for model versioning and tracking

---

## 3. Storage and GIS

- **PostgreSQL + PostGIS:** Spatial data (zones fixed at ~25 sq km grid, subdivided by slope; roads; villages; risk scores)
- **TimescaleDB:** Time-series rainfall and satellite-derived readings
- **Redis:** Caching and real-time pub/sub for alert dispatch
- **GeoServer:** Serves map layers (WMS/WFS) to the web dashboard

---

## 4. Application and API Layer

- **Backend:** FastAPI or NestJS, exposing REST/GraphQL APIs
- **Auth:** Keycloak (OAuth2), role-based access — district admin, state disaster authority, duty officer, field official (web access only)
- **Web dashboard:** React + Next.js, Mapbox GL/Leaflet — risk heatmaps, road connectivity, weather-linked forecast, alert review queue, analytics, audit logs
- **Mobile app:** Flutter, offline-first, **view-only** — caches risk maps, road status, and forecasts locally; receives push alerts; contains no reporting, photo, or video capture functionality of any kind

---

## 5. Alerting Layer

- **Channels:** SMS (DLT-registered), IVR (low-literacy areas), app push (FCM), and non-digital fallback via Sachet (radio, TV, cell broadcast, sirens) for zones with no mobile coverage
- **Format:** NDMA Common Alerting Protocol (CAP), integrated with the Sachet platform
- **Languages:** Pre-translated templates for major NER languages
- **Flow:** Alerts above threshold go to a duty officer for review before dispatch
- **Escalation SOP (new):** If a critical alert is not actioned within a defined time window (e.g., 30–60 minutes), it auto-escalates to the next authority level (district collector → SDMA → NDMA) and the delay is logged in the audit trail

---

## Infrastructure

- Kubernetes for deployment and autoscaling
- Terraform for infrastructure as code
- Hosted on an empanelled Indian government cloud (MeghRaj/NIC) for data residency
- Prometheus + Grafana for monitoring, with full audit logging on every prediction and alert

---

## Data Flow Summary

```
IMD + Community Gauges + Satellite + Historical Records + Road Data
        |
   Ingestion Pipeline (Airflow, Kafka) + Data Quality Scoring
        |
   AI/ML Fusion Engine (risk score + time-to-failure + explainability)
        |
   PostGIS + TimescaleDB + GeoServer (storage, map layers)
        |
   Backend API (FastAPI/NestJS)
        |
   ---------------------------------------------
   |                                           |
Web Dashboard                            Mobile App
(admins, duty officers — full control)   (citizens/field officials — view-only)
        |
   Alert Dispatch (SMS, IVR, App Push, CAP → Sachet → Radio/TV/Siren)
        |
   Escalation Monitor (auto-escalation on unactioned critical alerts)
```

---

## Key Architectural Decisions (Final)

1. **No citizen/field photo or video reporting** — the mobile app is strictly view-only; all field verification happens through the web dashboard by authorized officials.
2. **Hybrid sensing** — satellite data (InSAR/NDVI) is treated as a trend/susceptibility signal, supplemented by community rain gauges and targeted low-cost GNSS for ground-truth validation.
3. **Fixed zone resolution (~25 sq km, slope-subdivided)** — avoids both overly coarse district-level alerts and computationally unmanageable per-meter grids.
4. **Timed escalation on alert review** — closes the institutional accountability gap where a valid alert could otherwise go unactioned.
5. **Non-digital alert fallback** — routes critical alerts through Sachet's radio/TV/siren channels for villages with no mobile network coverage.
