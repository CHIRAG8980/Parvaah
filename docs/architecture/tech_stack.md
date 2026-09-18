# Parvaah — Production Technology Stack

**Status:** Verified Production  
**Architecture:** Multi-Tier Geospatial Disaster Intelligence Monorepo  
**Package Management:** Native npm Workspaces (v11+)

---

## 1. Data Ingestion & Geospatial Processing

| Component | Technology | Version | Purpose & Implementation |
|---|---|---|---|
| Ingestion Engine | Python AsyncIO | 3.11+ | Automated periodic GIS data ingestion & raster sampling |
| Geospatial Raster Analysis | Rasterio / GDAL | 1.3+ | 30m GeoTIFF sampling from ISRO CartoDEM & Bhuvan |
| Spatial Vectors & Geometries | GeoPandas / Shapely | 0.14+ | GSI Bhukosh GeoJSON points and MoRTH road vector alignments |
| Meteorological Formats | NetCDF4 / Xarray | 1.6+ | Parsing IMD gridded daily rainfall series |
| Primary Satellite Source | ISRO CartoDEM / Bhuvan | Authentic | 30m stereo DEM elevation, slope, aspect, curvature, geomorphology |
| Soil Moisture Feeds | ISRO Bhoonidhi EOS-04 | Level-4 TD | Satellite SAR 500m soil moisture products |

---

## 2. AI/ML Prediction Engine (`apps/ml-engine`)

| Component | Technology | Purpose & Implementation |
|---|---|---|
| Model 1: Static Susceptibility | Scikit-Learn Random Forest | Evaluates intrinsic terrain vulnerability across 10 static features |
| Model 2: Dynamic Hazard Trigger | XGBoost Classifier | Analyzes multi-scale precipitation accumulation (24h/72h) vs. thresholds |
| Model 3: Pre-Event Similarity | Scikit-Learn Random Forest | Hydrological pattern matching against 7d, 14d, 30d historical saturation |
| Model 4: Multi-Modal Fusion | XGBoost Classifier | 19-feature ensemble predicting continuous risk ($0–100$) and failure window |
| Feature Scaler | RobustScaler (`preprocessor.pkl`) | Scales raw terrain and rainfall telemetry prior to inference |
| Model Explainability | Tree SHAP (`shap`) | Computes per-alert contributing factor percentages (slope vs. rain vs. saturation) |
| Serving Interface | `ParvaahInferencePipeline` | Synchronous Python serving layer inside backend services |

---

## 3. Backend & API Services (`apps/backend`)

| Component | Technology | Purpose & Implementation |
|---|---|---|
| Web Framework | FastAPI (Python 3.11+) | Async REST API engine, OpenAPI/Swagger docs at `/docs` |
| ASGI Server | Uvicorn | High-performance asynchronous HTTP server |
| ORM & Persistence | SQLAlchemy 2.0+ | Object-relational mapping with PostGIS spatial query support |
| Primary Database | SQLite (Dev) / PostgreSQL 15+ PostGIS | Relational tables for zones, terrain, weather, risk scores, and roads |
| Data Validation | Pydantic v2 | Strict serialization and request/response schema validation |
| Authentication & RBAC | PyJWT + Passlib (PBKDF2) | Token authentication for DMO, SDMA, and Admin roles |
| Background Automation | AsyncIO Task (`scheduler.py`) | 30-minute background prediction and alert escalation cycles |
| Security Middleware | Custom Defense Headers | X-Content-Type-Options, X-Frame-Options, CSP, HSTS |

---

## 4. Web Command Center (`apps/web`)

| Component | Technology | Purpose & Implementation |
|---|---|---|
| Framework | Next.js 14.2 (App Router) | Server and client-rendered operational command center |
| UI Library | React 18.3 / TypeScript 5.4 | Strict type-safe component development |
| Styling | Tailwind CSS 3.4 | Utility-first responsive design, dark-mode authority theme |
| GIS Mapping | Leaflet 1.9 + React-Leaflet | High-resolution spatial risk map and hazard layer toggling |
| Heatmap Layer | HTML5 Canvas (`HeatmapCanvasLayer`) | High-performance GPU-accelerated client-side Gaussian kernel rendering |
| Analytics & Charting | Recharts 3.10 | Precipitation timelines, risk trajectories, road status distribution |
| Icons | Lucide React | Clean, standard disaster management UI iconography |
| Monorepo Workspaces | Native npm Workspaces | Shared packages: `@landslide/config`, `@landslide/types`, `@landslide/ui` |

---

## 5. Field Officer & Citizen Mobile Client (`apps/mobile`)

| Component | Technology | Purpose & Implementation |
|---|---|---|
| Framework | Flutter 3.x (Dart 3.x) | Cross-platform mobile client for Android and iOS |
| Offline Persistence | `sqflite` (SQLite) | Local caching of zones, roads, and alerts during cellular blackouts |
| State Management | Provider | Reactive, lightweight state management |
| Mobile GIS Maps | `flutter_map` (OpenStreetMap / Custom) | Offline vector tile rendering and risk polygon outlines |
| Secure Storage | `flutter_secure_storage` | Encrypted token and credential storage |
| Security Model | Strict View-Only | Eliminates field personnel distraction and prevents fake public reporting |

---

## 6. Emergency Escalation & Localization

| Component | Technology | Purpose & Implementation |
|---|---|---|
| Alert Standards | NDMA Common Alerting Protocol (CAP) | Standard XML/JSON alert structures matching national guidelines |
| Regional Translation | `apps/backend/app/services/multilingual.py` | Native support for English, Hindi, Khasi, Garo, Assamese, and Bengali |
| Escalation Monitoring | `alert_service.py` | Auto-escalates unreviewed alerts after deadline timer expires |
| Audit Ledger | `audit_service.py` | Immutable database logging of all approvals, rejections, and escalations |
