"""
Prediction module for Fusion/Risk model
Generates predictions on full spatial grid and exports risk maps
"""

import logging
from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
import pandas as pd

from .config import Config, PREDICTIONS_DIR
from .model import FusionRiskModel, compute_confidence
from .preprocessing import Preprocessor
from .utils import save_metadata


logger = logging.getLogger(__name__)


class RiskPredictor:
    """Generates risk predictions on full spatial grid"""

    def __init__(
        self,
        model: FusionRiskModel,
        preprocessor: Preprocessor,
        config: Config
    ):
        """
        Initialize predictor

        Args:
            model: Trained model
            preprocessor: Fitted preprocessor
            config: Configuration object
        """
        self.model = model
        self.preprocessor = preprocessor
        self.config = config

    def predict_full_grid(
        self,
        feature_arrays: Dict[str, np.ndarray],
        feature_names: list,
        batch_size: int = 100000
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generate predictions for all pixels in spatial grid

        Args:
            feature_arrays: Dictionary of feature rasters
            feature_names: List of feature names (must match training order)
            batch_size: Batch size for prediction

        Returns:
            (risk_scores, confidence_scores, valid_mask)
        """
        logger.info("Generating predictions for full spatial grid...")

        # Get raster shape
        reference_shape = next(iter(feature_arrays.values())).shape
        n_pixels = reference_shape[0] * reference_shape[1]

        logger.info(f"Grid shape: {reference_shape}")
        logger.info(f"Total pixels: {n_pixels:,}")

        # Build feature matrix
        X = np.zeros((n_pixels, len(feature_names)), dtype=np.float32)

        for i, name in enumerate(feature_names):
            if name not in feature_arrays:
                raise ValueError(f"Feature not found: {name}")

            array = feature_arrays[name]
            X[:, i] = array.ravel()

        # Create valid mask
        nodata_value = self.config.features.nodata_value
        valid_mask = np.ones(n_pixels, dtype=bool)

        for i in range(len(feature_names)):
            is_invalid = (
                np.isclose(X[:, i], nodata_value) |
                np.isnan(X[:, i]) |
                np.isinf(X[:, i])
            )
            valid_mask &= ~is_invalid

        n_valid = np.sum(valid_mask)
        logger.info(f"Valid pixels: {n_valid:,} ({n_valid/n_pixels:.2%})")

        # Initialize output arrays
        risk_scores = np.full(n_pixels, nodata_value, dtype=np.float32)
        confidence_scores = np.full(n_pixels, nodata_value, dtype=np.float32)

        # Predict in batches for valid pixels only
        valid_indices = np.where(valid_mask)[0]
        X_valid = X[valid_mask]

        logger.info(f"Predicting in batches of {batch_size:,}...")

        for start_idx in range(0, len(X_valid), batch_size):
            end_idx = min(start_idx + batch_size, len(X_valid))

            # Get batch
            X_batch = X_valid[start_idx:end_idx]

            # Preprocess
            X_batch_processed = self.preprocessor.transform(X_batch)

            # Predict
            proba_batch = self.model.predict_proba(X_batch_processed)

            # Extract risk scores (probability of landslide)
            risk_batch = proba_batch[:, 1]

            # Compute confidence
            confidence_batch = compute_confidence(proba_batch, method="margin")

            # Store results
            batch_indices = valid_indices[start_idx:end_idx]
            risk_scores[batch_indices] = risk_batch
            confidence_scores[batch_indices] = confidence_batch

            if (start_idx // batch_size) % 10 == 0:
                progress = (end_idx / len(X_valid)) * 100
                logger.info(f"  Progress: {progress:.1f}%")

        logger.info("Prediction completed")

        # Reshape to 2D
        risk_map = risk_scores.reshape(reference_shape)
        confidence_map = confidence_scores.reshape(reference_shape)
        valid_mask_2d = valid_mask.reshape(reference_shape)

        return risk_map, confidence_map, valid_mask_2d

    def classify_risk_levels(
        self,
        risk_scores: np.ndarray
    ) -> np.ndarray:
        """
        Classify risk scores into discrete levels

        Args:
            risk_scores: Continuous risk scores (0-1)

        Returns:
            Risk level classification (0=NoData, 1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High)
        """
        logger.info("Classifying risk levels...")

        thresholds = self.config.spatial.risk_thresholds

        risk_levels = np.zeros_like(risk_scores, dtype=np.uint8)

        # Mark NoData
        nodata_mask = np.isclose(risk_scores, self.config.features.nodata_value)
        risk_levels[nodata_mask] = 0

        # Classify valid pixels
        valid_mask = ~nodata_mask

        risk_levels[valid_mask & (risk_scores < thresholds["very_low"])] = 1  # Very Low
        risk_levels[valid_mask & (risk_scores >= thresholds["very_low"]) &
                   (risk_scores < thresholds["low"])] = 2  # Low
        risk_levels[valid_mask & (risk_scores >= thresholds["low"]) &
                   (risk_scores < thresholds["medium"])] = 3  # Medium
        risk_levels[valid_mask & (risk_scores >= thresholds["medium"]) &
                   (risk_scores < thresholds["high"])] = 4  # High
        risk_levels[valid_mask & (risk_scores >= thresholds["high"])] = 5  # Very High

        # Log distribution
        for level, name in enumerate(["NoData", "Very Low", "Low", "Medium", "High", "Very High"]):
            count = np.sum(risk_levels == level)
            if level > 0:  # Skip NoData in percentage
                pct = count / np.sum(valid_mask) * 100
                logger.info(f"  {name}: {count:,} pixels ({pct:.2f}%)")

        return risk_levels

    def save_predictions(
        self,
        risk_scores: np.ndarray,
        confidence_scores: np.ndarray,
        risk_levels: np.ndarray,
        output_prefix: str = "fusion_risk"
    ):
        """
        Save predictions to CSV

        Args:
            risk_scores: Risk score map
            confidence_scores: Confidence map
            risk_levels: Risk level classification
            output_prefix: Output file prefix
        """
        logger.info("Saving predictions to CSV...")

        # Flatten arrays
        risk_flat = risk_scores.ravel()
        confidence_flat = confidence_scores.ravel()
        levels_flat = risk_levels.ravel()

        # Create DataFrame (only valid pixels)
        nodata_value = self.config.features.nodata_value
        valid_mask = ~np.isclose(risk_flat, nodata_value)

        df = pd.DataFrame({
            "pixel_index": np.where(valid_mask)[0],
            "risk_score": risk_flat[valid_mask],
            "confidence": confidence_flat[valid_mask],
            "risk_level": levels_flat[valid_mask]
        })

        # Add risk level names
        level_names = {
            1: "Very Low",
            2: "Low",
            3: "Medium",
            4: "High",
            5: "Very High"
        }
        df["risk_level_name"] = df["risk_level"].map(level_names)

        # Save
        output_path = PREDICTIONS_DIR / f"{output_prefix}_predictions.csv"
        df.to_csv(output_path, index=False)

        logger.info(f"Saved {len(df):,} predictions to {output_path}")

        # Save summary statistics
        summary = {
            "total_valid_pixels": int(len(df)),
            "risk_score_stats": {
                "min": float(df["risk_score"].min()),
                "max": float(df["risk_score"].max()),
                "mean": float(df["risk_score"].mean()),
                "median": float(df["risk_score"].median()),
                "std": float(df["risk_score"].std())
            },
            "confidence_stats": {
                "min": float(df["confidence"].min()),
                "max": float(df["confidence"].max()),
                "mean": float(df["confidence"].mean()),
                "median": float(df["confidence"].median())
            },
            "risk_level_distribution": df["risk_level_name"].value_counts().to_dict()
        }

        summary_path = PREDICTIONS_DIR / f"{output_prefix}_summary.json"
        save_metadata(summary_path, summary)

        logger.info(f"Saved prediction summary to {summary_path}")

        return df, summary
