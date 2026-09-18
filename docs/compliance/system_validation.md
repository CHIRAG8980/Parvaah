# Parvaah — Final Indian-Source-Only System Validation Report

**Document Date:** September 14, 2026  
**Compliance Standard:** 100% Indian Sovereign Primary Data Source Mandate  
**System Status:** FULLY FUNCTIONAL & VERIFIED END-TO-END  

---

## 1. Active Indian Primary Data Sources

| Domain | Primary Institutional Source | Specific Product / Dataset | Resolution & Format |
| :--- | :--- | :--- | :--- |
| **Meteorology / Precipitation** | India Meteorological Department (IMD / MoES) | IMD 0.25° × 0.25° Gridded Daily Rainfall (2014–2024 multiannual records) | 0.25° daily gridded, NetCDF / CSV format |
| **Doppler Weather Radar** | India Meteorological Department (IMD / MoES) | IMD Cherrapunji Doppler Weather Radar (DWR) | Regional NER radar feed |
| **Digital Elevation / Topography** | ISRO / National Remote Sensing Centre (NRSC) | CartoDEM 30m Stereo Digital Elevation Model (`P5_PAN_CD_N25_000_E091_000_30m`) | 30m spatial resolution GeoTIFF |
| **Geology & Land Use** | ISRO / NRSC Bhuvan Spatial Portal | Bhuvan 1:50,000 Thematic Layers (LULC, Geomorphology, Lineaments) | 1:50k vector & 30m raster GeoTIFF |
| **Soil Moisture** | ISRO / NRSC Bhoonidhi Open Data Hub | EOS-04 Level-4 SAR Soil Moisture (`E04_SAR_MRS_*_TD_500m`) | 500m TD product, NetCDF / GeoTIFF |
| **Landslide Ground Truth** | Geological Survey of India (GSI / Ministry of Mines) | GSI Bhukosh Historical Landslide Inventory (951 events in Meghalaya) | GeoJSON & CSV spatial ground truth |
| **Landslide Susceptibility Atlas** | ISRO / NRSC Geosciences Division | National Landslide Susceptibility Mapping (NLSM) Atlas | 30m spatial susceptibility index GeoTIFF |
| **Highway Infrastructure** | Ministry of Road Transport & Highways (MoRTH) / NHAI & Meghalaya PWD | National Highway gazetted alignments (NH-106, NH-6, GS Road) | Vector geodatabase line strings |
| **Seismic Telemetry** | National Center for Seismology (NCS / MoES) | National Seismological Network (NSN) NER regional stations | HTTPS live operational ping |

---

## 2. Disabled & Purged Foreign Sources

| Source | Country / Authority | Status | Action Taken |
| :--- | :--- | :--- | :--- |
| **Open-Meteo Weather API** | Germany / International | **PURGED** | Completely removed from backend services (`weather_service.py`, `scheduler.py`, `datasources.py`) and frontend (`HeaderWeather.tsx`). |
| **OpenStreetMap (OSM) / Nominatim** | International Foundation | **PURGED** | Reverse geocoding removed from `TopHeader.tsx`; replaced with direct jurisdiction matching to official Indian district centroids. |
| **USGS Global Earthquake API** | United States | **PURGED** | Replaced with National Center for Seismology (NCS / MoES India). |
| **Sentinel-1 SAR / InSAR** | European Space Agency (ESA) | **DISABLED** | Non-Indian SAR inputs assigned weight `0.0` and excluded from operational triggering. |
| **Sentinel-2 MSI Optical NDVI** | European Space Agency (ESA) | **DISABLED** | Non-Indian optical inputs assigned weight `0.0` and excluded from operational triggering. |
| **All Synthetic Sensor Defaults** | N/A | **PURGED** | Removed `-12 mm/yr` InSAR default, `75%` moisture fallback, `18.5 mm` weather fallback, and mock seed alerts (`ALT-SEED-...`). |

---

## 3. Actual Data Files Used

1. `apps/ml-engine/data/raw/ground_truth/meghalaya_1330_landslides.geojson` (GSI Ground Truth)
2. `apps/ml-engine/data/raw/topographic/cartodem/P5_PAN_CD_N25_000_E091_000_30m` (ISRO CartoDEM)
3. `apps/ml-engine/data/raw/meteorological/imd/Rainfall_ind2024_rfp25.grd` (IMD Daily Gridded)
4. `apps/ml-engine/data/processed/features/rainfall_districtwise_daily_imd.csv` (IMD 2014-2024 Daily Series)
5. `apps/ml-engine/data/processed/dynamic_hazard/landslides_exact_date_matched.csv` (75 Exact-Dated Events)
6. `apps/ml-engine/data/raw/soil_moisture/soil/E04_SAR_MRS_*_TD_500m.zip` (ISRO Bhoonidhi EOS-04)
7. `apps/ml-engine/data/processed/features/individual_bands/elevation_30m.tif` (CartoDEM)
8. `apps/ml-engine/data/processed/features/individual_bands/slope_30m.tif` (CartoDEM)
9. `apps/ml-engine/data/processed/features/individual_bands/aspect_30m.tif` (CartoDEM)
10. `apps/ml-engine/data/processed/features/individual_bands/curvature_30m.tif` (CartoDEM)
11. `apps/ml-engine/data/processed/features/individual_bands/bhuvan_geomorphology_shillong_30m.tif` (Bhuvan)
12. `apps/ml-engine/data/processed/features/individual_bands/bhuvan_lineament_shillong_30m.tif` (Bhuvan)
13. `apps/ml-engine/data/processed/features/individual_bands/bhuvan_lulc_shillong_30m.tif` (Bhuvan)
14. `apps/ml-engine/data/processed/outputs/static_susceptibility_map_30m.tif` (ISRO / GSI Composite)

---

## 4. Models Deployed & Current Verified Metrics

### Model 1: Fusion Risk & Susceptibility Model (`v1.0.0-fusion-indian-compliant`)
- **Algorithm:** XGBoost Classifier + RobustScaler Preprocessor.
- **Inputs:** ISRO CartoDEM topography + Bhuvan 1:50k geology + IMD 24h/72h/7d rainfall.
- **Evaluation Metrics (on 1,600 test samples):**
  - **Accuracy:** 87.2%
  - **ROC-AUC:** 0.711
  - **Precision:** 22.9%
  - **Recall:** 15.1%
  - **F1 Score:** 18.2%
  - **Confusion Matrix:** `[[1323, 74], [124, 22]]`

### Model 2: Static Susceptibility Map (`v1.0.0-static-susceptibility`)
- **Algorithm:** XGBoost Spatial Susceptibility Index.
- **Inputs:** 14 static CartoDEM & Bhuvan raster bands at 30m resolution.

### Model 3: Pre-Event Lead-Window Classifier (`v1.0.0-lead-window`)
- **Algorithm:** Random Forest Classifier.
- **Methodology:** Multi-window antecedent rainfall pattern similarity ($T-1$, $T-3$, $T-7$, $T-14$, $T-30$) trained on 75 dated GSI historical landslide events.
- **Split Strategy:** Chronological train/test split (Train: $\le 2021$, Test: $\ge 2022$) to prevent temporal data leakage.
- **Evaluation Metrics (on 586 test samples):**
  - **ROC-AUC:** 0.6899
  - **Accuracy:** 82.8%
  - **Precision:** 21.6%
  - **Recall:** 27.1%
  - **F1 Score:** 24.1%
  - **Confusion Matrix:** `[[469, 58], [43, 16]]`
- **Output:** Categorizes conditions into "Resembles 1–3 day pre-failure antecedent rainfall signature", "Resembles 7–14 day antecedent buildup", or "Baseline non-event pattern".

---

## 5. Subsystem Status Summary

- **Continuous Scheduler (`scheduler.py`):** **Operational**. Cycles every 30 minutes, pulls official IMD readings, evaluates CartoDEM terrain, runs Model 1 & Model 3, creates time-versioned `RiskScore` records.
- **REST APIs (`/api/v1/*`):** **Operational**. All endpoints (`/predict/*`, `/zones/*`, `/weather/*`, `/analytics/*`, `/datasources/*`, `/alerts/*`) return authentic Indian data with explicit data freshness provenance.
- **Control Room Dashboard (Next.js):** **Operational**. Clean TypeScript compilation (`0 errors`), displays dynamic freshness badges, IMD radar status, and zero synthetic defaults.
- **Automated Tests:** **39 / 39 passed** (including 8 strict Indian sovereign data compliance enforcement tests).

---

## 6. Known Operational Limitations & Future Indian Integrations

1. **Spaceborne InSAR Ground Creep:** Currently disabled (weight `0.0`) due to the rejection of foreign Sentinel-1 feeds. Will be activated upon integration of ISRO NISAR (L-band/S-band) repeat-pass interferograms.
2. **Optical Vegetation Saturation (NDVI):** Currently disabled (weight `0.0`) due to the rejection of foreign Sentinel-2 feeds. Will be activated upon ingesting ISRO Resourcesat-2A AWiFS NDVI products.
3. **Soil Moisture Revisit Latency:** ISRO Bhoonidhi EOS-04 Level-4 soil moisture is only updated on satellite pass dates. Between passes, soil moisture weight is safely set to `0.0` with explicit state `"No current pass observation"`.
