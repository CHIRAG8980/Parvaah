# Web Dashboard — Feature Specification
## AI-Based Early Warning and Landslide Risk Monitoring System (NER)

**Audience:** Web development team
**Platform:** React + Next.js
**Role of this app:** Control-room tool for Disaster Management Officers (web). This is where AI predictions are monitored, alerts are reviewed and approved, and the system is governed and audited. Not intended for mobile app users.

---

## 1. Product Scope

### In scope
- Live GIS risk heatmap and map layers
- Alert review and approval workflow (human-in-the-loop)
- Road connectivity and infrastructure overlays
- Role-based access control
- Audit logging and analytics
- Escalation tracking for unactioned alerts

### Explicitly out of scope (v1)
- Mobile app user features (this is an internal control-room tool for Disaster Management Officers only)
- Automated alert dispatch without officer approval
- Real-time machine translation of alert content

---

## 2. Core Features

### 2.1 Live GIS Risk Dashboard
- Interactive map (Mapbox GL / Leaflet) showing risk heatmap by zone (~25 sq km grid cells, subdivided by slope).
- Color-coded risk levels: low (green), medium (yellow), high (orange), critical (red).
- Time slider control: view past risk trend (last 7/30 days) and forecast (next 3–7 days).
- Click a zone to open a detail panel showing:
  - Current risk score and time-to-failure window
  - Contributing factors (explainability): slope angle, rainfall total, deformation trend, NDVI anomaly, data confidence flags
  - Historical landslide events in that zone
- Filter/search by state, district, or zone ID.

### 2.2 Road Connectivity & Infrastructure Layer
- Toggle-able map layer showing roads: open (green), at-risk (amber), blocked (red).
- Infrastructure overlay: villages, schools, hospitals, government buildings.
- Click a road segment for status, last-updated time, and reason (if available).
- Highlight single-access-road villages (chokepoints) as a priority visual flag.

### 2.3 Weather-Linked Forecast Panel
- Chart comparing rainfall trend vs. AI risk trend per zone/district.
- Toggle between IMD rainfall data and community rain-gauge data (where available) to compare hyperlocal vs. regional rainfall signals.
- Data confidence indicator per data source shown alongside chart.

### 2.4 Alert Review & Approval Queue (Critical Feature)
- Central queue listing all AI-drafted alerts with status: Pending Review / Approved / Rejected / Escalated.
- Each queue item shows:
  - Zone(s) affected, risk level, time-to-failure estimate
  - Auto-generated reasoning summary (explainable factors)
  - Suggested action (evacuation advisory, road closure notice, team pre-positioning)
  - Suggested dispatch channels (SMS, IVR, app push) and affected village/road list
- Disaster Management Officer actions:
  - **Edit** message text (within pre-approved template constraints for multilingual consistency)
  - **Select/deselect** affected villages, roads, or channels
  - **Approve** → triggers dispatch pipeline
  - **Reject** → requires a reason code (false positive, insufficient data, already handled, etc.) logged for model feedback
- **Escalation SOP (must-have):**
  - If a Critical-risk alert remains "Pending Review" beyond a configurable timeout (default 30–60 min), auto-escalate to the next authority level (District Collector → State Disaster Authority → NDMA/Sachet).
  - Escalated alerts are visually flagged (red banner + timestamp of original alert time) and logged with the delay duration for accountability.
  - Notify the next-level authority automatically (email/SMS/dashboard notification) when escalation triggers.

### 2.5 User Access & Authentication
- User: Disaster Management Officer (web).
- Auth via Keycloak (OAuth2).
- Key Capabilities:
  - Monitor real-time GIS landslide risk heatmap, weather-linked forecasts, and road connectivity
  - Review, edit, approve, or reject AI-drafted alerts within assigned zones/districts before dispatch
  - Track alert escalations, audit logs, and model performance analytics

### 2.6 Audit Log & Traceability
- Every prediction, alert, approval, rejection, and escalation logged with:
  - Timestamp, user ID, action taken, data snapshot version, model version used
- Searchable/filterable audit log view (by date range, zone, user, action type).
- Exportable audit reports (CSV/PDF) for post-event review and institutional accountability.

### 2.7 Analytics & Model Performance
- Dashboard section showing:
  - Event timeline (predicted vs. actual landslide events)
  - False-alarm rate and missed-event rate per district
  - Alert response time distribution (time from alert generation to officer approval)
  - Model version performance comparison over time
- Used by the AI/ML team and state authorities to identify where thresholds need recalibration.

### 2.8 Data Source Confidence Monitor
- Panel showing health/freshness of each ingestion source (IMD API, Sentinel-1, Sentinel-2, community rain gauges, NRSC/GSI feed).
- Flag stale or failed data pulls (e.g., "Sentinel-1 pass overdue — last update 9 days ago") so officers know when AI confidence may be degraded.

---

## 3. Non-Functional Requirements

- **Availability:** Dashboard and alert-dispatch path must remain available during high-load monsoon events (target uptime: 99.9% during active monsoon season).
- **Performance:** Map tile rendering and risk queries should return within 2 seconds for standard district-level views.
- **Security:** All access via OAuth2/Keycloak; sensitive actions (approve/reject/escalate) require re-authentication or session validation.
- **Data residency:** Hosted on Indian government-compliant cloud (MeghRaj/NIC).
- **Auditability:** No action should be possible without a corresponding audit log entry — this is a compliance requirement, not optional.

---

## 4. Data Flow (Dashboard Perspective)

```
Backend API (FastAPI/NestJS)
        |
   PostGIS + GeoServer (spatial layers) ---- TimescaleDB (time-series)
        |
   Web Dashboard (React/Next.js)
        |
   ------------------------------------------
   |                    |                   |
Risk Map View     Alert Review Queue    Analytics View
        |
   Alert Dispatch Trigger (on approval) --> SMS/IVR/App Push/CAP-Sachet
```

---

## 5. API Endpoints Needed From Backend

| Endpoint | Purpose |
|---|---|
| `GET /zones?district=` | List zones with current risk scores |
| `GET /zones/{zone_id}/detail` | Full risk breakdown + explainability factors |
| `GET /alerts/queue` | Pending/escalated alerts for review |
| `POST /alerts/{alert_id}/approve` | Approve and trigger dispatch |
| `POST /alerts/{alert_id}/reject` | Reject with reason code |
| `GET /roads?district=` | Road status list |
| `GET /audit-log` | Filterable audit trail |
| `GET /analytics/performance` | Model performance metrics |
| `GET /datasources/health` | Ingestion source freshness/status |

---

## 6. Suggested Tech Stack

- **Frontend:** React + Next.js, TypeScript
- **Mapping:** Mapbox GL JS or Leaflet with GeoServer WMS/WFS layers
- **State management:** React Query (for server state) + Zustand/Redux (for UI state)
- **Auth:** Keycloak (OAuth2/OIDC)
- **Charts:** Recharts or D3.js for forecast/analytics panels

---

## 7. Open Items for Dev Team to Confirm

- Exact escalation timeout duration per risk level (default proposed: 30 min for Critical, 60 min for High) — needs sign-off from disaster management stakeholders.
- Escalation hierarchy and override workflows for Disaster Management Officers on critical alerts.
- Confirm CAP/Sachet API integration contract (payload format, auth mechanism) with NDMA/C-DOT team before building the dispatch trigger.
