"""Data loader with spatial block partitioning and strict NoData handling for Static Susceptibility"""

from pathlib import Path
from typing import Tuple, List, Dict
import numpy as np
import pandas as pd
import rasterio
from scipy.spatial import cKDTree

try:
    from .config import SusceptibilityConfig, FEATURES_DIR, GROUND_TRUTH_CSV
except ImportError:
    from config import SusceptibilityConfig, FEATURES_DIR, GROUND_TRUTH_CSV


class SusceptibilityDataLoader:
    """Loads ground truth inventory, samples static rasters, and performs spatial block partitioning."""

    def __init__(self, config: SusceptibilityConfig = None):
        self.config = config or SusceptibilityConfig()
        self._raster_handles = {}

    def _open_rasters(self):
        if not self._raster_handles:
            for rname in self.config.feature_raster_names:
                rpath = FEATURES_DIR / rname
                if not rpath.exists():
                    raise FileNotFoundError(f"Static feature raster not found: {rpath}")
                self._raster_handles[rname] = rasterio.open(rpath)

    def close(self):
        for src in self._raster_handles.values():
            src.close()
        self._raster_handles.clear()

    def load_positive_points(self) -> pd.DataFrame:
        """Load verified landslide locations from ground truth CSV."""
        if not GROUND_TRUTH_CSV.exists():
            raise FileNotFoundError(f"Ground truth inventory missing: {GROUND_TRUTH_CSV}")

        df = pd.read_csv(GROUND_TRUTH_CSV)
        if "latitude" not in df.columns or "longitude" not in df.columns:
            raise ValueError("Ground truth CSV must contain 'latitude' and 'longitude' columns")

        pos_df = df[["longitude", "latitude"]].dropna().drop_duplicates()
        pos_df["label"] = 1
        return pos_df

    def sample_negative_points(self, pos_df: pd.DataFrame) -> pd.DataFrame:
        """Generate non-landslide background points with spatial buffer away from positives."""
        np.random.seed(self.config.random_seed)
        n_pos = len(pos_df)
        n_neg = int(n_pos * self.config.negative_ratio)

        self._open_rasters()
        ref_src = list(self._raster_handles.values())[0]
        bounds = ref_src.bounds

        pos_coords = pos_df[["longitude", "latitude"]].values
        tree = cKDTree(pos_coords)

        neg_coords = []
        max_attempts = n_neg * 30
        attempts = 0

        while len(neg_coords) < n_neg and attempts < max_attempts:
            batch_size = (n_neg - len(neg_coords)) * 2
            candidate_lons = np.random.uniform(bounds.left + 0.05, bounds.right - 0.05, batch_size)
            candidate_lats = np.random.uniform(bounds.bottom + 0.05, bounds.top - 0.05, batch_size)
            candidates = np.column_stack([candidate_lons, candidate_lats])

            dists, _ = tree.query(candidates, k=1)
            valid = candidates[dists >= self.config.buffer_distance_deg]

            for pt in valid:
                if len(neg_coords) < n_neg:
                    neg_coords.append(pt)
                else:
                    break
            attempts += batch_size

        neg_arr = np.array(neg_coords)
        neg_df = pd.DataFrame({"longitude": neg_arr[:, 0], "latitude": neg_arr[:, 1], "label": 0})
        return neg_df

    def extract_raster_features(self, points_df: pd.DataFrame) -> pd.DataFrame:
        """Sample all 10 raster features. Strictly drops points with NoData/NaN (no median imputation)."""
        self._open_rasters()
        coords = [(row["longitude"], row["latitude"]) for _, row in points_df.iterrows()]

        feature_dict = {
            "longitude": points_df["longitude"].values,
            "latitude": points_df["latitude"].values,
            "label": points_df["label"].values
        }

        valid_mask = np.ones(len(points_df), dtype=bool)

        for rname, fname in zip(self.config.feature_raster_names, self.config.feature_names):
            src = self._raster_handles[rname]
            sampled = np.array([val[0] for val in src.sample(coords)], dtype=np.float32)
            
            # Check nodata and NaNs
            nan_mask = np.isnan(sampled)
            if src.nodata is not None:
                nan_mask |= np.isclose(sampled, src.nodata)
            
            valid_mask &= (~nan_mask)
            feature_dict[fname] = sampled

        df = pd.DataFrame(feature_dict)
        # Strictly keep only valid observations where all 10 features exist
        clean_df = df[valid_mask].reset_index(drop=True)
        return clean_df

    def assign_spatial_blocks(self, df: pd.DataFrame, block_size_deg: float = 0.20) -> pd.DataFrame:
        """Assign each point to a geographic spatial block based on coordinates."""
        min_lon, min_lat = 91.0, 25.0
        df = df.copy()
        df["block_x"] = ((df["longitude"] - min_lon) / block_size_deg).astype(int)
        df["block_y"] = ((df["latitude"] - min_lat) / block_size_deg).astype(int)
        df["spatial_block_id"] = df["block_x"].astype(str) + "_" + df["block_y"].astype(str)
        return df

    def spatial_block_split(self, df: pd.DataFrame, block_size_deg: float = 0.20) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split dataset into Train, Validation, and Test sets by assigning entire spatial blocks.
        Guarantees that points within the same geographic block never appear across splits.
        """
        df_blocked = self.assign_spatial_blocks(df, block_size_deg)
        unique_blocks = df_blocked["spatial_block_id"].unique()
        
        # Deterministic shuffle of blocks
        np.random.seed(self.config.random_seed)
        shuffled_blocks = np.random.permutation(unique_blocks)

        n_blocks = len(shuffled_blocks)
        n_test_blocks = max(1, int(n_blocks * self.config.test_size))
        n_val_blocks = max(1, int(n_blocks * self.config.val_size))

        test_blocks = set(shuffled_blocks[:n_test_blocks])
        val_blocks = set(shuffled_blocks[n_test_blocks:n_test_blocks + n_val_blocks])
        train_blocks = set(shuffled_blocks[n_test_blocks + n_val_blocks:])

        train_df = df_blocked[df_blocked["spatial_block_id"].isin(train_blocks)].copy()
        val_df = df_blocked[df_blocked["spatial_block_id"].isin(val_blocks)].copy()
        test_df = df_blocked[df_blocked["spatial_block_id"].isin(test_blocks)].copy()

        return (
            train_df.reset_index(drop=True),
            val_df.reset_index(drop=True),
            test_df.reset_index(drop=True)
        )

    def prepare_dataset(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Construct clean dataset with NoData filtered and partition by spatial blocks."""
        pos_df = self.load_positive_points()
        neg_df = self.sample_negative_points(pos_df)
        all_pts = pd.concat([pos_df, neg_df], ignore_index=True)

        full_df = self.extract_raster_features(all_pts)
        return self.spatial_block_split(full_df, block_size_deg=0.20)
