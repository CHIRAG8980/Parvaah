"""
Feature engineering for Time-to-Failure (TTF) model.
Extracts real features from official IMD meteorological and CartoDEM terrain data.
"""
from __future__ import annotations

from datetime import timedelta
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from PIL import Image

from .config import DATA_PROCESSED

logger = logging.getLogger(__name__)

RAINFALL_DAILY_PATH = DATA_PROCESSED / "features" / "rainfall_districtwise_daily_imd.csv"
BANDS_DIR = DATA_PROCESSED / "features" / "individual_bands"


class FeatureBuilder:
    """Builds empirical meteorological, terrain, and spatial features for TTF modeling."""

    def __init__(self):
        self.features_created: list[str] = []
        self._rainfall_df: Optional[pd.DataFrame] = None
        self._raster_cache: dict[str, np.ndarray] = {}

    def _get_rainfall_data(self) -> pd.DataFrame:
        if self._rainfall_df is None:
            if not RAINFALL_DAILY_PATH.exists():
                raise FileNotFoundError(f"IMD rainfall data not found at {RAINFALL_DAILY_PATH}")
            df = pd.read_csv(RAINFALL_DAILY_PATH)
            df["Date"] = pd.to_datetime(df["Date"])
            self._rainfall_df = df
        return self._rainfall_df

    def _get_raster(self, band_name: str) -> np.ndarray:
        if band_name not in self._raster_cache:
            path = BANDS_DIR / f"{band_name}_30m.tif"
            if not path.exists():
                raise FileNotFoundError(f"Terrain raster not found at {path}")
            img = Image.open(path)
            self._raster_cache[band_name] = np.array(img, dtype=np.float32)
        return self._raster_cache[band_name]

    def add_spatial_features(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        result["lat_rounded"] = result["latitude"].round(3)
        result["lon_rounded"] = result["longitude"].round(3)

        shillong_lat, shillong_lon = 25.5788, 91.8933
        result["dist_from_shillong"] = np.sqrt(
            (result["latitude"] - shillong_lat) ** 2 +
            (result["longitude"] - shillong_lon) ** 2
        ) * 111.0

        for col in ["lat_rounded", "lon_rounded", "dist_from_shillong"]:
            if col not in self.features_created:
                self.features_created.append(col)
        return result

    def add_rainfall_features(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        rain_df = self._get_rainfall_data()
        ant_3d, ant_7d, ant_14d, cum_30d = [], [], [], []

        for _, row in result.iterrows():
            event_date = pd.to_datetime(row["event_date"])
            district = row.get("district", "East Khasi Hills")
            if pd.isna(district) or district not in rain_df["District"].values:
                district = "East Khasi Hills"

            dist_rain = rain_df[rain_df["District"] == district]
            r3 = dist_rain[(dist_rain["Date"] < event_date) & (dist_rain["Date"] >= event_date - timedelta(days=3))]["Daily Actual"].sum()
            r7 = dist_rain[(dist_rain["Date"] < event_date) & (dist_rain["Date"] >= event_date - timedelta(days=7))]["Daily Actual"].sum()
            r14 = dist_rain[(dist_rain["Date"] < event_date) & (dist_rain["Date"] >= event_date - timedelta(days=14))]["Daily Actual"].sum()
            r30 = dist_rain[(dist_rain["Date"] < event_date) & (dist_rain["Date"] >= event_date - timedelta(days=30))]["Daily Actual"].sum()

            ant_3d.append(float(r3))
            ant_7d.append(float(r7))
            ant_14d.append(float(r14))
            cum_30d.append(float(r30))

        result["antecedent_3d"] = ant_3d
        result["antecedent_7d"] = ant_7d
        result["antecedent_14d"] = ant_14d
        result["cumulative_30d"] = cum_30d

        for col in ["antecedent_3d", "antecedent_7d", "antecedent_14d", "cumulative_30d"]:
            if col not in self.features_created:
                self.features_created.append(col)
        return result

    def add_terrain_features(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        slope_arr = self._get_raster("slope")
        elev_arr = self._get_raster("elevation")
        aspect_arr = self._get_raster("aspect")
        curv_arr = self._get_raster("curvature")

        slopes, elevations, aspects, curvatures = [], [], [], []
        for _, row in result.iterrows():
            row_idx = int(np.clip((26.0 - row["latitude"]) * 3600, 0, 3599))
            col_idx = int(np.clip((row["longitude"] - 91.0) * 3600, 0, 3599))

            slopes.append(float(slope_arr[row_idx, col_idx]))
            elevations.append(float(elev_arr[row_idx, col_idx]))
            aspects.append(float(aspect_arr[row_idx, col_idx]))
            curvatures.append(float(curv_arr[row_idx, col_idx]))

        result["slope"] = slopes
        result["elevation"] = elevations
        result["aspect"] = aspects
        result["curvature"] = curvatures

        for col in ["slope", "elevation", "aspect", "curvature"]:
            if col not in self.features_created:
                self.features_created.append(col)
        return result

    def build_all_features(
        self,
        df: pd.DataFrame,
        use_spatial: bool = True,
        use_rainfall: bool = True,
        use_terrain: bool = True,
    ) -> pd.DataFrame:
        result = df.copy()
        if use_spatial:
            result = self.add_spatial_features(result)
        if use_rainfall and "event_date" in result.columns:
            result = self.add_rainfall_features(result)
        if use_terrain and "latitude" in result.columns and "longitude" in result.columns:
            result = self.add_terrain_features(result)

        logger.info(f"Built {len(self.features_created)} real features: {self.features_created}")
        return result


def load_and_merge_external_features(
    df: pd.DataFrame,
    rainfall_data_path: Optional[Path] = None,
    terrain_data_path: Optional[Path] = None,
) -> pd.DataFrame:
    builder = FeatureBuilder()
    return builder.build_all_features(df, use_spatial=True, use_rainfall=True, use_terrain=True)
