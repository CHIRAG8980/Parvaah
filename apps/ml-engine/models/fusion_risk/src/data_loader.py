"""
Data loading for Fusion/Risk model.
Loads and validates spatial raster data and coordinates.
"""
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any
import numpy as np
from PIL import Image

try:
    import rasterio
    RASTERIO_AVAILABLE = True
except ImportError:
    rasterio = None
    RASTERIO_AVAILABLE = False

from .config import Config, FEATURES_DIR, STATIC_SUSCEPTIBILITY, PROCESSED_DATA
from .validation import SpatialValidator, DataQualityValidator
from .ground_truth_loader import GroundTruthLoader

logger = logging.getLogger(__name__)


class RasterLoader:
    """Loads and validates raster datasets."""

    def __init__(self, config: Config):
        self.config = config
        self.features_dir = FEATURES_DIR
        self.nodata_value = config.features.nodata_value

    def load_raster(self, raster_path: Path, band: int = 1) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Load a single raster band using rasterio or native PIL TIFF reader."""
        if not raster_path.exists():
            raise FileNotFoundError(f"Raster not found: {raster_path}")

        if RASTERIO_AVAILABLE:
            with rasterio.open(raster_path) as src:
                array = src.read(band).astype(np.float32)
                metadata = {
                    "path": str(raster_path),
                    "crs": str(src.crs),
                    "transform": src.transform,
                    "shape": src.shape,
                    "bounds": src.bounds,
                    "resolution": src.res,
                    "dtype": str(array.dtype),
                    "nodata": src.nodata
                }
                if src.nodata is not None:
                    array = np.where(np.isclose(array, src.nodata), self.nodata_value, array)
        else:
            with Image.open(raster_path) as img:
                array = np.array(img, dtype=np.float32)
                scale = img.tag_v2.get(33550, (0.000277778, 0.000277778, 0.0))
                tie = img.tag_v2.get(33922, (0.0, 0.0, 0.0, 91.0, 26.0, 0.0))
                x0, y0 = tie[3], tie[4]
                dx, dy = scale[0], -scale[1]
                metadata = {
                    "path": str(raster_path),
                    "crs": "EPSG:4326",
                    "transform": (x0, dx, 0.0, y0, 0.0, dy),
                    "shape": array.shape,
                    "bounds": (x0, y0 + dy * array.shape[0], x0 + dx * array.shape[1], y0),
                    "resolution": (abs(dx), abs(dy)),
                    "dtype": str(array.dtype),
                    "nodata": self.nodata_value
                }

        logger.info(f"Loaded {raster_path.name}: shape={array.shape}")
        return array, metadata

    def load_feature_rasters(self, feature_files: List[str]) -> Tuple[Dict[str, np.ndarray], Dict[str, Dict]]:
        """Load multiple feature rasters without silently swallowing errors."""
        arrays = {}
        metadata = {}

        for filename in feature_files:
            raster_path = self.features_dir / filename
            if not raster_path.exists():
                raise FileNotFoundError(f"Feature raster file not found: {raster_path}")

            feature_name = filename.replace("_30m.tif", "").replace(".tif", "")
            array, meta = self.load_raster(raster_path)
            arrays[feature_name] = array
            metadata[feature_name] = meta

            validator = DataQualityValidator()
            is_valid, stats = validator.validate_array(
                array, feature_name, self.nodata_value, self.config.data.max_nodata_fraction
            )
            if not is_valid:
                logger.warning(f"Quality issues in {feature_name}: {stats.get('errors', [])}")

        logger.info(f"Loaded {len(arrays)} feature rasters")
        return arrays, metadata

    def get_reference_metadata(self, raster_path: Path) -> Dict[str, Any]:
        """Get metadata from reference raster."""
        _, meta = self.load_raster(raster_path)
        return meta


class DataLoader:
    """Main data loader for Fusion/Risk model."""

    def __init__(self, config: Config):
        self.config = config
        self.raster_loader = RasterLoader(config)
        self.gt_loader = GroundTruthLoader(config)

    def load_all_features(self) -> Tuple[Dict[str, np.ndarray], Dict[str, Dict]]:
        """Load all feature rasters, raising errors for missing files."""
        all_features = []
        if self.config.features.use_static_susceptibility:
            all_features.append("static_susceptibility_map_30m.tif")
        if self.config.features.use_dynamic_hazard:
            all_features.append("dynamic_hazard_alert_DOY235.tif")

        all_features.extend(self.config.features.topographic_features)
        all_features.extend(self.config.features.rainfall_features)
        all_features.extend(self.config.features.vegetation_features)
        all_features.extend(self.config.features.sar_features)
        all_features.extend(self.config.features.geological_features)
        all_features.extend(self.config.features.infrastructure_features)

        arrays = {}
        metadata = {}
        for filename in all_features:
            if filename in ["static_susceptibility_map_30m.tif", "dynamic_hazard_alert_DOY235.tif"]:
                raster_path = PROCESSED_DATA / "outputs" / filename
            else:
                raster_path = FEATURES_DIR / filename

            if not raster_path.exists():
                raise FileNotFoundError(f"Feature raster {filename} not found at {raster_path}")

            feature_name = filename.replace("_30m.tif", "").replace(".tif", "")
            array, meta = self.raster_loader.load_raster(raster_path)
            arrays[feature_name] = array
            metadata[feature_name] = meta

        logger.info(f"Successfully loaded {len(arrays)} features")
        return arrays, metadata

    def load_ground_truth(self) -> Tuple[Any, np.ndarray]:
        """Load ground truth landslides and map to pixel coords."""
        df = self.gt_loader.load_landslides()
        if not STATIC_SUSCEPTIBILITY.exists():
            raise FileNotFoundError(f"Reference raster not found: {STATIC_SUSCEPTIBILITY}")

        ref_meta = self.raster_loader.get_reference_metadata(STATIC_SUSCEPTIBILITY)
        pixel_coords = self.gt_loader.landslides_to_pixel_coords(
            df, ref_meta["transform"], ref_meta["shape"], raster_crs=ref_meta.get("crs")
        )
        return df, pixel_coords

    def validate_spatial_alignment(self, feature_arrays: Dict[str, np.ndarray]) -> bool:
        """Validate that all loaded features are spatially aligned."""
        if not STATIC_SUSCEPTIBILITY.exists():
            logger.error("Reference raster not found")
            return False

        validator = SpatialValidator(STATIC_SUSCEPTIBILITY)
        feature_paths = []
        for filename in feature_arrays.keys():
            if filename in ["static_susceptibility_map", "dynamic_hazard_alert_DOY235"]:
                path = PROCESSED_DATA / "outputs" / f"{filename}.tif"
            else:
                path = FEATURES_DIR / f"{filename}_30m.tif"
            if path.exists():
                feature_paths.append(path)

        all_valid, _ = validator.validate_all_rasters(feature_paths)
        return all_valid
