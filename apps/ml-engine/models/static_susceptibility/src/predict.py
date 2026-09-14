"""Spatial Susceptibility Map Generator for Meghalaya AOI with strict NoData preservation"""

from pathlib import Path
import numpy as np
import rasterio

try:
    from .config import SusceptibilityConfig, FEATURES_DIR, OUTPUT_DIR
except ImportError:
    from config import SusceptibilityConfig, FEATURES_DIR, OUTPUT_DIR


def generate_susceptibility_raster(model, config: SusceptibilityConfig = None):
    """Predict spatial susceptibility across the grid while strictly preserving NoData masks."""
    config = config or SusceptibilityConfig()
    output_path = config.output_raster_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating full 30m spatial susceptibility raster with strict NoData masking...")
    band_arrays = []
    ref_profile = None
    overall_valid_mask = None

    for rname in config.feature_raster_names:
        rpath = FEATURES_DIR / rname
        with rasterio.open(rpath) as src:
            if ref_profile is None:
                ref_profile = src.profile.copy()
            data = src.read(1).astype(np.float32)
            
            # Mask invalid pixels
            nan_mask = np.isnan(data)
            if src.nodata is not None:
                nan_mask |= np.isclose(data, src.nodata)
            
            if overall_valid_mask is None:
                overall_valid_mask = (~nan_mask)
            else:
                overall_valid_mask &= (~nan_mask)

            band_arrays.append(data)

    height, width = band_arrays[0].shape
    n_features = len(band_arrays)

    # Output map initialized to NaN (nodata)
    susceptibility_map = np.full((height, width), np.nan, dtype=np.float32)

    valid_indices = np.where(overall_valid_mask)
    if len(valid_indices[0]) > 0:
        # Extract only valid pixels across all 10 bands
        valid_stacked = np.column_stack([band[valid_indices] for band in band_arrays])

        # Predict in chunks
        chunk_size = 500000
        probs_all = np.zeros(valid_stacked.shape[0], dtype=np.float32)

        for i in range(0, valid_stacked.shape[0], chunk_size):
            chunk = valid_stacked[i:i + chunk_size]
            probs_all[i:i + chunk_size] = model.predict_proba(chunk)[:, 1].astype(np.float32)

        susceptibility_map[valid_indices] = probs_all

    ref_profile.update(
        dtype="float32",
        count=1,
        nodata=np.nan,
        compress="lzw"
    )

    with rasterio.open(output_path, "w", **ref_profile) as dst:
        dst.write(susceptibility_map, 1)
        dst.update_tags(
            title="Static Landslide Susceptibility Index (0-1)",
            model_type=model.model_type,
            features=",".join(config.feature_names),
            nodata_preservation="Strict - no median imputation"
        )

    valid_count = int(np.sum(~np.isnan(susceptibility_map)))
    total_count = susceptibility_map.size
    print(f"  Exported susceptibility raster to: {output_path}")
    print(f"  Valid pixels: {valid_count:,} / {total_count:,} ({valid_count/total_count*100:.2f}%)")
    print(f"  Raster stats: min={np.nanmin(susceptibility_map):.4f}, max={np.nanmax(susceptibility_map):.4f}, mean={np.nanmean(susceptibility_map):.4f}")
    return output_path
