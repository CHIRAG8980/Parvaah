"""
Feature builder for Fusion/Risk model
Constructs feature matrix from spatial rasters for model training
"""

import logging
from typing import Dict, Tuple, List, Optional
import numpy as np
from sklearn.model_selection import train_test_split

from .config import Config
from .utils import compute_class_weights


logger = logging.getLogger(__name__)


class FeatureBuilder:
    """Builds feature matrix from raster arrays"""

    def __init__(self, config: Config):
        """
        Initialize feature builder

        Args:
            config: Configuration object
        """
        self.config = config
        self.nodata_value = config.features.nodata_value

    def rasters_to_feature_matrix(
        self,
        feature_arrays: Dict[str, np.ndarray]
    ) -> Tuple[np.ndarray, List[str], np.ndarray]:
        """
        Convert raster arrays to feature matrix

        Args:
            feature_arrays: Dictionary of feature name -> 2D array

        Returns:
            (feature_matrix, feature_names, valid_mask)
        """
        logger.info("Converting rasters to feature matrix...")

        # Get shape from first array
        reference_shape = next(iter(feature_arrays.values())).shape
        n_pixels = reference_shape[0] * reference_shape[1]

        # Sort feature names for consistency
        feature_names = sorted(feature_arrays.keys())
        n_features = len(feature_names)

        logger.info(f"Building matrix: {n_pixels} pixels × {n_features} features")

        # Initialize feature matrix
        X = np.zeros((n_pixels, n_features), dtype=np.float32)

        # Fill feature matrix
        for i, name in enumerate(feature_names):
            array = feature_arrays[name]
            X[:, i] = array.ravel()

        # Create valid pixel mask (no NoData in any feature)
        valid_mask = np.ones(n_pixels, dtype=bool)

        for i in range(n_features):
            is_invalid = (
                np.isclose(X[:, i], self.nodata_value) |
                np.isnan(X[:, i]) |
                np.isinf(X[:, i])
            )
            valid_mask &= ~is_invalid

        n_valid = np.sum(valid_mask)
        valid_fraction = n_valid / n_pixels

        logger.info(f"Valid pixels: {n_valid:,} ({valid_fraction:.2%})")

        return X, feature_names, valid_mask

    def create_training_labels(
        self,
        pixel_coords: np.ndarray,
        raster_shape: Tuple[int, int]
    ) -> np.ndarray:
        """
        Create binary labels for training

        Args:
            pixel_coords: Array of (row, col) landslide pixel coordinates
            raster_shape: Shape of raster (height, width)

        Returns:
            1D array of binary labels (1=landslide, 0=no landslide)
        """
        logger.info("Creating training labels...")

        n_pixels = raster_shape[0] * raster_shape[1]
        labels = np.zeros(n_pixels, dtype=np.int32)

        # Mark landslide pixels
        for row, col in pixel_coords:
            pixel_idx = row * raster_shape[1] + col
            if pixel_idx < n_pixels:
                labels[pixel_idx] = 1

        n_positive = np.sum(labels)
        logger.info(f"Positive samples (landslides): {n_positive:,}")
        logger.info(f"Negative samples: {n_pixels - n_positive:,}")
        logger.info(f"Class balance: {n_positive / n_pixels:.4%}")

        return labels

    def sample_training_data(
        self,
        X: np.ndarray,
        y: np.ndarray,
        valid_mask: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Sample training data with negative sampling

        Args:
            X: Feature matrix
            y: Labels
            valid_mask: Valid pixel mask

        Returns:
            (X_sampled, y_sampled, sampled_indices)
        """
        logger.info("Sampling training data...")

        # Get valid pixels
        valid_indices = np.where(valid_mask)[0]
        X_valid = X[valid_mask]
        y_valid = y[valid_mask]

        # Separate positive and negative samples
        positive_indices = np.where(y_valid == 1)[0]
        negative_indices = np.where(y_valid == 0)[0]

        n_positive = len(positive_indices)
        n_negative = len(negative_indices)

        logger.info(f"Valid positive samples: {n_positive}")
        logger.info(f"Valid negative samples: {n_negative}")

        # Keep all positive samples
        sampled_positive = positive_indices

        # Sample negatives
        n_negative_sample = int(
            n_positive * self.config.data.negative_sampling_ratio
        )
        n_negative_sample = min(n_negative_sample, n_negative)

        sampled_negative = np.random.choice(
            negative_indices,
            size=n_negative_sample,
            replace=False
        )

        # Combine samples
        sampled_indices = np.concatenate([sampled_positive, sampled_negative])
        np.random.shuffle(sampled_indices)

        X_sampled = X_valid[sampled_indices]
        y_sampled = y_valid[sampled_indices]

        # Map back to original indices
        original_sampled_indices = valid_indices[sampled_indices]

        logger.info(f"Sampled dataset: {len(X_sampled):,} samples")
        logger.info(f"  Positive: {np.sum(y_sampled == 1):,}")
        logger.info(f"  Negative: {np.sum(y_sampled == 0):,}")

        return X_sampled, y_sampled, original_sampled_indices

    def split_train_val_test(
        self,
        X: np.ndarray,
        y: np.ndarray,
        sampled_indices: Optional[np.ndarray] = None,
        reference_width: Optional[int] = None,
        block_size: int = 100
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Split data into train/val/test sets using spatial block splitting if coordinates are provided,
        or standard stratified split.

        Args:
            X: Feature matrix
            y: Labels
            sampled_indices: 1D flat pixel indices in raster for spatial grouping
            reference_width: Width of raster for (row, col) reconstruction
            block_size: Size of spatial block in pixels (e.g. 100 pixels = 3km)

        Returns:
            (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        if sampled_indices is not None and reference_width is not None:
            logger.info("Using spatial block partitioning to prevent spatial autocorrelation leakage...")
            pixel_rows = sampled_indices // reference_width
            pixel_cols = sampled_indices % reference_width
            block_rows = pixel_rows // block_size
            block_cols = pixel_cols // block_size
            block_ids = block_rows * 10000 + block_cols

            unique_blocks = np.unique(block_ids)
            rng = np.random.default_rng(self.config.data.random_seed)
            rng.shuffle(unique_blocks)

            n_test_blocks = int(len(unique_blocks) * self.config.data.test_ratio)
            n_val_blocks = int(len(unique_blocks) * self.config.data.val_ratio)

            test_blocks = set(unique_blocks[:n_test_blocks])
            val_blocks = set(unique_blocks[n_test_blocks:n_test_blocks + n_val_blocks])
            train_blocks = set(unique_blocks[n_test_blocks + n_val_blocks:])

            train_mask = np.isin(block_ids, list(train_blocks))
            val_mask = np.isin(block_ids, list(val_blocks))
            test_mask = np.isin(block_ids, list(test_blocks))

            X_train, y_train = X[train_mask], y[train_mask]
            X_val, y_val = X[val_mask], y[val_mask]
            X_test, y_test = X[test_mask], y[test_mask]

            # Fallback if any set is empty
            if len(X_train) == 0 or len(X_val) == 0 or len(X_test) == 0:
                logger.warning("Spatial block partitioning produced empty split; falling back to stratified split")
            else:
                logger.info(f"Spatial Train: {len(X_train):,} samples (Pos: {np.sum(y_train == 1):,})")
                logger.info(f"Spatial Val: {len(X_val):,} samples (Pos: {np.sum(y_val == 1):,})")
                logger.info(f"Spatial Test: {len(X_test):,} samples (Pos: {np.sum(y_test == 1):,})")
                return X_train, X_val, X_test, y_train, y_val, y_test

        logger.info("Splitting into train/val/test sets using stratified sampling...")

        # First split: train+val vs test
        X_trainval, X_test, y_trainval, y_test = train_test_split(
            X, y,
            test_size=self.config.data.test_ratio,
            random_state=self.config.data.random_seed,
            stratify=y
        )

        # Second split: train vs val
        val_ratio_adjusted = self.config.data.val_ratio / (
            self.config.data.train_ratio + self.config.data.val_ratio
        )

        X_train, X_val, y_train, y_val = train_test_split(
            X_trainval, y_trainval,
            test_size=val_ratio_adjusted,
            random_state=self.config.data.random_seed,
            stratify=y_trainval
        )

        logger.info(f"Train: {len(X_train):,} samples (Pos: {np.sum(y_train == 1):,})")
        logger.info(f"Validation: {len(X_val):,} samples (Pos: {np.sum(y_val == 1):,})")
        logger.info(f"Test: {len(X_test):,} samples (Pos: {np.sum(y_test == 1):,})")

        return X_train, X_val, X_test, y_train, y_val, y_test

    def compute_class_weights_from_labels(self, y: np.ndarray) -> Dict[int, float]:
        """
        Compute class weights for training

        Args:
            y: Labels

        Returns:
            Dictionary of class weights
        """
        weights = compute_class_weights(y)

        logger.info("Computed class weights:")
        for cls, weight in weights.items():
            logger.info(f"  Class {cls}: {weight:.4f}")

        return weights

    def get_feature_groups(self, feature_names: List[str]) -> Dict[str, List[int]]:
        """
        Group features by category for analysis

        Args:
            feature_names: List of feature names

        Returns:
            Dictionary mapping group name to feature indices
        """
        groups = {
            "fusion": [],
            "topographic": [],
            "rainfall": [],
            "vegetation": [],
            "sar": [],
            "geological": [],
            "infrastructure": []
        }

        for i, name in enumerate(feature_names):
            if "susceptibility" in name or "hazard" in name:
                groups["fusion"].append(i)
            elif any(x in name for x in ["elevation", "slope", "aspect", "curvature"]):
                groups["topographic"].append(i)
            elif "rainfall" in name or "rain" in name:
                groups["rainfall"].append(i)
            elif "ndvi" in name:
                groups["vegetation"].append(i)
            elif "sar" in name:
                groups["sar"].append(i)
            elif any(x in name for x in ["geomorphology", "lineament", "lulc"]):
                groups["geological"].append(i)
            elif "distance" in name or "road" in name or "settlement" in name:
                groups["infrastructure"].append(i)

        # Log group sizes
        logger.info("Feature groups:")
        for group_name, indices in groups.items():
            if indices:
                logger.info(f"  {group_name}: {len(indices)} features")

        return groups
