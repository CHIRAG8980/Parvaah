# Parvaah Backend API Service

FastAPI enterprise REST engine and ML serving layer for the AI-Based Early Warning and Landslide Risk Monitoring System (NER).

---

## 1. Architecture & Lifespan Execution

The service entry point is located in [`app/main.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/main.py). Upon startup:
1. Initializes database schema (`init_db()`) using SQLite or PostgreSQL PostGIS.
2. Ingests verified Indian GIS baselines: ISRO CartoDEM 30m terrain rasters, ISRO Bhuvan geology/LULC layers, MoRTH highway corridors, and GSI Bhukosh historical landslides.
3. Launches the **Continuous Prediction Scheduler** as an asynchronous background worker (`scheduler.py`), executing every 30 minutes to evaluate zone risks and auto-escalate breached alerts.

---

## 2. API Endpoint Modules (`app/api/v1/`)

| Module | Route Prefix | Key Functionality |
|---|---|---|
| **Auth** | `/api/v1/auth` | JWT issuance, refresh tokens, PBKDF2 password authentication, officer profiles |
| **Zones** | `/api/v1/zones` | Monitored zones registry, centroid GIS coordinates, terrain features, risk levels |
| **Roads** | `/api/v1/roads` | National highway segments (NH-106, NH-6), chokepoint flags, clearance bypasses |
| **Weather** | `/api/v1/weather` | 14-day rainfall timeline vs. risk, telemetry ingestion (`POST /readings`) |
| **Predict** | `/api/v1/predict` | 4-Model inference engine, unified physical-ML predictions, SHAP explainability |
| **Alerts** | `/api/v1/alerts` | Human-in-the-loop review queue, DMO approve/reject, auto-escalation timer |
| **Analytics**| `/api/v1/analytics`| Header KPI metrics, district risk breakdown, and `/freshness` staleness status |
| **Data Sources**| `/api/v1/datasources`| Telemetry health checks: AWS rain gauges, InSAR sync, Seismographs |
| **Devices** | `/api/v1/devices` | Field officer mobile device registration for push alerts |
| **Settings**| `/api/v1/settings` | Dynamic operational thresholds (rainfall limits, InSAR triggers) |
| **Audit** | `/api/v1/audit` | Immutable audit log trail for compliance and post-disaster review |

---

## 3. Authentication & RBAC

The API uses JWT bearer tokens with Role-Based Access Control:

* **DMO (`District Officer`)**: Authority to approve/reject district-scoped alerts, view local corridors, and update field road conditions.
* **SDMA (`State Officer`)**: Authority across all state districts, receives auto-escalated alerts.
* **SYSADMIN (`Administrator`)**: Full system configuration, threshold updates, and user provisioning.

### Default Seed Credentials (Development)
| Role | Username | Password | District Jurisdiction |
|---|---|---|---|
| **DMO** | `dmo_east_khasi` | `password123` | East Khasi Hills (Meghalaya) |
| **SDMA** | `sdma_meghalaya` | `password123` | All Meghalaya Districts |
| **Admin** | `admin_ner` | `password123` | All NER States |

---

## 4. Environment Variables

Configure these in `.env` at the monorepo root:

```env
ENVIRONMENT=development
DATABASE_URL=sqlite:///./parvaah_dev.db  # Or postgresql://user:pass@host:5432/parvaah
API_HOST=0.0.0.0
API_PORT=8000
API_V1_PREFIX=/api/v1
JWT_SECRET_KEY=parvaah_dev_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

---

## 5. Running the Service & Tests

```bash
# Run server with hot-reload (port 8000)
../../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run automated test suite (31 unit & integration tests)
../../.venv/bin/pytest tests/ -v
```

* **Interactive Swagger UI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Service Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
