"""
Spatial export for Fusion/Risk model
Exports predictions as GeoTIFF rasters for operational use
"""

import logging
from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
try:
    import rasterio
    from rasterio.transform import Affine
    from rasterio.crs import CRS
    RASTERIO_AVAILABLE = True
except ImportError:
    rasterio = None
    Affine = None
    CRS = None
    RASTERIO_AVAILABLE = False

from .config import Config, MAPS_DIR


logger = logging.getLogger(__name__)


class SpatialExporter:
    """Exports predictions as georeferenced rasters"""

    def __init__(self, config: Config):
        """
        Initialize exporter

        Args:
            config: Configuration object
        """
        self.config = config

    def export_geotiff(
        self,
        array: np.ndarray,
        reference_raster_path: Path,
        output_path: Path,
        nodata_value: Optional[float] = None,
        dtype: str = "float32",
        description: str = ""
    ):
        """
        Export numpy array as GeoTIFF matching reference raster

        Args:
            array: 2D array to export
            reference_raster_path: Path to reference raster (for CRS and transform)
            output_path: Output GeoTIFF path
            nodata_value: NoData value
            dtype: Output data type
            description: Raster description
        """
        logger.info(f"Exporting GeoTIFF: {output_path.name}")
        if not RASTERIO_AVAILABLE:
            raise ImportError("rasterio is required to export GeoTIFF rasters. Install with: pip install rasterio")

        # Read reference metadata
        with rasterio.open(reference_raster_path) as ref:
            crs = ref.crs
            transform = ref.transform
            ref_shape = ref.shape

        # Validate shape
        if array.shape != ref_shape:
            raise ValueError(
                f"Array shape {array.shape} does not match reference {ref_shape}"
            )

        # Set NoData value
        if nodata_value is None:
            nodata_value = self.config.features.nodata_value

        # Prepare output directory
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write GeoTIFF
        with rasterio.open(
            output_path,
            'w',
            driver='GTiff',
            height=array.shape[0],
            width=array.shape[1],
            count=1,
            dtype=dtype,
            crs=crs,
            transform=transform,
            nodata=nodata_value,
            compress=self.config.spatial.compression
        ) as dst:
            dst.write(array.astype(dtype), 1)

            if description:
                dst.set_band_description(1, description)

            # Add metadata
            dst.update_tags(
                model_version=self.config.model_version,
                description=description
            )

        logger.info(f"Saved GeoTIFF: {output_path}")
        logger.info(f"  Shape: {array.shape}")
        logger.info(f"  CRS: {crs}")
        logger.info(f"  Resolution: {transform[0]:.2f}m")

    def export_risk_map(
        self,
        risk_scores: np.ndarray,
        reference_raster_path: Path,
        output_name: str = "fusion_risk_score_30m.tif"
    ) -> Path:
        """
        Export continuous risk scores as GeoTIFF

        Args:
            risk_scores: 2D array of risk scores (0-1)
            reference_raster_path: Reference raster for spatial metadata
            output_name: Output filename

        Returns:
            Path to saved GeoTIFF
        """
        output_path = MAPS_DIR / output_name

        self.export_geotiff(
            array=risk_scores,
            reference_raster_path=reference_raster_path,
            output_path=output_path,
            dtype="float32",
            description="Fusion/Risk landslide risk score (0-1)"
        )

        return output_path

    def export_confidence_map(
        self,
        confidence_scores: np.ndarray,
        reference_raster_path: Path,
        output_name: str = "fusion_risk_confidence_30m.tif"
    ) -> Path:
        """
        Export confidence scores as GeoTIFF

        Args:
            confidence_scores: 2D array of confidence scores (0-1)
            reference_raster_path: Reference raster for spatial metadata
            output_name: Output filename

        Returns:
            Path to saved GeoTIFF
        """
        output_path = MAPS_DIR / output_name

        self.export_geotiff(
            array=confidence_scores,
            reference_raster_path=reference_raster_path,
            output_path=output_path,
            dtype="float32",
            description="Fusion/Risk prediction confidence (0-1)"
        )

        return output_path

    def export_risk_classification(
        self,
        risk_levels: np.ndarray,
        reference_raster_path: Path,
        output_name: str = "fusion_risk_classification_30m.tif"
    ) -> Path:
        """
        Export classified risk levels as GeoTIFF

        Args:
            risk_levels: 2D array of risk levels (1-5)
            reference_raster_path: Reference raster for spatial metadata
            output_name: Output filename

        Returns:
            Path to saved GeoTIFF
        """
        output_path = MAPS_DIR / output_name

        self.export_geotiff(
            array=risk_levels,
            reference_raster_path=reference_raster_path,
            output_path=output_path,
            nodata_value=0,
            dtype="uint8",
            description="Fusion/Risk classification (1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High)"
        )

        return output_path

    def validate_output_raster(self, raster_path: Path) -> Dict:
        """
        Validate exported raster

        Args:
            raster_path: Path to raster to validate

        Returns:
            Validation results dictionary
        """
        logger.info(f"Validating output raster: {raster_path.name}")

        with rasterio.open(raster_path) as src:
            # Read array
            array = src.read(1)

            # Compute statistics
            nodata = src.nodata
            valid_mask = array != nodata

            if src.nodata is not None:
                valid_mask &= ~np.isclose(array, src.nodata)
                valid_mask &= ~np.isnan(array)

            n_valid = np.sum(valid_mask)
            n_nodata = np.sum(~valid_mask)

            results = {
                "path": str(raster_path),
                "shape": src.shape,
                "dtype": str(src.dtypes[0]),
                "crs": str(src.crs),
                "resolution": src.res,
                "bounds": src.bounds,
                "nodata": nodata,
                "n_valid_pixels": int(n_valid),
                "n_nodata_pixels": int(n_nodata),
                "valid_fraction": float(n_valid / array.size)
            }

            if n_valid > 0:
                valid_values = array[valid_mask]
                results["statistics"] = {
                    "min": float(np.min(valid_values)),
                    "max": float(np.max(valid_values)),
                    "mean": float(np.mean(valid_values)),
                    "median": float(np.median(valid_values)),
                    "std": float(np.std(valid_values))
                }

        logger.info(f"  Valid pixels: {results['n_valid_pixels']:,} ({results['valid_fraction']:.2%})")
        if "statistics" in results:
            logger.info(f"  Value range: [{results['statistics']['min']:.4f}, {results['statistics']['max']:.4f}]")

        return results
