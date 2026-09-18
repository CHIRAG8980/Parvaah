# Parvaah — Relational & Geospatial Database Schema

**Status:** Verified Production Schema  
**Database Engine:** SQLite (Local Dev) / PostgreSQL 15+ with PostGIS  
**ORM Framework:** SQLAlchemy 2.0+ (with declarative models)

---

## 1. Monitored Terrain & Geospatial Models

### `zones`
Represents administrative risk zones across North Eastern Region districts.
* Primary Model: [`apps/backend/app/models/zone.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/models/zone.py)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `zone_id` | String | PK | Unique zone identifier (e.g., `ZONE-EKH-001`) |
| `name` | String | Not Null | Human-readable name (e.g., *Mawkdok Valley Corridor*) |
| `district` | String | Index | District (e.g., *East Khasi Hills*) |
| `state` | String | Index | State (e.g., *Meghalaya*) |
| `latitude` | Float | Not Null | Centroid latitude coordinate |
| `longitude` | Float | Not Null | Centroid longitude coordinate |
| `boundary_coordinates` | Text (JSON) | Nullable | GeoJSON polygon coordinates |
| `avg_slope_deg` | Float | Default 0.0 | Mean slope angle in degrees |
| `soil_type` | String | Nullable | Regional soil classification |
| `geology_type` | String | Nullable | Underlying geological formation |
| `area_sqkm` | Float | Default 1.0 | Monitored surface area in sq km |
| `population_density` | Float | Default 0.0 | Persons per square kilometer |
| `land_cover_type` | String | Nullable | LULC description |
| `updated_at` | DateTime | Auto-update | Timestamp of last modification |

### `terrain_features`
Detailed geotechnical and ML raster sample points extracted from 30m CartoDEM and Bhuvan GeoTIFFs.

| Column | Type | Description |
|---|---|---|
| `feature_id` | String | Primary key (`tf-{zone_id}`) |
| `zone_id` | String | Foreign Key → `zones.zone_id` |
| `aspect` / `curvature` / `elevation` / `slope_angle` | Float | Standard CartoDEM topographic properties |
| `ml_elevation` / `ml_slope` / `ml_aspect` / `ml_curvature` | Float | Sampled 30m raster values fed into ML pipeline |
| `ml_distance_to_road` / `ml_distance_to_settlements` | Float | Proximity measurements (meters) |
| `ml_bhuvan_geomorphology` / `ml_bhuvan_lulc` | Float | Bhuvan 1:50k thematic indices |
| `ml_static_susceptibility` | Float | Precomputed GSI/ISRO composite susceptibility |

---

## 2. Meteorological Telemetry Models

### `rainfall_readings`
Time-series precipitation records sourced from IMD AWS stations and verified rain gauges.
* Primary Model: [`apps/backend/app/models/weather.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/models/weather.py)

| Column | Type | Description |
|---|---|---|
| `reading_id` | String | Primary key (e.g., `rf-imd-{zone_id}-{timestamp}`) |
| `zone_id` | String | Foreign Key → `zones.zone_id` |
| `timestamp` | DateTime | Time of observation (UTC) |
| `rainfall_mm` | Float | Incremental rainfall for reporting interval |
| `cumulative_1hr_mm` / `cumulative_3hr_mm` | Float | Short-term storm surge accumulations |
| `cumulative_24hr_mm` / `cumulative_72hr_mm` | Float | Multi-day saturation triggers for slope stability |
| `source_type` | String | Origin identifier (`imd_gridded`, `imd_aws`, `community_gauge`) |
| `source_id` | String | Station ID or network source tag |
| `confidence_flag` | String | Quality classification (`HIGH`, `MEDIUM`, `LOW`) |

### `community_gauges`
Tracks field automated rain gauges and community-operated stations.

| Column | Type | Description |
|---|---|---|
| `gauge_id` | String | Primary key |
| `zone_id` | String | Foreign Key → `zones.zone_id` |
| `gauge_name` | String | Name of station (e.g., *Cherrapunji AWS 01*) |
| `latitude` / `longitude` | Float | Exact geographic position |
| `status` | String | Station operational health (`active`, `offline`, `calibrating`) |
| `last_reading_time` | DateTime | Timestamp of latest transmission |
| `last_reading_mm` | Float | Rainfall recorded in latest transmission |

---

## 3. Hazard Assessment & Early Warning Models

### `risk_scores`
Append-only time-versioned risk evaluation records computed by the 4-model ensemble.
* Primary Model: [`apps/backend/app/models/risk.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/models/risk.py)

| Column | Type | Description |
|---|---|---|
| `risk_score_id` | String | Primary key (`rs-imd-{zone_id}-{timestamp}`) |
| `zone_id` | String | Foreign Key → `zones.zone_id` |
| `computed_at` | DateTime | Timestamp of prediction generation |
| `risk_level` | String | Categorical risk: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `risk_score_numeric` | Float | Calibrated continuous score ($0.0–100.0$) |
| `time_to_failure_min_days` / `max_days` | Integer | Estimated lead window (e.g., $1–3\text{ days}$) |
| `confidence_score` | Float | Model confidence ($0.0–1.0$) |
| `model_version` | String | Model tag (e.g., `v2.0.0-parvaah-sovereign-indian`) |
| `explainability_json` | Text (JSON) | Contributing SHAP factor weights |

### `alerts`
Human-in-the-loop early warning review queue with auto-escalation tracking.
* Primary Model: [`apps/backend/app/models/alert.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/models/alert.py)

| Column | Type | Description |
|---|---|---|
| `alert_id` | String | Primary key (`ALT-IMD-{zone}-{timestamp}`) |
| `zone_id` | String | Foreign Key → `zones.zone_id` |
| `risk_score_id` | String | Foreign Key → `risk_scores.risk_score_id` |
| `title` | String | Public advisory heading |
| `severity` | String | Severity rating: `Low`, `Medium`, `High`, `Critical` |
| `status` | String | Status: `pending_review`, `approved`, `rejected`, `auto_escalated` |
| `draft_message` | Text | Initial AI-generated advisory draft |
| `final_message` | Text | Officer-edited text for broadcast |
| `channels_used` | String (JSON) | Dispatched channels (`["app_push"]`, `["cap_xml"]`) |
| `reviewed_by` | String | Officer ID who reviewed the alert |
| `escalation_deadline` | DateTime | Countdown timer target before auto-escalation |
| `escalated_to` | String | Higher tier alerted if deadline missed (`SDMA_COMMAND`) |
| `rejection_reason` | String | Reason code if rejected by officer |
| `created_at` | DateTime | Time alert was placed into queue |

---

## 4. Road Infrastructure Models

### `road_segments`
National and state highway network corridors.
* Primary Model: [`apps/backend/app/models/road.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/models/road.py)

| Column | Type | Description |
|---|---|---|
| `road_id` | String | Primary key (`ROAD-NH106-01`) |
| `name` | String | Gazetted name (e.g., *NH-106 Shillong–Nongstoin*) |
| `road_type` | String | Classification (`national_highway`, `state_highway`, `arterial`) |
| `length_km` | Float | Segment length in kilometers |
| `start_lat` / `start_lon` / `end_lat` / `end_lon` | Float | Terminal coordinates of segment |
| `status` | String | Operational condition: `open`, `at_risk`, `blocked` |
| `is_critical_artery` | Boolean | True for vital lifeline corridors |
| `single_access_corridor`| Boolean | True if failure isolates downhill communities |
| `zone_id` | String | Foreign Key → `zones.zone_id` |

---

## 5. Security, System & Audit Models

### `users` & `refresh_tokens`
Role-Based Access Control credentials for disaster response personnel.
* Primary Model: [`apps/backend/app/models/user.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/app/models/user.py)
* Supported Roles: `DMO` (District Officer), `SDMA` (State Authority), `SYSADMIN` (Platform Administrator).

### `system_settings`
Configurable operational parameters (rainfall thresholds, InSAR velocity triggers, polling intervals).

### `audit_logs`
Immutable compliance ledger recording all critical actions (`alert_approved`, `alert_rejected`, `threshold_modified`) with actor identities, timestamps, and details JSON.
