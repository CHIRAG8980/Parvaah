# Tech Stack
## AI-Based Early Warning and Landslide Risk Monitoring System (NER) — Final Version

---

## 1. Data Ingestion

| Component | Technology | Purpose |
|---|---|---|
| Scheduled data pulls | Apache Airflow | IMD rainfall, satellite feeds, terrain data on a schedule |
| Streaming ingestion | Apache Kafka | Community rain-gauge readings, field-official inputs (web-submitted, not app) |
| Raw data lake | AWS S3 / MinIO (self-hosted) | Stores GeoTIFF (satellite) and Parquet (tabular/time-series) |
| Data quality checks | Great Expectations / custom validators | Flags low-confidence readings (e.g., InSAR decorrelation, cloud-covered NDVI) |

## 2. AI/ML Prediction Engine

| Component | Technology | Purpose |
|---|---|---|
| Susceptibility model | XGBoost / LightGBM (scikit-learn ecosystem) | Static risk based on slope, geology, land use, historical density |
| Trigger/forecast model | LSTM / Temporal Fusion Transformer (PyTorch) | 1–7 day risk evolution from rainfall time-series |
| Deformation analysis | SNAP (ESA toolbox) + custom InSAR pipeline | Sentinel-1 change detection |
| Vegetation analysis | Google Earth Engine / custom NDVI pipeline | Sentinel-2/Landsat anomaly detection |
| Fusion engine | Custom Python service (weighted ensemble + rules) | Combines all signals into risk score + time-to-failure window |
| Explainability | SHAP | Per-alert factor breakdown (slope, rainfall, deformation contribution) |
| Model serving | FastAPI + MLflow | Versioned model serving and experiment tracking |
| Experiment tracking | MLflow | Model version audit trail, tied to every prediction log |

## 3. Storage & GIS

| Component | Technology | Purpose |
|---|---|---|
| Spatial database | PostgreSQL + PostGIS | Zones, roads, villages, risk scores |
| Time-series database | TimescaleDB | Rainfall and satellite-derived time-series readings |
| Cache / pub-sub | Redis | Caching, real-time alert dispatch messaging |
| Map server | GeoServer | WMS/WFS map layers for dashboard |
| Object storage | S3 / MinIO | Raw and processed geospatial files |

## 4. Backend & API

| Component | Technology | Purpose |
|---|---|---|
| API framework | FastAPI (Python) or NestJS (Node.js) | REST/GraphQL APIs for dashboard and alert services |
| Auth & RBAC | Keycloak (OAuth2/OIDC) | Role-based access: district admin, state authority, duty officer, field official |
| Task queue | Celery / BullMQ | Async jobs (retraining triggers, alert dispatch retries) |
| API gateway | Kong / Nginx | Rate limiting, routing, TLS termination |

## 5. Web Dashboard (Control Room)

| Component | Technology | Purpose |
|---|---|---|
| Frontend framework | React + Next.js | Dashboard UI |
| Mapping library | Mapbox GL JS / Leaflet | Risk heatmaps, road connectivity layers |
| Charting | Recharts / D3.js | Rainfall vs. risk trend panels, analytics views |
| State management | Redux Toolkit / React Query | Data fetching and caching on the frontend |

## 6. Mobile App (View-Only Risk Viewer)

| Component | Technology | Purpose |
|---|---|---|
| Framework | Flutter | Cross-platform (Android priority for NER device landscape) |
| Offline storage | Hive / SQLite (local cache) | Cached risk maps, road status, forecasts for offline viewing |
| Push notifications | Firebase Cloud Messaging (FCM) | Risk/alert push when online |
| Background sync | WorkManager (Android) / native background fetch | Periodic refresh of cached data when connectivity available |
| Maps rendering (offline) | Mapbox Offline Maps / MapLibre | Cached map tiles for offline use |

## 7. Alerting & Interoperability

| Component | Technology | Purpose |
|---|---|---|
| SMS gateway | DLT-registered SMS provider (e.g., government-empanelled aggregator) | Bulk SMS alerts |
| IVR | Telecom IVR gateway (empanelled provider) | Voice alerts for low-literacy areas |
| Alert protocol | Common Alerting Protocol (CAP) XML | Standardized alert format |
| National integration | NDMA Sachet (Integrated Alert System, built by C-DOT) | Federated alert dissemination, radio/TV/siren/cell-broadcast fallback |
| Message templating | i18next / custom template engine | Multilingual pre-approved alert templates |

## 8. Infrastructure & DevOps

| Component | Technology | Purpose |
|---|---|---|
| Container orchestration | Kubernetes | Deployment, autoscaling |
| Infrastructure as code | Terraform | Reproducible infra provisioning |
| Cloud hosting | Empanelled Indian government cloud (MeghRaj / NIC) | Data residency and compliance |
| CI/CD | GitHub Actions / GitLab CI | Automated build, test, deploy pipelines |
| Monitoring | Prometheus + Grafana | System health, latency, job success monitoring |
| Logging & audit | ELK Stack (Elasticsearch, Logstash, Kibana) or OpenSearch | Full audit logs for predictions and alerts |
| Secrets management | HashiCorp Vault | API keys, credentials for external data sources |

## 9. External Data Source APIs

| Source | Access Method |
|---|---|
| IMD (rainfall, forecast) | IMD public/institutional API |
| ISRO Bhuvan / Bhoonidhi | ISRO data portal API/download |
| Sentinel-1 / Sentinel-2 | Copernicus Open Access Hub / Google Earth Engine |
| SRTM / Cartosat DEM | USGS Earth Explorer / ISRO Bhuvan |
| NRSC / GSI landslide inventory | NRSC/GSI data portals (institutional access) |
| OpenStreetMap | OSM Overpass API |
| Community rain-gauge network | Custom lightweight API/mobile-web form for NGO/panchayat volunteers |
