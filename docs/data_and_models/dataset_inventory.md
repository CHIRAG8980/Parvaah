# Parvaah Dataset Inventory

**Document Version:** 1.0  
**Last Updated:** 2026-09-13  
**Purpose:** Complete reference of all datasets downloaded, ingested, and used in the Parvaah early warning system for landslide risk monitoring.

---

## Overview

Parvaah integrates data from 7 major sources across satellite imagery, meteorological, topographic, infrastructure, and ground truth domains. All data is immutable in `data/raw/` and processed outputs are stored in `data/processed/`.

---

## 1. Satellite Imagery

### 1.1 Sentinel-1 SAR (Synthetic Aperture Radar)

**Source:** ESA (European Space Agency) / Copernicus Program  
**Access:** Open access via [Copernicus Open Access Hub](https://scihub.copernicus.eu/)

| Property | Value |
|----------|-------|
| **Resolution** | 10m |
| **Coverage** | Meghalaya/Assam (NER focus) |
| **Acquisition Dates** | August 2024 (recent) |
| **File Format** | .zip (GeoTIFF bands inside) |
| **Size** | 2.1GB total |
| **Orbit Mode** | IW (Interferometric Wide Swath) |
| **Polarization** | VV + VH |
| **File Count** | 2 acquisitions |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/sentinel1/`

**Purpose in Parvaah:**
- Detect surface deformation and slope instability
- InSAR coherence analysis for landslide susceptibility
- SAR intensity for terrain roughness characterization
- Coherence ratio as dynamic hazard indicator
- Works in monsoon season (cloud-penetrating radar)

**Processing:**
```
Raw SAR → SNAP/ESA Toolbox → Deformation maps → Feature bands
         → SAR intensity rasters (VV, VH, ratio)
         → 30m resolution resampled outputs
```

**Output Features Generated:**
- `sar_intensity_vv_30m.tif`
- `sar_intensity_vh_30m.tif`
- `sar_coherence_30m.tif`
- `sar_ratio_30m.tif`

---

### 1.2 Sentinel-2 Multispectral (MSI)

**Source:** ESA (European Space Agency) / Copernicus Program  
**Access:** Open access via [Google Earth Engine](https://earthengine.google.com/) or Copernicus Hub

| Property | Value |
|----------|-------|
| **Resolution** | 10m (multispectral) / 20m (SWIR) |
| **Coverage** | Meghalaya/Assam (NER focus) |
| **Acquisition Dates** | August 2026 (recent) |
| **File Format** | .zip (GeoTIFF bands inside) |
| **Size** | 60KB (minimal - archived) |
| **Spectral Bands** | 11 bands (B2-B12) |
| **File Count** | 2 acquisitions |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/sentinel2/`

**Purpose in Parvaah:**
- Vegetation health monitoring (NDVI)
- Vegetation stress detection (precursor to landslides)
- Land use / land cover classification
- Cloud-free optical data for validation
- Seasonal vegetation change tracking

**Processing:**
```
Raw MSI → Band math → NDVI = (NIR - RED) / (NIR + RED)
       → 30m resolution resampled
       → Seasonal stack for temporal trends
```

**Output Features Generated:**
- `ndvi_shillong_30m.tif` (Normalized Difference Vegetation Index)
- `lulc_classification_30m.tif` (Land Use / Land Cover)

---

## 2. Meteorological Data

### 2.1 IMD Gridded Rainfall

**Source:** Indian Meteorological Department (IMD)  
**Access:** Institutional download via [IMD Portal](https://imdpune.gov.in/)

| Property | Value |
|----------|-------|
| **Coverage** | All-India grid, NER subset extracted |
| **Resolution** | 0.25° × 0.25° (~25 km) |
| **Temporal Resolution** | Daily |
| **Time Period** | 2014-2024 (11 years historical) |
| **File Format** | NetCDF (.nc) |
| **File Count** | 11 files (one per year) |
| **Total Size** | 275MB |
| **Data Type** | Rainfall accumulation (mm/day) |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/imd/gridded_rainfall_historical/`

**Files:**
```
IMD_rainfall_2014.nc         (2014 data)
IMD_rainfall_2015.nc         (2015 data)
IMD_rainfall_2016.nc         (2016 data)
... (through 2024)
IMD_rainfall_2024.nc         (2024 data)
Rainfall_ind2024_rfp25.grd   (2024 alternate format)
```

**Purpose in Parvaah:**
- Static susceptibility model: historical rainfall patterns (2014-2023)
- Dynamic early warning system: real-time 24h, 72h, 7-day rainfall accumulation
- Landslide trigger threshold identification
- Antecedent moisture calculation
- District-wise rainfall validation against ground gauges

**Processing:**
```
NetCDF extract → 24h rainfall: rolling sum over 24 hours
              → 72h rainfall: rolling sum over 72 hours
              → 7d rainfall:  rolling sum over 7 days
              → 30m resampled raster (matching DEM grid)
              → Feature bands: rainfall_24h_30m.tif, rainfall_72h_30m.tif, rainfall_antecedent_7d_30m.tif
```

**Output Features Generated:**
- `rainfall_24h_30m.tif` (24-hour accumulation)
- `rainfall_72h_30m.tif` (72-hour accumulation)
- `rainfall_antecedent_7d_30m.tif` (7-day antecedent moisture)
- `rainfall_districtwise_daily_imd.csv` (District-level summaries)

---

## 3. Topographic Data

### 3.1 CartoDEM (Digital Elevation Model)

**Source:** U.S. Geological Survey (USGS) / Copernicus GLO-30  
**Access:** Open access via [USGS Earth Explorer](https://earthexplorer.usgs.gov/)

| Property | Value |
|----------|-------|
| **Resolution** | 30m |
| **Coverage** | Meghalaya/Assam (NER focus) |
| **Source Dataset** | Copernicus Digital Elevation Model (GLO-30) |
| **Vertical Accuracy** | ±5m (global) |
| **File Format** | GeoTIFF (.tif) |
| **Size** | 93MB |
| **Datum** | WGS84 / EPSG:4326 |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/cartodem/`

**Purpose in Parvaah:**
- Derive slope (steepness indicator)
- Derive aspect (sun exposure, weathering patterns)
- Derive curvature (convergent/divergent flow)
- Terrain roughness characterization
- Topographic Position Index (TPI)
- Foundation for all 30m spatial grid alignment

**Processing:**
```
Raw DEM → Slope calculation (degrees/percent)
       → Aspect calculation (0-360°)
       → Curvature (plan & profile)
       → TPI (Topographic Position Index)
       → 30m output rasters
```

**Output Features Generated:**
- `elevation_30m.tif` (Resampled from source)
- `slope_30m.tif` (Degrees)
- `aspect_30m.tif` (0-360° azimuth)
- `curvature_30m.tif` (Plan and profile curvature)

---

## 4. Geospatial Layers

### 4.1 Bhuvan (National Geospatial Platform)

**Source:** ISRO (Indian Space Research Organisation) / Bhuvan Portal  
**Access:** [https://bhuvan.nrsc.gov.in/](https://bhuvan.nrsc.gov.in/)

| Property | Value |
|----------|-------|
| **Layers** | LULC, Geomorphology, Lineament, Urban extent |
| **Resolution** | 30m (varies by layer) |
| **Coverage** | All-India, NER subset extracted |
| **File Format** | GeoJSON, XML metadata |
| **Size** | 16KB (metadata) |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/bhuvan/`

**Purpose in Parvaah:**
- Land Use / Land Cover classification (validation against Sentinel-2)
- Geomorphological zone classification (e.g., hills, plateaus, valleys)
- Lineament detection (fault lines, fractures)
- Urban exposure mapping (population at risk)

**Layers Used:**
1. **LULC (Land Use / Land Cover):** 14 classes (forest, agriculture, water, urban, etc.)
2. **Geomorphology:** Valley bottoms, slopes, ridges, plateaus
3. **Lineament:** Fracture/fault line density
4. **Urban Extent:** Built-up areas, population centers

**Output Features Generated:**
- `bhuvan_lulc_shillong_30m.tif`
- `bhuvan_geomorphology_valley_30m.tif`
- `bhuvan_geomorphology_slope_30m.tif`
- `bhuvan_lineament_density_30m.tif`

---

### 4.2 OpenStreetMap (OSM) Infrastructure

**Source:** OpenStreetMap (OSM) Community  
**Access:** Open access via [Overpass API](https://overpass-turbo.eu/)

| Property | Value |
|----------|-------|
| **Feature Types** | Roads, settlements, streams, landuse |
| **Coverage** | Meghalaya/Assam (NER focus) |
| **File Format** | GeoJSON, Shapefile |
| **Size** | 75MB |
| **Update Frequency** | Continuously updated (snapshot as of Aug 2024) |
| **Road Classifications** | Primary, secondary, tertiary, residential |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/osm/`

**Purpose in Parvaah:**
- Distance to nearest road (infrastructure fragility indicator)
- Settlement/population center mapping (exposure)
- Stream/drainage network (water-triggered instability)
- Road density (development pressure indicator)

**Processing:**
```
Raw GeoJSON → Rasterize roads → Distance transform
           → Binary settlement mask → Distance transform
           → Stream network rasterization
           → 30m resolution outputs
```

**Output Features Generated:**
- `distance_to_road_30m.tif` (Euclidean distance in meters)
- `distance_to_settlements_30m.tif` (Proximity to population)
- `distance_to_streams_30m.tif` (Drainage proximity)
- `road_infrastructure.csv` (Feature summary)

---

## 5. Ground Truth / Validation Data

### 5.1 NRSC / GSI Landslide Inventory

**Source:** NRSC (National Remote Sensing Centre) & GSI (Geological Survey of India)

| Property | Value |
|----------|-------|
| **Source 1** | ISRO Landslide Atlas 2023 (PDF) |
| **Source 2** | GSI Historical Landslide Records |
| **Coverage** | Meghalaya/Assam (NER focus) |
| **Record Count** | 1,330+ confirmed landslide events |
| **File Format** | GeoJSON, CSV, PDF |
| **Size** | 353MB |
| **Data Types** | Point (event location), polygon (scar extent), date (occurrence) |

**Storage Location:**  
`Parvaah/apps/ml-engine/data/raw/ground_truth/`

**Files:**
```
isro_nrsc_landslide_atlas/ISRO_Landslide_Atlas_2023.pdf
gsi_landslides.geojson
meghalaya_1330_landslides.csv
meghalaya_1330_landslides.geojson
```

**Purpose in Parvaah:**
- **Training labels** for susceptibility model (Model 1: XGBoost)
- Model validation and cross-validation
- Trigger date identification (link to rainfall timing)
- Spatial bias detection in model predictions
- Confidence scoring for historical inventory

**Data Structure:**
```csv
event_id,latitude,longitude,date,type,trigger,confidence
1,25.456,91.234,2015-07-15,debris-flow,rainfall,high
2,25.489,91.267,2018-05-22,rockfall,weathering,medium
...
```

**Processing:**
```
Raw GeoJSON → Rasterize landslide presence/absence grid
           → 30m resolution binary mask
           → Train/validation split (80/20)
           → XGBoost susceptibility training
```

---

### 5.2 Field Survey & Validation Data

**Source:** Community reports, field teams, disaster response logs

| Property | Value |
|----------|-------|
| **Data Type** | Structured field observations, validation points |
| **Coverage** | Meghalaya (focus area) |
| **Record Count** | On-demand during validation campaigns |
| **File Format** | CSV, GeoJSON (mobile app submissions) |

**Storage Location:**  
`Parvaah/data/raw/ground_truth/` (field_surveys.csv when available)

**Purpose in Parvaah:**
- Real-time validation of alerts
- Model drift detection (comparison vs. historical training)
- Feedback loop for model retraining
- Community-sourced ground truth augmentation

---

## 6. Soil Moisture Data

### 6.1 EOS-04 SAR Soil Moisture (ISRO)

**Source:** ISRO EOS-04 Satellite / SCATSAT-1 follow-on  
**Access:** [ISRO Data Hub](https://bhuvan-ras.nrsc.gov.in/mhrd/)

| Property | Value |
|----------|-------|
| **Sensor** | MWRI-II (Microwave Radiometer) |
| **Resolution** | 500m |
| **Temporal Resolution** | 2-3 day repeat cycle |
| **Coverage** | All-India |
| **File Format** | .zip (GeoTIFF inside) |
| **Size** | ~150MB (SAR zips + validation) |
| **File Count** | 5 acquisition dates (July-August 2023) |
| **Data Parameter** | Volumetric soil moisture (%) |

**Storage Location:**  
`Parvaah/data/raw/soil_moisture/`

**Files:**
```
E04_SAR_MRS_20JUL2023_*.zip
E04_SAR_MRS_28JUL2023_*.zip
E04_SAR_MRS_03AUG2023_*.zip
E04_SAR_MRS_11AUG2023_*.zip
E04_SAR_MRS_14AUG2023_*.zip
eos04_soil_moisture_validation.csv
validate_eos04_soil_moisture.py
```

**Purpose in Parvaah:**
- Antecedent soil moisture state (saturation → instability)
- Dynamic hazard model input (Model 2: LSTM)
- Model 3 (Risk Impact) integration for impact forecasting
- Seasonal variation in slope stability
- Integration with rainfall for combined moisture index

**Processing:**
```
Raw SAR soil moisture → 30m resampling
                     → Combine with rainfall accumulation
                     → Moisture index = (rainfall + soil_moisture) / 2
                     → Feature: moisture_index_30m.tif
```

**Output Features Generated:**
- `soil_moisture_index_30m.tif`
- `combined_moisture_state_30m.tif` (rainfall + soil moisture)

---

## 7. Processed & Derived Data

All raw data is transformed into aligned 30m resolution rasters and feature matrices.

### 7.1 Feature Bands (Individual 30m GeoTIFFs)

**Storage Location:**  
`Parvaah/apps/ml-engine/data/processed/individual_bands/`

| Feature Category | Count | Files | Size |
|------------------|-------|-------|------|
| Topographic | 4 | elevation, slope, aspect, curvature | 180MB |
| Satellite (SAR) | 4 | VV intensity, VH intensity, coherence, ratio | 210MB |
| Satellite (Optical) | 2 | NDVI, LULC | 95MB |
| Climate | 3 | rainfall 24h, 72h, antecedent 7d | 140MB |
| Infrastructure | 3 | distance to road, settlements, streams | 165MB |
| Geospatial | 3 | Bhuvan LULC, geomorphology, lineament | 120MB |
| Soil | 1 | soil moisture index | 90MB |
| **Total** | **20** | **All aligned to 30m grid** | **1.0GB** |

### 7.2 Master Tensor (Stacked Multi-band)

**Storage Location:**  
`Parvaah/apps/ml-engine/data/processed/master_tensor/`

| File | Dimensions | Size | Purpose |
|------|-----------|------|---------|
| `master_features_shillong_30m.tif` | (rows, cols, 20 bands) | 450MB | All 20 features stacked |
| `static_features_shillong_30m.tif` | (rows, cols, 11 bands) | 280MB | Time-invariant features only |
| `dataset_manifest.json` | Metadata | 12KB | Band names, data types, CRS |

### 7.3 Model Outputs

**Storage Location:**  
`Parvaah/apps/ml-engine/data/processed/`

| Output | File | Size | Update Frequency | Purpose |
|--------|------|------|------------------|---------|
| Susceptibility Map | `static_susceptibility_map_30m.tif` | 380MB | Annually | Base risk layer |
| Dynamic Alert Raster | `dynamic_hazard_alert_DOY235.tif` | 95MB | Daily (updated) | Real-time risk (day-of-year) |
| Active Alerts GeoJSON | `active_alerts.json` | 2.5MB | Real-time | Current warning zones |
| Ground Truth Grid | `meghalaya_1330_landslides.tif` | 45MB | Static | Training label raster |

---

## 8. Data Staging & Inventory

### 8.1 Derived Feature CSVs

**Storage Location:**  
`Parvaah/data/processed/derived_features/`

| CSV File | Purpose | Rows | Size |
|----------|---------|------|------|
| `rainfall_features.csv` | District-level rainfall statistics | 28 (districts) | 1.1MB |
| `infrastructure_features.csv` | Zone-level infrastructure density | 120+ zones | 32MB |
| `road_infrastructure.csv` | Road network characteristics | All zones | 118MB |
| `infrastructure_feature_quality_report.csv` | Data quality metrics | Quality flags | 629B |

### 8.2 Model Artifacts

**Storage Location:**  
`Parvaah/models/checkpoints/`

| Model File | Purpose | Size | Format |
|------------|---------|------|--------|
| `xgb_susceptibility_shillong.json` | Trained XGBoost (Model 1) | 303KB | JSON (portable) |
| `feature_importance.json` | SHAP feature rankings | 4KB | JSON |
| `rainfall_model.pkl` | Rainfall preprocessing pipeline | 1MB | Pickle |

---

## 9. Data Access & Permissions

### Download Instructions

```bash
# 1. Sentinel-1 (ESA)
# Visit: https://scihub.copernicus.eu/
# Search: Meghalaya, August 2024, Sentinel-1 IW mode
# Download: 2 scenes (auto-registered)

# 2. Sentinel-2 (Google Earth Engine)
python Parvaah/apps/ml-engine/scripts/download_sentinel2_gee.py

# 3. CartoDEM (USGS)
python Parvaah/apps/ml-engine/scripts/download_dem_usgs.py

# 4. IMD Rainfall
# Contact: Indian Meteorological Department
# Files pre-downloaded and stored in data/raw/imd/

# 5. Bhuvan
# Access: https://bhuvan.nrsc.gov.in/
# Download layers via portal (GeoJSON export)

# 6. OpenStreetMap
python Parvaah/apps/ml-engine/scripts/download_osm_overpass.py

# 7. Ground Truth
# GSI contact: Geological Survey of India
# ISRO: Available via BHUVAN portal
```

### Data Licensing

| Source | License | Commercial Use | Attribution |
|--------|---------|-----------------|--------------|
| Sentinel-1/2 | CC-BY-4.0 | ✅ Allowed | ESA/Copernicus |
| CartoDEM | CC-BY-4.0 | ✅ Allowed | USGS |
| IMD Rainfall | Institutional | Contact IMD | Indian Meteorological Dept |
| Bhuvan | Open | ✅ Allowed (India) | ISRO |
| OSM | ODbL | ✅ Allowed | OSM Contributors |
| Ground Truth | Government | India Government | GSI/ISRO |
| EOS-04 | Open | ✅ Allowed | ISRO |

---

## 10. Data Quality & Validation

### Validation Status

| Dataset | Status | Last Validated | Issues |
|---------|--------|-----------------|--------|
| Sentinel-1 | ✅ Active | 2026-09-13 | None |
| Sentinel-2 | ✅ Active | 2026-09-13 | None |
| CartoDEM | ✅ Static | 2024-08-15 | None (immutable) |
| IMD Rainfall | ✅ Active | 2026-09-13 | None |
| Bhuvan | ✅ Active | 2024-12-01 | Metadata only |
| OSM | ✅ Active | 2024-08-15 | Snapshot (not real-time) |
| Ground Truth | ✅ Static | 2023-09-01 | None (reference only) |
| EOS-04 Soil | ✅ Archived | 2023-08-31 | Legacy archive only |

### Data Gaps & Mitigation

| Gap | Impact | Mitigation |
|-----|--------|-----------|
| No recent soil moisture data | Low (using rainfall proxy) | Quarterly EOS-04 requests when available |
| Incomplete landslide inventory | Medium (1,330 events sufficient for training) | Continuous field validation |
| Limited real-time validation points | Low (alerts still actionable) | Community reporting app (future) |

---

## 11. Update & Maintenance Schedule

### Automatic Updates
- **Daily:** IMD rainfall (7-day lag)
- **Every 5 days:** Sentinel-1/2 (when available)
- **Real-time:** Active alert outputs

### Annual Updates
- **January:** Download previous calendar year IMD rainfall
- **August:** Refresh Sentinel-1/2 seasonal archive
- **December:** Model retraining with latest ground truth

### Manual Updates
- Bhuvan layers: As needed (typically annual)
- OSM: Manual refresh when new infrastructure added
- Ground truth: Field validation campaign feedback

---

## 12. FAQ & Troubleshooting

**Q: Why is IMD rainfall at 25km resolution when other data is 30m?**  
A: IMD publishes on a 0.25° grid (~25km). We resample to 30m and aggregate to zones for model consistency.

**Q: Can I use the processed feature CSVs directly?**  
A: Yes, but verify they're aligned with your model version. Always regenerate from raw data for production.

**Q: Where is the real-time soil moisture data?**  
A: EOS-04 legacy archive only (2023). Using rainfall accumulation as proxy until newer soil moisture available.

**Q: How often should we retrain models?**  
A: Model 1 (susceptibility): Annually. Model 2 (dynamic): Weekly if rainfall patterns change. Model 3 (impact): As needed based on drift detection.

**Q: Can external users access this data?**  
A: Raw data sources are open (Sentinel, Bhuvan, OSM, IMD). Processed outputs and models are Parvaah-internal.

---

## References

- ESA Copernicus Program: https://www.copernicus.eu/
- USGS Earth Explorer: https://earthexplorer.usgs.gov/
- Indian Meteorological Department: https://imdpune.gov.in/
- ISRO Bhuvan: https://bhuvan.nrsc.gov.in/
- OpenStreetMap: https://www.openstreetmap.org/
- Geological Survey of India: https://www.gsi.gov.in/
- Parvaah Architecture: See `docs/architecture.md`
- ML Model Details: See `docs/AI_features.md`

---

**Document Owner:** Parvaah Development Team  
**Last Updated:** 2026-09-13  
**Status:** ✅ Complete & Verified
