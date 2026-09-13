"""
Ground truth landslide data loading and spatial coordinate mapping.
"""
import logging
from pathlib import Path
from typing import Tuple, Any, Optional
import numpy as np
import pandas as pd

from .config import Config, LANDSLIDES_INVENTORY

logger = logging.getLogger(__name__)


class GroundTruthLoader:
    """Loads ground truth landslide data and converts to raster pixel coordinates."""

    def __init__(self, config: Config):
        self.config = config

    def load_landslides(
        self,
        landslide_file: Path = LANDSLIDES_INVENTORY
    ) -> pd.DataFrame:
        """Load and filter landslide inventory."""
        if not landslide_file.exists():
            raise FileNotFoundError(f"Landslide file not found: {landslide_file}")

        df = pd.read_csv(landslide_file)
        logger.info(f"Loaded {len(df)} landslides from {landslide_file.name}")

        required_cols = ["latitude", "longitude"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        df = df.drop_duplicates(subset=["latitude", "longitude"])
        df = df[
            (df["longitude"] >= self.config.data.min_lon) &
            (df["longitude"] <= self.config.data.max_lon) &
            (df["latitude"] >= self.config.data.min_lat) &
            (df["latitude"] <= self.config.data.max_lat)
        ]
        logger.info(f"After spatial filtering: {len(df)} landslides")
        return df

    def landslides_to_pixel_coords(
        self,
        df: pd.DataFrame,
        transform: Any,
        shape: Tuple[int, int],
        raster_crs: Optional[str] = None
    ) -> np.ndarray:
        """Convert landslide lat/lon to pixel coordinates."""
        coords = []

        # If transform is Affine or has affine structure
        if hasattr(transform, '__invert__'):
            inv = ~transform
            for _, row in df.iterrows():
                lon, lat = float(row["longitude"]), float(row["latitude"])
                c, r = inv * (lon, lat)
                pr, pc = int(round(r)), int(round(c))
                if 0 <= pr < shape[0] and 0 <= pc < shape[1]:
                    coords.append((pr, pc))
        elif isinstance(transform, (tuple, list)) and len(transform) >= 6:
            # Affine tuple: (x0, dx, rot_x, y0, rot_y, dy)
            x0, dx, _, y0, _, dy = transform[:6]
            for _, row in df.iterrows():
                lon, lat = float(row["longitude"]), float(row["latitude"])
                pc = int(round((lon - x0) / dx))
                pr = int(round((lat - y0) / dy))
                if 0 <= pr < shape[0] and 0 <= pc < shape[1]:
                    coords.append((pr, pc))
        else:
            # Fallback coordinate normalization using config bounds
            lat_span = self.config.data.max_lat - self.config.data.min_lat
            lon_span = self.config.data.max_lon - self.config.data.min_lon
            for _, row in df.iterrows():
                lon, lat = float(row["longitude"]), float(row["latitude"])
                pr = int(round((self.config.data.max_lat - lat) / lat_span * (shape[0] - 1)))
                pc = int(round((lon - self.config.data.min_lon) / lon_span * (shape[1] - 1)))
                if 0 <= pr < shape[0] and 0 <= pc < shape[1]:
                    coords.append((pr, pc))

        coords_arr = np.array(coords, dtype=np.int32)
        logger.info(f"Converted {len(coords_arr)} landslides to pixel coordinates")
        return coords_arr
