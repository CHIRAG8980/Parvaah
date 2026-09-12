# Database & Data Schema
## AI-Based Early Warning and Landslide Risk Monitoring System (NER) — Final Version

---

## 1. Core Spatial Tables (PostgreSQL + PostGIS)

### `zones`
Fixed grid unit (~25 sq km, subdivided by slope) — the spatial join key for all other datasets.

| Column | Type | Description |
|---|---|---|
| zone_id | UUID (PK) | Unique zone identifier |
| geometry | GEOMETRY(POLYGON, 4326) | Zone boundary |
| district | VARCHAR | District name |
| state | VARCHAR | State name (NER states) |
| avg_slope_deg | FLOAT | Average slope angle |
| avg_elevation_m | FLOAT | Average elevation |
| created_at | TIMESTAMP | Record creation time |

### `risk_scores`
Time-versioned risk output per zone (append-only, never overwritten — required for audit trail).

| Column | Type | Description |
|---|---|---|
| risk_score_id | UUID (PK) | Unique record ID |
| zone_id | UUID (FK → zones) | Associated zone |
| computed_at | TIMESTAMP | When this score was generated |
| risk_level | ENUM(low, medium, high, critical) | Categorical risk |
| risk_score_numeric | FLOAT (0–100) | Continuous risk score |
| time_to_failure_min_days | INT | Lower bound of failure window estimate |
| time_to_failure_max_days | INT | Upper bound of failure window estimate |
| confidence_score | FLOAT (0–1) | Model confidence in this prediction |
| model_version | VARCHAR | MLflow model version tag |
| explainability_json | JSONB | SHAP factor breakdown (rainfall, deformation, NDVI contributions) |

### `roads`
| Column | Type | Description |
|---|---|---|
| road_id | UUID (PK) | Unique road segment ID |
| geometry | GEOMETRY(LINESTRING, 4326) | Road path |
| road_class | ENUM(national_highway, state_highway, village_road) | Classification |
| zone_id | UUID (FK → zones) | Zone the segment passes through |
| status | ENUM(open, at_risk, blocked) | Current connectivity status |
| status_updated_at | TIMESTAMP | Last status update time |
| is_single_access | BOOLEAN | Flags chokepoint roads to isolated villages |

### `villages_infrastructure`
| Column | Type | Description |
|---|---|---|
| location_id | UUID (PK) | Unique ID |
| geometry | GEOMETRY(POINT, 4326) | Coordinates |
| zone_id | UUID (FK → zones) | Associated zone |
| type | ENUM(village, school, hospital, government_building) | Infrastructure type |
| name | VARCHAR | Name |
| population_estimate | INT (nullable) | For villages only |

---

## 2. Time-Series Tables (TimescaleDB)

### `rainfall_readings`
| Column | Type | Description |
|---|---|---|
| reading_id | UUID (PK) | Unique record ID |
| source_type | ENUM(imd, community_gauge) | Data origin |
| source_id | VARCHAR | Station/gauge ID |
| zone_id | UUID (FK → zones) | Associated zone |
| timestamp | TIMESTAMPTZ | Reading time |
| rainfall_mm | FLOAT | Rainfall amount |
| cumulative_1hr_mm | FLOAT | 1-hour cumulative |
| cumulative_24hr_mm | FLOAT | 24-hour cumulative |
| cumulative_72hr_mm | FLOAT | 72-hour cumulative |
| is_forecast | BOOLEAN | True if forecasted, false if observed |
| confidence_flag | ENUM(high, medium, low) | Data quality flag |

### `deformation_readings` (InSAR)
| Column | Type | Description |
|---|---|---|
| reading_id | UUID (PK) | Unique record ID |
| zone_id | UUID (FK → zones) | Associated zone |
| acquisition_date | DATE | Satellite pass date |
| displacement_mm | FLOAT | Line-of-sight displacement |
| displacement_direction | VARCHAR | LOS direction |
| coherence_score | FLOAT (0–1) | Signal reliability (low = vegetation/decorrelation risk) |
| revisit_cycle_days | INT | Days since prior valid reading |
| validated_by_gnss | BOOLEAN | True if cross-checked against ground GNSS sensor |

### `ndvi_readings`
| Column | Type | Description |
|---|---|---|
| reading_id | UUID (PK) | Unique record ID |
| zone_id | UUID (FK → zones) | Associated zone |
| acquisition_date | DATE | Satellite pass date |
| ndvi_value | FLOAT | Raw NDVI |
| ndvi_anomaly | FLOAT | Deviation from seasonal baseline |
| cloud_cover_pct | FLOAT | Cloud cover percentage |
| usable | BOOLEAN | False if cloud cover exceeds usability threshold |

### `gnss_readings` (targeted ground-truth sensors)
| Column | Type | Description |
|---|---|---|
| reading_id | UUID (PK) | Unique record ID |
| sensor_id | VARCHAR | Physical GNSS unit ID |
| zone_id | UUID (FK → zones) | Associated zone |
| timestamp | TIMESTAMPTZ | Reading time |
| displacement_mm | FLOAT | Measured displacement |
| priority_site | BOOLEAN | Always true — only deployed at highest-risk slopes |

---

## 3. Historical & Reference Data

### `landslide_events` (NRSC/GSI inventory)
| Column | Type | Description |
|---|---|---|
| event_id | UUID (PK) | Unique event ID |
| zone_id | UUID (FK → zones) | Associated zone |
| event_date | DATE | Date of occurrence |
| geometry | GEOMETRY(POINT/POLYGON, 4326) | Location/extent |
| landslide_type | ENUM(debris_flow, rockfall, slump, other) | Classification |
| trigger_cause | ENUM(rainfall, human_hill_cutting, seismic, unknown) | Cause |
| casualties | INT | Reported casualties |
| infrastructure_damage_desc | TEXT | Free-text damage description |
| source_reliability | ENUM(gsi_verified, media_reported) | Source confidence |

### `terrain_features` (DEM-derived, static reference)
| Column | Type | Description |
|---|---|---|
| zone_id | UUID (PK, FK → zones) | Associated zone |
| slope_deg | FLOAT | Slope angle |
| aspect_deg | FLOAT | Slope direction |
| curvature_type | ENUM(convex, concave, planar) | Water flow concentration indicator |
| land_use | ENUM(forest, cultivated, built_up, bare_soil, quarry) | Land cover |
| lithology | VARCHAR (nullable) | Rock/geology type |
| soil_thickness_m | FLOAT (nullable) | Depth to bedrock, where available (known data gap) |

---

## 4. Application Tables

### `alerts`
| Column | Type | Description |
|---|---|---|
| alert_id | UUID (PK) | Unique alert ID |
| zone_id | UUID (FK → zones) | Associated zone |
| risk_score_id | UUID (FK → risk_scores) | Triggering risk record |
| severity | ENUM(advisory, high, critical) | Alert level |
| draft_message | TEXT | System-generated message |
| final_message | TEXT (nullable) | Officer-edited message, if changed |
| status | ENUM(pending_review, approved, rejected, auto_escalated, dispatched) | Workflow state |
| created_at | TIMESTAMPTZ | Draft creation time |
| reviewed_by | UUID (FK → users, nullable) | Disaster Management Officer who reviewed |
| reviewed_at | TIMESTAMPTZ (nullable) | Review timestamp |
| escalation_deadline | TIMESTAMPTZ | Auto-escalation trigger time |
| escalated_to | UUID (FK → users, nullable) | Next authority level if escalated |
| dispatched_at | TIMESTAMPTZ (nullable) | Actual dispatch time |
| channels_used | JSONB | Array of channels (sms, ivr, push, cap_sachet, radio, siren) |

### `users`
| Column | Type | Description |
|---|---|---|
| user_id | UUID (PK) | Unique user ID |
| role | ENUM(disaster_management_officer, mobile_user) | Role: Disaster Management Officer (web) or User (mobile app) |
| district | VARCHAR (nullable) | Assigned district |
| escalation_level | INT (nullable) | Position in escalation chain |
| contact_number | VARCHAR (nullable) | For IVR/SMS notification of pending reviews / alerts |

### `community_gauges`
| Column | Type | Description |
|---|---|---|
| gauge_id | UUID (PK) | Unique gauge ID |
| zone_id | UUID (FK → zones) | Associated zone |
| geometry | GEOMETRY(POINT, 4326) | Exact location |
| maintainer_org | VARCHAR | NGO/panchayat name |
| maintainer_contact | VARCHAR | Volunteer contact |
| last_calibration_date | DATE | Calibration/maintenance log |
| status | ENUM(active, inactive, needs_maintenance) | Operational status |

### `audit_log`
| Column | Type | Description |
|---|---|---|
| log_id | UUID (PK) | Unique log entry |
| entity_type | ENUM(risk_score, alert, model) | What was logged |
| entity_id | UUID | Reference to the entity |
| action | VARCHAR | e.g., "prediction_generated", "alert_approved", "alert_escalated" |
| actor | VARCHAR | System or user_id |
| timestamp | TIMESTAMPTZ | Action time |
| data_snapshot_ref | VARCHAR | Pointer to the exact data/model version used |

---

## 5. Cross-Cutting Schema Rules

- Every table with sensor-derived data includes a **confidence/quality flag** column — no silent use of low-confidence data.
- `zone_id` is the universal foreign key joining rainfall, deformation, NDVI, terrain, historical, and road datasets.
- `risk_scores` and `alerts` are **append-only** — never updated in place — to preserve a full audit trail.
- All timestamps use `TIMESTAMPTZ` (timezone-aware) to avoid ambiguity across NER states.
- `model_version` and `data_snapshot_ref` fields are mandatory on every prediction/alert record for full reproducibility.
