# ML Engine Migration Summary

## Migration Date
2026-09-12

## Overview
Successfully migrated the 3-tier Landslide Early Warning System (LEWS) from MyTask to Parvaah monorepo.

## Migrated Assets

### Source Code (Production ML Models)
- **Model 1: Dynamic Hazard LEWS** (`apps/ml-engine/models/dynamic_hazard/`)
  - `dynamic_hazard.py` - CLI for training, evaluation, and inference
  - `src/model.py` - Bidirectional LSTM temporal sequence architecture
  - `src/features.py` - Rolling window and antecedent rainfall feature engineering
  - `src/sequence_builder.py` - 14-day temporal sequence generation
  - `src/validation.py` - Data quality and temporal bounds validator

- **Model 2: Fusion & Risk Mapping** (`apps/ml-engine/models/fusion_risk/`)
  - `fusion_risk.py` - Complete multi-source spatial fusion pipeline
  - `src/feature_builder.py` - 30m raster stack extraction with spatial block partitioning
  - `src/spatial_export.py` - Full-grid GeoTIFF raster generator
  - `src/explain.py` - SHAP TreeExplainer factor attributions

- **Model 3: Time-to-Failure Research** (`apps/ml-engine/models/time_to_failure/`)
  - `time_to_failure.py` - Feasibility orchestrator and survival analysis
  - `src/validation.py` - Defensibility gates preventing premature regression on sparse temporal data

### Model Artifacts & Outputs
- `data/processed/outputs/static_susceptibility_map_30m.tif` - Baseline susceptibility raster
- `data/processed/outputs/dynamic_hazard_alert_DOY235.tif` - Dynamic hazard alert raster
- `data/processed/outputs/active_alerts.json` - Active warnings JSON for dashboard/mobile
- `data/processed/models/master_tensor/` - 30m multi-band tensor dataset & manifest
- `data/processed/features/individual_bands/` - 21 GeoTIFF 30m spatial feature layers

### Directory Structure

```
Parvaah/
├── apps/
│   ├── web/                    # Disaster Authority Next.js Web Dashboard
│   ├── mobile/                 # Field Officer Flutter Mobile App
│   └── ml-engine/              # Machine Learning Training & Pipelines
│       ├── data/
│       │   ├── raw/            # Satellite, DEM, meteorological, ground truth
│       │   └── processed/      # 30m GeoTIFF bands, daily features, outputs
│       └── models/
│           ├── dynamic_hazard/ # LSTM dynamic hazard early warning model
│           ├── fusion_risk/    # Spatial raster fusion & risk map pipeline
│           └── time_to_failure/# TTF defensibility & survival pipeline
├── services/
│   ├── api/                    # FastAPI REST API Backend
│   └── ml-engine/              # Inference service wrapper
├── packages/                   # Shared TypeScript packages (@landslide/*)
├── docs/                       # Architecture, datasets, and PRD specifications
└── requirements.txt            # Consolidated Python dependencies
```

## Status

✅ All critical production assets migrated
✅ Source code paths verified (no hardcoded dependencies)
✅ Test suites accessible in new location
✅ Model artifacts ready for inference
✅ Monorepo structure standardized

## Notes

- MyTask directory has been safely removed
- All relative imports in Python code preserved
- Raw satellite imagery data (Sentinel-1/2) remains available
- Feature engineering pipeline intact and reproducible
