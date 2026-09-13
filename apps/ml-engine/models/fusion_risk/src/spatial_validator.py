"""
Spatial alignment validator for raster datasets.
Supports both rasterio and native PIL GeoTIFF tag inspection.
"""
from pathlib import Path
from typing import List, Tuple, Dict, Any
import logging
from PIL import Image

try:
    import rasterio
    RASTERIO_AVAILABLE = True
except ImportError:
    rasterio = None
    RASTERIO_AVAILABLE = False

from .utils import (
    validate_crs_match,
    validate_transform_match,
    validate_shape_match
)

logger = logging.getLogger(__name__)


class SpatialValidator:
    """Validates spatial alignment of raster datasets against reference grid."""

    def __init__(self, reference_raster: Path):
        self.reference_raster = reference_raster
        if not reference_raster.exists():
            raise FileNotFoundError(f"Reference raster not found: {reference_raster}")

        if RASTERIO_AVAILABLE:
            with rasterio.open(reference_raster) as src:
                self.ref_crs = src.crs
                self.ref_transform = src.transform
                self.ref_shape = src.shape
                self.ref_bounds = src.bounds
                self.ref_res = src.res
        else:
            with Image.open(reference_raster) as img:
                self.ref_crs = "EPSG:4326"
                self.ref_shape = (img.height, img.width)
                scale = img.tag_v2.get(33550, (0.000277778, 0.000277778, 0.0))
                tie = img.tag_v2.get(33922, (0.0, 0.0, 0.0, 91.0, 26.0, 0.0))
                self.ref_res = (scale[0], scale[1])
                self.ref_transform = (tie[3], scale[0], 0.0, tie[4], 0.0, -scale[1])
                self.ref_bounds = (tie[3], tie[4] - scale[1] * img.height, tie[3] + scale[0] * img.width, tie[4])

        logger.info(f"Reference raster: {reference_raster.name} shape={self.ref_shape} res={self.ref_res}")

    def validate_raster(self, raster_path: Path) -> Tuple[bool, List[str]]:
        """Validate a single raster against the reference grid."""
        errors: List[str] = []
        if not raster_path.exists():
            return False, [f"Raster not found: {raster_path}"]

        try:
            if RASTERIO_AVAILABLE:
                with rasterio.open(raster_path) as src:
                    if not validate_crs_match(src.crs, self.ref_crs):
                        errors.append(f"CRS mismatch: expected {self.ref_crs}, got {src.crs}")
                    if not validate_transform_match(src.transform, self.ref_transform):
                        errors.append(f"Transform mismatch: expected {self.ref_transform}, got {src.transform}")
                    if not validate_shape_match(src.shape, self.ref_shape):
                        errors.append(f"Shape mismatch: expected {self.ref_shape}, got {src.shape}")
                    if abs(src.res[0] - self.ref_res[0]) > 1e-6 or abs(src.res[1] - self.ref_res[1]) > 1e-6:
                        errors.append(f"Resolution mismatch: expected {self.ref_res}, got {src.res}")
            else:
                with Image.open(raster_path) as img:
                    shape = (img.height, img.width)
                    scale = img.tag_v2.get(33550, (0.000277778, 0.000277778, 0.0))
                    if not validate_shape_match(shape, self.ref_shape):
                        errors.append(f"Shape mismatch: expected {self.ref_shape}, got {shape}")
                    if abs(scale[0] - self.ref_res[0]) > 1e-6 or abs(scale[1] - self.ref_res[1]) > 1e-6:
                        errors.append(f"Resolution mismatch: expected {self.ref_res}, got {(scale[0], scale[1])}")
        except Exception as e:
            errors.append(f"Error reading raster: {e}")

        return len(errors) == 0, errors

    def validate_all_rasters(self, raster_paths: List[Path]) -> Tuple[bool, Dict[str, List[str]]]:
        """Validate multiple rasters against reference."""
        all_valid = True
        error_dict: Dict[str, List[str]] = {}
        for path in raster_paths:
            is_valid, errors = self.validate_raster(path)
            if not is_valid:
                all_valid = False
                error_dict[path.name] = errors
        return all_valid, error_dict
