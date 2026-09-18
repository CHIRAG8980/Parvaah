# Parvaah ML Engine & Geospatial Processing Core

**Technology:** Scikit-Learn • XGBoost • RobustScaler • SHAP • Rasterio • GeoPandas • NetCDF4  
**Serving Layer:** `ParvaahInferencePipeline` ([`src/inference_pipeline.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/ml-engine/src/inference_pipeline.py))  
**Compliance Standard:** 100% Indian Sovereign Primary Data Mandate

---

## 1. The 4-Model Sovereign Indian AI Ensemble

```
           [ Topographic & Geological Baselines ]
    ISRO CartoDEM 30m (Slope, Aspect, Curvature, Elev)
    ISRO Bhuvan (LULC, Geomorphology, Lineaments)
    GSI Bhukosh (951 Landslide Ground-Truth Events)
                      │
                      ▼
    ┌───────────────────────────────────────────────┐
    │  Model 1: Static Susceptibility (RF)          │
    │  10-band RandomForest classifying baseline    │
    │  slope failure vulnerability (0.0 to 1.0)     │
    └───────────────────────┬───────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────┐   [ Meteorological Telemetry ]
    │  Model 2: Dynamic Hazard Trigger (XGBoost)    │◄── IMD 0.25° Gridded Series &
    │  Multi-scale IMD rainfall triggers:           │    AWS Stations (24h, 72h mm)
    │  DOY seasonal index vs. empirical thresholds  │
    └───────────────────────┬───────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────┐   [ Hydrological Curves ]
    │  Model 3: Pre-Event Condition Similarity (RF) │◄── 7d, 14d, 30d Antecedent
    │  Pattern matches current saturation curves    │    Saturation Profiling
    │  against pre-event curves of GSI landslides   │
    └───────────────────────┬───────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────┐   [ Satellite Surface Feeds ]
    │  Model 4: Multi-Modal Fusion Engine (XGBoost) │◄── ISRO Bhoonidhi EOS-04 SAR
    │  19-Feature Vector + RobustScaler Preprocessor│    Soil Moisture (500m TD)
    └───────────────────────┬───────────────────────┘
                            │
                            ▼
        [ Calibrated Continuous Hazard Score (0–100) ]
        [ Time-to-Failure Lead Window (1–3d or 3–7d) ]
        [ Contributing Factors (SHAP Explainability) ]
```

---

## 2. The 19-Feature Input Vector

Before inference, feature vectors are normalized using `RobustScaler` (`preprocessor.pkl`):

| # | Feature Name | Source | Description |
|---|---|---|---|
| 1 | `aspect` | ISRO CartoDEM 30m | Slope face compass orientation (0°–360°) |
| 2 | `bhuvan_geomorphology_shillong` | ISRO Bhuvan 1:50k | Structural hill, denudational plateau, or valley |
| 3 | `bhuvan_lineament_shillong` | ISRO Bhuvan 1:50k | Geological fault lineament proximity index |
| 4 | `bhuvan_lulc_shillong` | ISRO Bhuvan 1:50k | Land use/land cover classification |
| 5 | `curvature` | ISRO CartoDEM 30m | Surface curvature (concavity/convexity) |
| 6 | `distance_to_road` | MoRTH / PWD Road Network| Proximity to cut-slope excavations (meters) |
| 7 | `distance_to_settlements` | Census / Survey of India| Distance to downhill community clusters (meters) |
| 8 | `distance_to_streams` | Hydrography / CartoDEM | Distance to valley drainage channels (meters) |
| 9 | `dynamic_hazard_alert_DOY235` | IMD + Day of Year | Peak monsoon meteorological trigger index |
| 10| `elevation` | ISRO CartoDEM 30m | Absolute elevation above sea level (meters) |
| 11| `ndvi_shillong` | Sovereign optical baseline | Vegetation density index |
| 12| `rainfall_24h` | IMD AWS / Gridded | Cumulative 24-hour storm surge precipitation (mm) |
| 13| `rainfall_72h` | IMD AWS / Gridded | Cumulative 72-hour sustained soaking rainfall (mm) |
| 14| `rainfall_antecedent_7d` | IMD Daily Series | 7-day cumulative antecedent saturation (mm) |
| 15| `sar_coherence_shillong` | SAR Baseline | Phase coherence stability indicator |
| 16| `sar_intensity_shillong`| SAR Baseline | Backscatter intensity / surface roughness |
| 17| `sar_ratio_shillong` | SAR Baseline | Polarization ratio indicator |
| 18| `slope` | ISRO CartoDEM 30m | Terrain slope angle in degrees |
| 19| `static_susceptibility_map` | GSI / ISRO Composite | National Landslide Susceptibility Atlas index |

---

## 3. Serving & Programmatic Usage

The pipeline is packaged into `ParvaahInferencePipeline` in [`src/inference_pipeline.py`](file:///home/pratham/Disk2/Hackathon%20Projects/SIH%202026/Parvaah/apps/ml-engine/src/inference_pipeline.py):

```python
from src.inference_pipeline import ParvaahInferencePipeline

pipeline = ParvaahInferencePipeline()

result = pipeline.predict(
    slope_deg=34.5,
    rainfall_24h_mm=85.0,
    rainfall_72h_mm=190.0,
    rainfall_antecedent_7d_mm=310.0,
    static_features={
        "aspect": 145.0,
        "elevation": 1420.0,
        "curvature": -0.015,
        "distance_to_road": 45.0,
        "distance_to_streams": 120.0,
        "distance_to_settlements": 250.0,
        "static_susceptibility_map": 0.72,
        "bhuvan_geomorphology_shillong": 3.0,
        "bhuvan_lineament_shillong": 0.85,
        "bhuvan_lulc_shillong": 2.0,
    }
)

print(f"Risk Score: {result.risk_score} ({result.risk_level.value})")
print(f"Lead Time Window: {result.time_to_failure_window}")
print(f"Key Factor: {result.explainability_factors.top_factors[0]}")
```

---

## 4. Model Training & Defensibility Research

* **Model Checkpoints**: Saved in `data/processed/models/` (`fusion_risk_model.pkl`, `preprocessor.pkl`, `lead_window_model.pkl`).
* **Time-To-Failure (TTF) Research**: Documented in `models/time_to_failure/outputs/reports/ttf_feasibility_report.md`. To avoid false confidence, failure windows are output as statistically defensible bounds ($1–3\text{ days}$ or $3–7\text{ days}$) rather than artificial minute-by-minute timers.
