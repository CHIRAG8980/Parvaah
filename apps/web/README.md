# Parvaah Web Command Center

**Technology:** Next.js 14.2 (App Router) • React 18 • TypeScript • Tailwind CSS • Leaflet GIS  
**Port:** `3000` (Default)  
**Role:** Authority Control-Room Command Center for Disaster Management Officers (DMO), State Disaster Management Authorities (SDMA), and Emergency Personnel.

---

## 1. Route Directory & Functional Modules (`src/app/`)

| Route | View Name | Key Capabilities |
|---|---|---|
| **`/`** | **Command Center Overview** | Real-time KPI summary counters, interactive Leaflet hazard heatmap, active incident feed, road infrastructure chart, and weather radar. |
| **`/risk-map`** | **Spatial Risk Map** | Fullscreen GIS map with district filters across NER states, contour layers, and GSI historical landslide ground-truth markers. |
| **`/forecast`** | **Precipitation Radar** | 14-day rainfall timeline (7 observed days + 7 projected days) paired with dynamic geotechnical slope risk scores. |
| **`/roads`** | **Highway Corridors** | Highway network tracking (NH-106, NH-6, NH-102), chokepoints, safe alternate bypass routes, and clearance status. |
| **`/alerts`** | **Early Warning Review Queue** | Human-in-the-loop review board with live countdown timers, DMO approve/reject modals, and auto-escalation tracking. |
| **`/reports`** | **Situational Reports** | Printable emergency situation reports, PDF bulletin exports, and transparent audit event logs. |
| **`/data-sources`** | **Telemetry Health** | Status indicators for IMD AWS rain gauges, InSAR sync, tiltmeters/inclinometers, and seismographs. |
| **`/users`** | **Authority Directory** | Authorized emergency personnel registry with modal-driven RBAC credential provisioning. |
| **`/settings`** | **Protocol & Thresholds** | Runtime configuration for rainfall trigger thresholds, InSAR velocity limits, and broadcast channels. |
| **`/login`** | **Authentication Portal** | Secure JWT authentication with role-switching tabs (DMO East Khasi, SDMA Meghalaya, Admin NER). |

---

## 2. Component Architecture (`src/components/`)

* **Map Engine (`src/components/map/`)**:
  * `LiveRiskMap.tsx`: Dynamic Leaflet map container with auto-centering and layer toggling.
  * `HeatmapCanvasLayer.ts`: High-performance custom HTML5 canvas layer rendering Gaussian kernel density surfaces directly on the client GPU.
  * `mapTileManager.ts` & `mapLayers.ts`: Tile server configuration and spatial vector bounds.
* **Dashboard Widgets (`src/components/dashboard/`)**:
  * `HeaderSection.tsx`: Dynamic status bar displaying real-time data freshness badges (🟢 Live / 🟡 Near-Real-Time / 🔴 Stale) queried from `/analytics/freshness`.
  * `KpiSummaryCards.tsx`: Incident counters and threat metrics.
  * `WeatherForecast.tsx`, `RecentAlerts.tsx`, `DistrictRiskChart.tsx`.
* **Layout & Shell (`src/components/layout/`)**:
  * `DashboardShell.tsx`, `Sidebar.tsx`, `TopHeader.tsx`, `HeaderWeather.tsx`.
* **Authentication Guard (`src/components/auth/AuthGuard.tsx`)**:
  * Protects control-room routes against unauthorized access, validating JWT session tokens and redirecting to `/login`.

---

## 3. Data Ingestion & State Layer (`src/hooks/` & `src/lib/api/`)

* **API Client (`src/lib/api/client.ts`)**:
  * Axios instance preconfigured with base URL (`process.env.NEXT_PUBLIC_API_URL` or `http://localhost:8000/api/v1`), automatic Bearer token injection, and structured error normalization (`errors.ts`).
* **Custom React Hooks (`src/hooks/`)**:
  * `useFreshness`: Polls `/analytics/freshness` every 60 seconds to track prediction age.
  * `useAlerts`: Queries active review queue and executes approve/reject mutations.
  * `useZones`, `useRoads`, `useWeather`, `useKpis`: Type-safe queries bound to FastAPI endpoints.

---

## 4. Environment Variables

Create or verify `.env` in the monorepo root or `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Parvaah Landslide Risk Monitor"
```

---

## 5. Development & Build Commands

Run from the monorepo root:

```bash
# Start Next.js development server
npm run dev:web

# Production build
npm run build:web

# Run production server
npm run start --workspace=@landslide/web

# Type-check TypeScript
npm run type-check --workspace=@landslide/web

# Linting
npm run lint --workspace=@landslide/web
```
