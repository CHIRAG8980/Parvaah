#!/usr/bin/env python3
"""
Extract Meghalaya AOI from raw NISAR GUNW Level-2 HDF5 files.
Preserves official CRS EPSG:32645, 80m spatial resolution, and NaN nodata values.
Exports:
  - RH losDeformation (meters)
  - RH coherenceMagnitude (dimensionless [0, 1])
Outputs GeoTIFFs and metadata JSON to apps/ml-engine/data/processed/features/NISAR/
"""

import os
import glob
import json
from pathlib import Path
import h5py
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.warp import transform_bounds

PROJECT_ROOT = Path(__file__).resolve().parents[3]
RAW_NISAR_DIR = PROJECT_ROOT / "apps" / "ml-engine" / "data" / "raw" / "NISAR"
OUTPUT_DIR = PROJECT_ROOT / "apps" / "ml-engine" / "data" / "processed" / "features" / "NISAR"

# Meghalaya AOI in WGS84
# Lon: 89.8°E to 92.8°E, Lat: 25.0°N to 26.15°N
MEGHALAYA_WGS84_BBOX = (89.8, 25.0, 92.8, 26.15)
TARGET_CRS = "EPSG:32645"
TARGET_RES = 80.0


def extract_nisar_pair():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_files = sorted(RAW_NISAR_DIR.glob("*.h5"))
    if not raw_files:
        raise FileNotFoundError(f"No .h5 files found in {RAW_NISAR_DIR}")

    # Compute Meghalaya bounding box in target CRS (EPSG:32645)
    meghalaya_utm_bbox = transform_bounds("EPSG:4326", TARGET_CRS, *MEGHALAYA_WGS84_BBOX)
    utm_min_x, utm_min_y, utm_max_x, utm_max_y = meghalaya_utm_bbox

    print(f"Meghalaya WGS84 AOI: {MEGHALAYA_WGS84_BBOX}")
    print(f"Meghalaya UTM 45N AOI: {meghalaya_utm_bbox}")
    print(f"Found {len(raw_files)} NISAR GUNW file(s) to process.")

    metadata_records = []

    for fpath in raw_files:
        print(f"\nProcessing {fpath.name}...")
        with h5py.File(fpath, "r") as h5:
            # Grid coordinates
            x_coords = h5["/science/SSAR/GUNW/grids/frequencyA/unwrappedInterferogram/xCoordinates"][:]
            y_coords = h5["/science/SSAR/GUNW/grids/frequencyA/unwrappedInterferogram/yCoordinates"][:]
            
            # Dates & Metadata
            ref_start_raw = h5["/science/SSAR/identification/referenceZeroDopplerStartTime"][()]
            sec_start_raw = h5["/science/SSAR/identification/secondaryZeroDopplerStartTime"][()]
            
            ref_str = ref_start_raw.decode("utf-8") if isinstance(ref_start_raw, bytes) else str(ref_start_raw)
            sec_str = sec_start_raw.decode("utf-8") if isinstance(sec_start_raw, bytes) else str(sec_start_raw)
            
            ref_date = ref_str[:10].replace("-", "")
            sec_date = sec_str[:10].replace("-", "")
            
            # Datasets
            los_dset = h5["/science/SSAR/GUNW/grids/frequencyA/unwrappedInterferogram/RH/losDeformation"]
            coh_dset = h5["/science/SSAR/GUNW/grids/frequencyA/unwrappedInterferogram/RH/coherenceMagnitude"]

            # Compute slice bounds for Meghalaya AOI
            # x is ascending, y is descending
            x_min_val = max(float(x_coords.min()), utm_min_x)
            x_max_val = min(float(x_coords.max()), utm_max_x)
            y_min_val = max(float(y_coords.min()), utm_min_y)
            y_max_val = min(float(y_coords.max()), utm_max_y)

            col_indices = np.where((x_coords >= x_min_val - TARGET_RES / 2) & (x_coords <= x_max_val + TARGET_RES / 2))[0]
            row_indices = np.where((y_coords >= y_min_val - TARGET_RES / 2) & (y_coords <= y_max_val + TARGET_RES / 2))[0]

            col_start, col_end = int(col_indices.min()), int(col_indices.max()) + 1
            row_start, row_end = int(row_indices.min()), int(row_indices.max()) + 1

            x_sub = x_coords[col_start:col_end]
            y_sub = y_coords[row_start:row_end]

            height = len(y_sub)
            width = len(x_sub)

            # Top-left corner coordinates for rasterio transform
            top_left_x = float(x_sub[0] - TARGET_RES / 2.0)
            top_left_y = float(y_sub[0] + TARGET_RES / 2.0)
            transform = from_origin(top_left_x, top_left_y, TARGET_RES, TARGET_RES)

            # Read subset arrays
            los_crop = los_dset[row_start:row_end, col_start:col_end].astype(np.float32)
            coh_crop = coh_dset[row_start:row_end, col_start:col_end].astype(np.float32)

            # Filenames
            los_tif_name = f"nisar_gunw_{ref_date}_{sec_date}_los_deformation_80m.tif"
            coh_tif_name = f"nisar_gunw_{ref_date}_{sec_date}_coherence_80m.tif"

            los_tif_path = OUTPUT_DIR / los_tif_name
            coh_tif_path = OUTPUT_DIR / coh_tif_name

            raster_profile = {
                "driver": "GTiff",
                "height": height,
                "width": width,
                "count": 1,
                "dtype": "float32",
                "crs": TARGET_CRS,
                "transform": transform,
                "nodata": np.nan,
                "compress": "deflate",
                "tiled": True,
                "blockxsize": 256,
                "blockysize": 256
            }

            # Write LOS deformation GeoTIFF
            with rasterio.open(los_tif_path, "w", **raster_profile) as dst:
                dst.write(los_crop, 1)
                dst.update_tags(
                    title="NISAR Level-2 GUNW Line-of-Sight Deformation",
                    units="meters",
                    polarization="RH",
                    reference_time=ref_str,
                    secondary_time=sec_str,
                    source_file=fpath.name
                )
            print(f"  Wrote: {los_tif_name} ({los_crop.shape[1]}x{los_crop.shape[0]})")

            # Write Coherence GeoTIFF
            with rasterio.open(coh_tif_path, "w", **raster_profile) as dst:
                dst.write(coh_crop, 1)
                dst.update_tags(
                    title="NISAR Level-2 GUNW Coherence Magnitude",
                    units="dimensionless",
                    range="0.0 to 1.0",
                    polarization="RH",
                    reference_time=ref_str,
                    secondary_time=sec_str,
                    source_file=fpath.name
                )
            print(f"  Wrote: {coh_tif_name} ({coh_crop.shape[1]}x{coh_crop.shape[0]})")

            # GeoTIFF extent in WGS84
            bounds_utm = (top_left_x, top_left_y - height * TARGET_RES, top_left_x + width * TARGET_RES, top_left_y)
            bounds_wgs84 = transform_bounds(TARGET_CRS, "EPSG:4326", *bounds_utm)

            valid_los = ~np.isnan(los_crop)
            valid_coh = ~np.isnan(coh_crop)

            metadata_records.append({
                "source_file": fpath.name,
                "reference_date": ref_str,
                "secondary_date": sec_str,
                "pair_tag": f"{ref_date}_{sec_date}",
                "crs": TARGET_CRS,
                "spatial_resolution_meters": TARGET_RES,
                "grid_dimensions": {"width": width, "height": height},
                "bounds_utm_45n": {
                    "min_x": float(bounds_utm[0]),
                    "min_y": float(bounds_utm[1]),
                    "max_x": float(bounds_utm[2]),
                    "max_y": float(bounds_utm[3])
                },
                "bounds_wgs84": {
                    "min_lon": float(bounds_wgs84[0]),
                    "min_lat": float(bounds_wgs84[1]),
                    "max_lon": float(bounds_wgs84[2]),
                    "max_lat": float(bounds_wgs84[3])
                },
                "layers": {
                    "los_deformation": {
                        "file": los_tif_name,
                        "relative_path": f"apps/ml-engine/data/processed/features/NISAR/{los_tif_name}",
                        "units": "meters",
                        "polarization": "RH",
                        "nodata": "NaN",
                        "valid_pixel_count": int(np.sum(valid_los)),
                        "total_pixel_count": int(los_crop.size),
                        "valid_coverage_percent": float(np.mean(valid_los) * 100.0),
                        "stats": {
                            "min_meters": float(np.nanmin(los_crop)) if np.any(valid_los) else None,
                            "max_meters": float(np.nanmax(los_crop)) if np.any(valid_los) else None,
                            "mean_meters": float(np.nanmean(los_crop)) if np.any(valid_los) else None,
                            "std_meters": float(np.nanstd(los_crop)) if np.any(valid_los) else None
                        }
                    },
                    "coherence_magnitude": {
                        "file": coh_tif_name,
                        "relative_path": f"apps/ml-engine/data/processed/features/NISAR/{coh_tif_name}",
                        "units": "dimensionless (0 to 1)",
                        "polarization": "RH",
                        "nodata": "NaN",
                        "valid_pixel_count": int(np.sum(valid_coh)),
                        "total_pixel_count": int(coh_crop.size),
                        "valid_coverage_percent": float(np.mean(valid_coh) * 100.0),
                        "stats": {
                            "min": float(np.nanmin(coh_crop)) if np.any(valid_coh) else None,
                            "max": float(np.nanmax(coh_crop)) if np.any(valid_coh) else None,
                            "mean": float(np.nanmean(coh_crop)) if np.any(valid_coh) else None,
                            "std": float(np.nanstd(coh_crop)) if np.any(valid_coh) else None
                        }
                    }
                }
            })

    # Save summary metadata JSON
    meta_path = OUTPUT_DIR / "nisar_gunw_processed_metadata.json"
    with open(meta_path, "w") as f:
        json.dump({
            "dataset_name": "NISAR Level-2 GUNW Interferometric Deformation & Coherence",
            "region_of_interest": "Meghalaya AOI",
            "instrument": "SSAR (S-band Synthetic Aperture Radar)",
            "processing_center": "ISRO / NASA-ISRO SAR Mission",
            "target_crs": TARGET_CRS,
            "resolution_meters": TARGET_RES,
            "processed_pairs_count": len(metadata_records),
            "pairs": metadata_records
        }, f, indent=2)
    print(f"\nSaved metadata JSON to: {meta_path}")

    return metadata_records


def validate_outputs():
    print("\n================ VALIDATION REPORT ================")
    tif_files = sorted(OUTPUT_DIR.glob("*.tif"))
    if not tif_files:
        raise FileNotFoundError("No GeoTIFFs found to validate.")

    for tif in tif_files:
        with rasterio.open(tif) as src:
            data = src.read(1)
            is_nan_nodata = np.isnan(src.nodata) if src.nodata is not None else False
            valid_mask = ~np.isnan(data)
            
            print(f"\nFile: {tif.name}")
            print(f"  CRS: {src.crs.to_string()} (is EPSG:32645: {src.crs.to_string() == 'EPSG:32645'})")
            print(f"  Shape: {src.height} rows x {src.width} cols")
            print(f"  Resolution: {src.res[0]:.1f}m x {src.res[1]:.1f}m")
            print(f"  Bounds (UTM 45N): {src.bounds}")
            print(f"  NoData: {src.nodata} (np.isnan: {is_nan_nodata})")
            print(f"  Valid pixels: {np.sum(valid_mask):,} / {data.size:,} ({np.mean(valid_mask)*100:.2f}%)")
            if np.any(valid_mask):
                print(f"  Min: {np.nanmin(data):.5f}, Max: {np.nanmax(data):.5f}, Mean: {np.nanmean(data):.5f}")
            print(f"  Tags: {src.tags()}")

            assert src.crs.to_string() == "EPSG:32645", f"CRS mismatch: {src.crs}"
            assert src.res == (80.0, 80.0), f"Resolution mismatch: {src.res}"
            assert src.height == 1370 and src.width == 2168, f"Unexpected dimension: ({src.height}, {src.width})"
            assert is_nan_nodata, "NoData is not NaN"

    print("\nAll GeoTIFFs validated successfully against all specifications.")


if __name__ == "__main__":
    extract_nisar_pair()
    validate_outputs()
