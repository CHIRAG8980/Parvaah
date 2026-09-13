# Time-to-Failure (TTF) Model - Research Pipeline

## Overview

This is a **research-grade pipeline** for Time-to-Failure modeling that **honestly assesses whether the available data supports defensible predictions**. It does not force models on insufficient data.

## Current Data Status

**Available temporal data:**
- **15 events** with exact dates (May 27-30, 2024)
- **4 unique dates** spanning **4 days**
- **952 events** with no temporal information (GSI inventory)
- **Additional year-only events** from ISRO/NRSC atlas

**Conclusion:** Current exact-date data is **insufficient** for defensible TTF regression modeling.

## Pipeline Architecture

```
src/
├── config.py              # Configuration and paths
├── data_loader.py         # Load exact-date and year-only events
├── target_definition.py   # TTF target construction with date validation
├── validation.py          # Statistical defensibility checks
├── preprocessing.py       # Temporal-aware preprocessing
├── feature_builder.py     # Feature engineering
├── baseline.py            # Baseline models
├── model.py               # ML models (XGBoost, RF, GBM)
├── evaluate.py            # Metrics and visualization
├── predict.py             # Prediction interface
├── survival_analysis.py   # Alternative approach for censored data
├── train.py               # Main training orchestrator
└── utils.py               # Logging, reporting, utilities
```

## Requirements

### Minimum Data Requirements for Defensible TTF Model

- **Events:** ≥50 with exact dates
- **Temporal span:** ≥30 days
- **Unique dates:** ≥10
- **Validation:** Chronological train/test split (no temporal leakage)

### Current Data Does NOT Meet Requirements

## Installation

```bash
cd apps/ml-engine/models/time_to_failure
pip install -r requirements.txt
```

## Usage

### Run Complete Validation Pipeline

```bash
python time_to_failure.py
```

This will:
1. Load all available landslide data
2. Assess temporal coverage
3. Run validation checks
4. Determine if model training is defensible
5. Generate feasibility report

**Expected output:** Feasibility report explaining why TTF modeling is not currently defensible.

### Run Tests

```bash
pytest tests/ -v
```

### Validate Structure Only (No Dependencies)

```bash
python validate_structure.py
```

## Output Structure

```
outputs/
├── predictions/       # Predictions (if model trained)
├── plots/            # Evaluation plots
├── metrics/          # Metrics JSON files
├── diagnostics/      # Temporal assessment, validation reports
└── reports/          # Feasibility report (markdown)

saved_models/         # Trained models (only if defensible)
logs/                 # Execution logs
```

## Key Design Principles

### 1. Never Fabricate Dates
- Year-only events are **NOT** assigned fake dates (Jan 1, June 30, etc.)
- Only exact dates from validated sources are used
- Uncertain temporal information is flagged and documented

### 2. Honest Feasibility Assessment
- Validation checks run **before** training
- Model training only proceeds if checks pass
- Clear rationale provided when training is not defensible

### 3. Temporal Integrity
- Chronological train/test splits only
- No temporal leakage (test events always after train events)
- Features must be available at prediction time (no future information)

### 4. Alternative Approaches
- Survival analysis with interval censoring (for year-only data)
- Binary hazard classification (if TTF regression not feasible)
- Data collection recommendations

## Current Feasibility Assessment

**TTF Regression:** ❌ NOT DEFENSIBLE

**Reasons:**
1. Only 15 exact-date events (need ≥50)
2. Temporal span of 4 days (need ≥30)
3. Only 4 unique dates (need ≥10)
4. Insufficient for train/test split

**Alternatives:**
- Collect more events with exact dates (field surveys, news reports, institutional records)
- Implement survival analysis if year-only data grows to ~50+ events
- Use binary classification (landslide yes/no in next N days) instead of regression

## Extending the Pipeline

### Adding Real Features

Replace mock features in `feature_builder.py`:

```python
def add_rainfall_features(self, df: pd.DataFrame) -> pd.DataFrame:
    # TODO: Join with IMD rainfall data
    # Load rainfall netCDF/CSV
    # Spatial join by coordinates
    # Compute antecedent rainfall (3d, 7d, 14d)
    pass
```

### Adding External Data Sources

Update `config.py` paths to point to:
- IMD rainfall data
- Satellite soil moisture
- DEM-derived terrain features
- Static susceptibility scores

## Related Models

- **Dynamic Hazard Model:** Short-term landslide probability (apps/ml-engine/models/dynamic_hazard/)
- **Fusion/Risk Model:** Combines static + dynamic for real-time alerts
- **TTF Model:** Time-to-failure prediction (this pipeline)

## References

- Froude, M. J., & Petley, D. N. (2018). Global fatal landslide occurrence from 2004 to 2016. *Natural Hazards and Earth System Sciences*, 18(8), 2161-2181.
- Segoni, S., et al. (2018). A review of the recent literature on rainfall thresholds for landslide occurrence. *Landslides*, 15(8), 1483-1501.

## Maintenance

**Last Updated:** 2026-09-13  
**Status:** Research/validation pipeline only - no trained model  
**Maintainer:** Parvaah ML Team

---

**IMPORTANT:** This pipeline is designed to fail gracefully when data is insufficient. A "failed" run that produces a clear feasibility report is the correct outcome with current data.
