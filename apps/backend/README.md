# Parvaah Backend API

FastAPI backend service for the AI-Based Early Warning and Landslide Risk Monitoring System (NER).

## Features
- **GIS Risk Engine**: Zone-level landslide hazard assessment across North Eastern Region (Meghalaya, Arunachal Pradesh, Manipur, Assam, Sikkim, Mizoram, Nagaland).
- **Control Room API**: Alert review queue, approval/rejection workflows, timed escalation monitors, and audit logging for Disaster Management Officers.
- **Mobile Citizen API**: Offline sync, 7-day risk trajectory, road status, safe alternate rerouting, and 8 pre-translated NER language alerts.
- **ML Integration**: Direct inference pipeline using the trained Random Forest / Gradient Boosting fusion model from `apps/ml-engine` with SHAP explainability.
- **Relational Storage**: PostgreSQL + PostGIS database persistence with seed data.

## Running the Server
```bash
# From workspace root using .venv
.venv/bin/uvicorn app.main:app --app-dir apps/backend --host 0.0.0.0 --port 8000 --reload
```

## Running Tests
```bash
.venv/bin/pytest apps/backend/tests -v
```
