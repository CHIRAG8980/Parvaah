# Parvaah: AI-Based Early Warning and Landslide Risk Monitoring System (NER)

An end-to-end, multi-tier early warning and landslide risk monitoring platform engineered for the North Eastern Region (NER) of India. The platform integrates real-time meteorological rainfall triggers, Sentinel-1 InSAR surface deformation, Sentinel-2 vegetation dynamics (NDVI), and machine learning susceptibility baselines to deliver proactive hazard alerts for disaster authorities and field teams.

---

## Monorepo Architecture

This repository is organized as a **pnpm monorepo** for JavaScript/TypeScript packages, alongside native environments for Flutter and Python services:

- **JavaScript / TypeScript**: Managed by **pnpm workspace** (`apps/web`, `packages/types`, `packages/config`, `packages/ui`).
- **Mobile (Flutter / Dart)**: Managed by **Flutter SDK / Dart tooling** (`flutter pub get`, `flutter run`).
- **Backend & ML Services (Python)**: Managed with standard Python tooling (`requirements.txt`, virtual environments, `uvicorn`, `pytest`).

```
Parvaah/
├── apps/
│   ├── web/                     # Disaster Authority Web Dashboard (@landslide/web - Next.js, React, Tailwind, TS)
│   └── mobile/                  # Field Officer & Citizen Risk Viewer (Flutter, Dart, Offline-First)
│
├── packages/
│   ├── types/                   # Shared TypeScript interfaces & types (@landslide/types)
│   ├── config/                  # Shared configurations, constants, tsconfig base (@landslide/config)
│   └── ui/                      # Shared reusable UI component library (@landslide/ui)
│
├── services/
│   ├── api/                     # REST API Backend (FastAPI, Uvicorn, Pydantic)
│   └── ml-engine/               # AI/ML Prediction & Fusion Engine (InSAR, Rainfall, Susceptibility)
│
├── infrastructure/
│   ├── docker/                  # Dockerfiles and Docker Compose orchestration
│   ├── kubernetes/              # K8s deployment and service manifests
│   └── terraform/               # Cloud infrastructure provisioning templates
│
├── docs/                        # Architecture guides, API specs, and domain research
├── package.json                 # Monorepo root workspace configuration
├── pnpm-workspace.yaml          # pnpm workspace definition
└── .gitignore                   # Multi-stack gitignore
```

---

## Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v20.x` or `v22+` (System verified: `v24.13.1`)
- **pnpm**: `v9+` or `v12+` (System verified: `12.3.4`)
- **Python**: `3.10+` (System verified: `3.11.0`)
- **Flutter**: `3.x` (System verified: `3.47.2` / Dart `3.13.2`)

---

## Quickstart & Installation

### 1. Install Node.js Workspace Dependencies

From the repository root:

```bash
pnpm install
```

This installs all dependencies across `packages/*` and `apps/web` while resolving internal workspace protocols (`workspace:*`).

### 2. Build Shared Packages

```bash
pnpm build
```

---

## Development Workflows

### 🌐 Web Dashboard (`apps/web`)

The web dashboard is built for disaster authorities to visualize regional risks, rainfall anomalies, and InSAR velocity.

```bash
# Run from repository root
pnpm --filter @landslide/web dev

# Or directly from apps/web
cd apps/web
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 📱 Flutter Mobile Application (`apps/mobile`)

The mobile app provides an offline-first landslide hazard viewer for field responders and communities.

> **Note**: Flutter dependencies and commands must be run via Flutter tooling, **not** pnpm.

```bash
cd apps/mobile

# Get dependencies
flutter pub get

# Run on connected device or emulator
flutter run

# Run tests
flutter test
```

### ⚡ FastAPI Backend (`services/api`)

Provides REST APIs for risk scores, live telemetry ingestion, and alert distributions.

```bash
cd services/api

# Create & activate virtual environment
python -m venv .venv
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start API server
uvicorn app.main:app --reload --port 8000
```

- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)

### 🧠 ML Prediction Engine (`services/ml-engine`)

Executes multi-modal data fusion across IMD precipitation, Sentinel-1 SAR deformation, Sentinel-2 NDVI, and terrain slope angles.

```bash
cd services/ml-engine

# Create & activate virtual environment
python -m venv .venv
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run pipeline check
python app/main.py
```

---

## Root Workspace Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev:web` | Start Next.js web application dev server |
| `pnpm build:web` | Build Next.js web application for production |
| `pnpm build` | Build all shared packages and web application |
| `pnpm type-check`| Run TypeScript compiler type checking across all workspace packages |
| `pnpm lint` | Run linter across workspace packages |

---

## Docker Orchestration

Run backend and web frontend services via Docker Compose:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```
