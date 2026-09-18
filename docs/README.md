# Parvaah Documentation Directory

Welcome to the central documentation repository for **Parvaah (परवाह)** — an enterprise-grade, AI-powered landslide risk monitoring and early warning system tailored for the North Eastern Region (NER) of India.

All technical documentation, specifications, data manifests, and compliance audits are organized within this directory.

---

## 📚 Master Table of Contents

### 1. 🏛️ Architecture & Infrastructure ([`architecture/`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/architecture/))

* **[System Architecture Overview](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/architecture/overview.md)**:
  Detailed 3-tier architecture: FastAPI backend core, 4-model sovereign ML suite, SQLite/PostGIS persistence, Next.js 14 Web Command Center, Flutter 3.x mobile client, and continuous 30-minute background scheduler.
* **[Production Technology Stack](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/architecture/tech_stack.md)**:
  Active production frameworks, tools, versions, and npm workspace monorepo structure.
* **[Database & GIS Schema](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/architecture/schema.md)**:
  Relational and geospatial table definitions, SQLAlchemy ORM models, and PostGIS geometries (`Zone`, `TerrainFeature`, `RainfallReading`, `RiskScore`, `RoadSegment`, `Alert`, `User`, `AuditLog`).
* **[Real-Time Pipeline Implementation](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/architecture/realtime_pipeline.md)**:
  End-to-end data flow, continuous async scheduler mechanics, latency classifications, and critical runtime bug fixes.

---

### 2. 📋 Product Specifications ([`specifications/`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/specifications/))

* **[Product Requirements Document (PRD)](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/specifications/prd.md)**:
  Official PRD for SIH Problem Statement 26001 (MDoNER), defining objectives, user personas, functional criteria, and success metrics.
* **[Web Command Center Feature Spec](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/specifications/web_features.md)**:
  Control-room feature specification for Disaster Management Officers (DMOs) and emergency coordinators.
* **[Mobile Client Feature Spec](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/specifications/mobile_features.md)**:
  Field officer situational awareness specification, offline-first viewing, and zero-reporting security principles.
* **[AI/ML Engine Feature Spec](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/specifications/ai_features.md)**:
  Machine learning problem formulation, physical triggers, and confidence scoring tiers.

---

### 3. 🛰️ Datasets & Models ([`data_and_models/`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/data_and_models/))

* **[Datasets & Models Reference](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/data_and_models/datasets_and_models.md)**:
  Exhaustive documentation of raw datasets, processed feature bands, and model training methodologies.
* **[Dataset Inventory](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/data_and_models/dataset_inventory.md)**:
  Complete provenance and storage location catalog for all satellite, meteorological, and topographic assets.
* **[ML Migration Summary](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/data_and_models/ml_migration_summary.md)**:
  Historical record of ML model and tensor migration into the centralized monorepo structure.
* **[Datasets Reference Document (PDF)](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/data_and_models/Datasets.pdf)**:
  Original institutional data reference file.

---

### 4. 🇮🇳 Sovereign Compliance & Audits ([`compliance/`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/compliance/))

* **[Strict Indian Primary Data Source Audit](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/compliance/indian_source_audit.md)**:
  Compliance audit manifest detailing the purging of foreign dependencies (Open-Meteo, OSM, Sentinel-1/2, USGS) and verification of sovereign Indian institutional feeds (ISRO CartoDEM, Bhuvan, IMD, GSI Bhukosh, Bhoonidhi EOS-04).
* **[Final System Validation Report](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/compliance/system_validation.md)**:
  End-to-end operational verification across models, API endpoints, telemetry synchronization, and database integrity.
* **[Comprehensive Architectural Review](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/docs/compliance/architectural_review.md)**:
  In-depth audit covering data lifecycles, ML statistical defensibility gates, backend services, and multi-channel alerting.

---

### 5. 💻 Subsystem Technical References

For component-specific development guides, refer to their dedicated application documentation:
* **[Backend Service Reference](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/backend/README.md)**: FastAPI routes, RBAC credentials, and environment configuration.
* **[Web Command Center Reference](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/web/README.md)**: Next.js 14 App Router modules, Leaflet GPU canvas heatmap layer, and custom React hooks.
* **[Field Mobile Client Reference](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/mobile/README.md)**: Flutter 3.x offline-first caching, SQLite sync, and multilingual CAP bulletins.
* **[ML Core & Inference Pipeline](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/ml-engine/README.md)**: 4-model ensemble architecture, 19-feature input vector, and Python inference serving API.
