"""
Data quality and feature completeness validation for Fusion/Risk model.
"""
from typing import Dict, List, Tuple, Any
import logging
import numpy as np

from .spatial_validator import SpatialValidator

logger = logging.getLogger(__name__)


class DataQualityValidator:
    """Validates data quality, nodata bounds, and feature completeness."""

    @staticmethod
    def validate_array(
        array: np.ndarray,
        name: str,
        nodata_value: float = -9999.0,
        max_nodata_fraction: float = 0.3
    ) -> Tuple[bool, Dict[str, Any]]:
        """Validate single array quality and compute statistics."""
        stats: Dict[str, Any] = {
            "name": name,
            "shape": array.shape,
            "dtype": str(array.dtype),
            "total_pixels": array.size
        }
        is_nodata = np.isclose(array, nodata_value) | np.isnan(array) | np.isinf(array)
        nodata_count = int(np.sum(is_nodata))
        nodata_fraction = nodata_count / array.size

        stats["nodata_count"] = nodata_count
        stats["nodata_fraction"] = float(nodata_fraction)
        stats["valid_pixels"] = int(array.size - nodata_count)

        valid_data = array[~is_nodata]
        if len(valid_data) > 0:
            stats["min"] = float(np.min(valid_data))
            stats["max"] = float(np.max(valid_data))
            stats["mean"] = float(np.mean(valid_data))
            stats["median"] = float(np.median(valid_data))
            stats["std"] = float(np.std(valid_data))
        else:
            stats.update({"min": None, "max": None, "mean": None, "median": None, "std": None})

        is_valid = True
        errors: List[str] = []
        if nodata_fraction > max_nodata_fraction:
            is_valid = False
            errors.append(f"NoData fraction {nodata_fraction:.2%} exceeds max {max_nodata_fraction:.2%}")
        if len(valid_data) == 0:
            is_valid = False
            errors.append("No valid data found")

        stats["is_valid"] = is_valid
        stats["errors"] = errors
        return is_valid, stats

    @staticmethod
    def validate_feature_matrix(
        X: np.ndarray,
        feature_names: List[str],
        max_missing_fraction: float = 0.1
    ) -> Tuple[bool, Dict[str, Any]]:
        """Validate sample-feature matrix completeness."""
        n_samples, n_features = X.shape
        n_missing = int(np.sum(np.isnan(X) | np.isinf(X)))
        missing_fraction = n_missing / X.size

        feature_stats = []
        for i, name in enumerate(feature_names):
            col = X[:, i]
            valid_mask = ~(np.isnan(col) | np.isinf(col))
            n_valid = int(np.sum(valid_mask))
            if n_valid > 0:
                vals = col[valid_mask]
                feature_stats.append({
                    "name": name,
                    "n_valid": n_valid,
                    "n_missing": n_samples - n_valid,
                    "missing_fraction": float((n_samples - n_valid) / n_samples),
                    "min": float(np.min(vals)),
                    "max": float(np.max(vals)),
                    "mean": float(np.mean(vals)),
                    "std": float(np.std(vals))
                })
            else:
                feature_stats.append({
                    "name": name, "n_valid": 0, "n_missing": n_samples,
                    "missing_fraction": 1.0, "min": None, "max": None, "mean": None, "std": None
                })

        is_valid = missing_fraction <= max_missing_fraction
        errors = [f"Missing fraction {missing_fraction:.2%} exceeds max {max_missing_fraction:.2%}"] if not is_valid else []
        all_missing = [s["name"] for s in feature_stats if s["missing_fraction"] >= 1.0]
        if all_missing:
            is_valid = False
            errors.append(f"Features with all missing values: {', '.join(all_missing)}")

        return is_valid, {
            "shape": (n_samples, n_features),
            "n_samples": n_samples,
            "n_features": n_features,
            "feature_names": feature_names,
            "n_missing": n_missing,
            "missing_fraction": float(missing_fraction),
            "feature_stats": feature_stats,
            "is_valid": is_valid,
            "errors": errors
        }


def validate_ground_truth(
    landslide_coords: np.ndarray,
    bounds: Tuple[float, float, float, float]
) -> Tuple[bool, Dict[str, Any]]:
    """Validate ground truth coordinates fall within spatial extent."""
    left, bottom, right, top = bounds
    lons = landslide_coords[:, 0]
    lats = landslide_coords[:, 1]
    within = (lons >= left) & (lons <= right) & (lats >= bottom) & (lats <= top)
    n_within = int(np.sum(within))
    n_outside = len(landslide_coords) - n_within
    return n_within > 0, {
        "n_landslides": len(landslide_coords),
        "bounds": bounds,
        "n_within_bounds": n_within,
        "n_outside_bounds": n_outside,
        "is_valid": n_within > 0
    }
