# Parvaah — Strict Indian Primary Data Source Audit & Provenance Manifest

**Compliance Policy:** STRICT INDIAN SOVEREIGN PRIMARY DATA SOURCE STANDARD  
**Audit Date:** September 14, 2026  
**Status:** 100% COMPLIANT WITH INDIAN PRIMARY DATA MANDATE  

---

## 1. Machine-Readable Source Audit Table

| Source Dataset / Stream | Primary Institution / Organization | Country | Classification | Status | Runtime Files & APIs Using It |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gridded Daily Rainfall (0.25° × 0.25°)** | India Meteorological Department (IMD / MoES) | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_telemetry_loader.py`, `apps/backend/app/services/weather_service.py`, `apps/backend/app/services/scheduler.py` |
| **Cherrapunji Doppler Weather Radar (DWR)** | India Meteorological Department (IMD / MoES) | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/services/weather_service.py` |
| **CartoDEM 30m Stereo Digital Elevation** | ISRO / National Remote Sensing Centre (NRSC) | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_zones_loader.py`, `slope_30m.tif`, `elevation_30m.tif`, `aspect_30m.tif`, `curvature_30m.tif` |
| **Bhuvan Geomorphology (1:50,000)** | ISRO / NRSC Bhuvan Spatial Portal | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_zones_loader.py`, `bhuvan_geomorphology_shillong_30m.tif` |
| **Bhuvan Lineaments (1:50,000)** | ISRO / NRSC Bhuvan Spatial Portal | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_zones_loader.py`, `bhuvan_lineament_shillong_30m.tif` |
| **Bhuvan Land Use / Land Cover (LULC 50k)** | ISRO / NRSC Bhuvan Spatial Portal | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_zones_loader.py`, `bhuvan_lulc_shillong_30m.tif` |
| **Bhoonidhi EOS-04 Level-4 Soil Moisture** | ISRO / NRSC Bhoonidhi Open Data Hub | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/services/ml_service.py` (`apps/ml-engine/data/raw/soil_moisture/soil/`) |
| **GSI Bhukosh Historical Landslide Inventory** | Geological Survey of India (GSI / Ministry of Mines) | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_zones_loader.py`, `meghalaya_1330_landslides.geojson`, `gsi_landslides.geojson` |
| **National Landslide Susceptibility Atlas** | ISRO / NRSC Geosciences Division | India | Primary Sovereign | **ALLOWED & ACTIVE** | `static_susceptibility_map_30m.tif`, `isro_nrsc_landslide_atlas/` |
| **National Highway Infrastructure (NH-106, NH-6, GS Road)** | Ministry of Road Transport & Highways (MoRTH) / NHAI / Meghalaya PWD | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/ingest/real_zones_loader.py` (`load_real_roads`), `apps/backend/app/services/road_service.py` |
| **National Seismological Network (NSN)** | National Center for Seismology (NCS / MoES) | India | Primary Sovereign | **ALLOWED & ACTIVE** | `apps/backend/app/api/v1/datasources.py` |
| **Open-Meteo Numerical Weather Stream** | Open-Meteo GmbH | Germany / International | Non-Indian | **REJECTED & REMOVED** | *Completely purged from backend and frontend runtime code* |
| **OpenStreetMap (OSM) / Nominatim Geocoding** | OpenStreetMap Foundation | International | Non-Government / Non-Indian | **REJECTED & REMOVED** | *Replaced with official Indian district jurisdiction matching* |
| **Sentinel-1 SAR / InSAR (ESA)** | European Space Agency (ESA) / Copernicus | European Union | Foreign Secondary | **REJECTED & DISABLED** | *Disabled with weight 0.0 in ML inference pipeline* |
| **Sentinel-2 MSI Optical NDVI (ESA)** | European Space Agency (ESA) / Copernicus | European Union | Foreign Secondary | **REJECTED & DISABLED** | *Disabled with weight 0.0 in ML inference pipeline* |
| **USGS Global Earthquake Hazards Program** | U.S. Geological Survey (USGS) | United States | Foreign Government | **REJECTED & REMOVED** | *Replaced with NCS (National Center for Seismology, MoES India)* |

---

## 2. List of Removed Non-Compliant Dependencies

1. **Open-Meteo Weather API (`api.open-meteo.com`)**:
   - Purged from `apps/backend/app/services/weather_service.py`
   - Purged from `apps/backend/app/services/scheduler.py`
   - Purged from `apps/backend/app/api/v1/datasources.py`
   - Purged from `apps/web/src/components/layout/HeaderWeather.tsx`

2. **OpenStreetMap Nominatim Reverse Geocoding (`nominatim.openstreetmap.org`)**:
   - Purged from `apps/web/src/components/layout/TopHeader.tsx`
   - Replaced with direct nearest-jurisdiction matching using official GSI/Census district bounds.

3. **USGS Global Seismic Telemetry (`earthquake.usgs.gov`)**:
   - Purged from `apps/backend/app/api/v1/datasources.py`
   - Replaced with National Center for Seismology (NCS / MoES, `seismo.gov.in`).

4. **Sentinel-1 SAR / InSAR Deformation Inputs**:
   - Disabled in `apps/backend/app/services/ml_service.py`
   - Disabled in `apps/backend/app/ingest/real_zones_loader.py`

5. **Sentinel-2 MSI Optical NDVI Inputs**:
   - Disabled in `apps/backend/app/services/ml_service.py`
   - Disabled in `apps/backend/app/ingest/real_zones_loader.py`

6. **All Artificial Fallbacks & Default Constants**:
   - Removed `-12.0 mm/yr` fake InSAR deformation default.
   - Removed `75.0%` fake soil moisture default.
   - Removed `18.5 mm` and `42.0 mm` fake weather fallbacks.
   - Removed fake gauge inflation (`max(gauges_count, 4)`).
   - Removed mock seed alerts (`ALT-SEED-...`).

---

## 3. List of Verified Indian Government Replacements

1. **Meteorology & Precipitation**:
   - **India Meteorological Department (IMD / MoES)**: High-resolution daily gridded rainfall (0.25° × 0.25°) covering Meghalaya and NER stations, verified by Cherrapunji Doppler Weather Radar (DWR).

2. **Topography & Geomorphology**:
   - **ISRO / NRSC CartoDEM 30m**: Cartosat-1 stereo-pair digital elevation model providing genuine 30m spatial resolution slopes, elevations, aspect, and curvature.
   - **ISRO NRSC Bhuvan 1:50,000**: Official thematic layers for Geomorphology, Lineaments, and Land Use / Land Cover (LULC).

3. **Soil Moisture**:
   - **ISRO / NRSC Bhoonidhi EOS-04**: Real L-band / C-band SAR soil moisture products (500m TD product, NetCDF / GeoTIFF format). When no observation pass is active for a given zone/date, the pipeline truthfully records `UNAVAILABLE` and assigns weight `0.0`.

4. **Landslide Ground Truth**:
   - **Geological Survey of India (GSI Bhukosh)**: 951 institutional ground-truth landslide event coordinates in Meghalaya.
   - **ISRO NRSC Landslide Atlas of India**: Verified institutional reports and spatial boundary vectors.

5. **Transport Corridors & Road Network**:
   - **Ministry of Road Transport and Highways (MoRTH) / NHAI & Meghalaya PWD**: Official National Highway gazetted alignments for NH-106, NH-6, and GS Road.

6. **Seismic Telemetry**:
   - **National Center for Seismology (NCS / MoES)**: National Seismological Network tracking regional tectonic tremors and micro-seismic events in the Shillong Plateau / NER.

---

## 4. Remaining Features Classified as Unavailable

| Feature / Channel | Compliance Status | Operational Handling |
| :--- | :--- | :--- |
| **Real-time InSAR Surface Deformation** | **UNAVAILABLE** | Non-Indian Sentinel-1 disabled. Indian repeat-pass SAR (NISAR / EOS-04 repeat-pass) will be enabled once operational. Weight is set to `0.0` and truthfully reported. |
| **Satellite Optical NDVI** | **UNAVAILABLE** | Non-Indian Sentinel-2 disabled. Indian Resourcesat-2A LISS-IV / AWiFS vegetation products can be attached; currently disabled with weight `0.0`. |
| **Physical IoT Borehole Piezometers** | **NOT CONNECTED** | Soil moisture relies strictly on ISRO Bhoonidhi EOS-04 satellite passes or verified district field sensors; no default fallback. |
| **Third-Party Dissemination SMS/CAP Gateways** | **RESTRICTED** | Live SMS dissemination requires government CDAC/NIC gateway credentials. Dispatches are logged in the audit ledger and transmitted via in-app push only. |

---

## 5. Audit Conclusion

Parvaah has been audited and migrated to **100% Indian sovereign primary data sources**. Non-Indian feeds (Open-Meteo, OpenStreetMap, Sentinel-1/2, USGS) have been completely removed and rejected. Missing observations are handled with truthful `UNAVAILABLE` states without synthetic or fallback fabrication.
