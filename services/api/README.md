# Landslide Risk Monitoring API (FastAPI)

FastAPI REST API service providing endpoints for landslide risk assessments, sensor telemetry ingestion, early warnings, and model predictions for the North Eastern Region (NER).

## Prerequisites

- Python 3.10+ (Recommended: Python 3.11)
- Virtual environment (`venv`)

## Getting Started

### 1. Setup Virtual Environment

```bash
cd services/api
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# On Linux/macOS:
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger UI): http://localhost:8000/docs
- Health check: http://localhost:8000/health
- Risks endpoint: http://localhost:8000/api/v1/risks

### 4. Run Tests

```bash
pytest
```
