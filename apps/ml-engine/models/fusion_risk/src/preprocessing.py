"""
Preprocessing for Fusion/Risk model
Handles missing values, scaling, and normalization
"""

import logging
from typing import Tuple, Optional, Dict, Any
import numpy as np
import pickle
from pathlib import Path
from sklearn.preprocessing import StandardScaler, RobustScaler


logger = logging.getLogger(__name__)


class Preprocessor:
    """Handles data preprocessing for model training"""

    def __init__(self, scaler_type: str = "standard"):
        """
        Initialize preprocessor

        Args:
            scaler_type: Type of scaler ('standard' or 'robust')
        """
        self.scaler_type = scaler_type

        if scaler_type == "standard":
            self.scaler = StandardScaler()
        elif scaler_type == "robust":
            self.scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown scaler type: {scaler_type}")

        self.is_fitted = False

    def fit(self, X: np.ndarray) -> 'Preprocessor':
        """
        Fit preprocessor on training data

        Args:
            X: Training feature matrix

        Returns:
            Self
        """
        logger.info(f"Fitting {self.scaler_type} scaler...")

        # Handle missing values before fitting
        X_clean = self._handle_missing_values(X, fit=True)

        self.scaler.fit(X_clean)
        self.is_fitted = True

        logger.info("Scaler fitted successfully")

        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """
        Transform data using fitted preprocessor

        Args:
            X: Feature matrix

        Returns:
            Transformed feature matrix
        """
        if not self.is_fitted:
            raise RuntimeError("Preprocessor not fitted. Call fit() first.")

        # Handle missing values
        X_clean = self._handle_missing_values(X, fit=False)

        # Scale
        X_scaled = self.scaler.transform(X_clean)

        return X_scaled

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        """
        Fit and transform data

        Args:
            X: Feature matrix

        Returns:
            Transformed feature matrix
        """
        self.fit(X)
        return self.transform(X)

    def _handle_missing_values(
        self,
        X: np.ndarray,
        fit: bool = False
    ) -> np.ndarray:
        """
        Handle missing values in feature matrix

        Args:
            X: Feature matrix
            fit: Whether to compute statistics (for training)

        Returns:
            Feature matrix with imputed values
        """
        # Count missing values
        n_missing = np.sum(np.isnan(X) | np.isinf(X))

        if n_missing > 0:
            missing_fraction = n_missing / X.size
            logger.info(
                f"Found {n_missing:,} missing values ({missing_fraction:.2%})"
            )

            # Replace with median (computed on training data)
            if fit:
                self.feature_medians = np.nanmedian(X, axis=0)
                logger.info("Computed feature medians for imputation")

            # Impute
            X_imputed = X.copy()
            for col in range(X.shape[1]):
                mask = np.isnan(X_imputed[:, col]) | np.isinf(X_imputed[:, col])
                if np.any(mask):
                    X_imputed[mask, col] = self.feature_medians[col]

            return X_imputed
        else:
            return X

    def save(self, output_path: Path) -> None:
        """
        Save preprocessor to disk

        Args:
            output_path: Path to save preprocessor
        """
        if not self.is_fitted:
            raise RuntimeError("Cannot save unfitted preprocessor")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'wb') as f:
            pickle.dump(self, f)

        logger.info(f"Saved preprocessor to {output_path}")

    @staticmethod
    def load(input_path: Path) -> 'Preprocessor':
        """
        Load preprocessor from disk

        Args:
            input_path: Path to saved preprocessor

        Returns:
            Loaded preprocessor
        """
        with open(input_path, 'rb') as f:
            preprocessor = pickle.load(f)

        logger.info(f"Loaded preprocessor from {input_path}")

        return preprocessor

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get preprocessor metadata

        Returns:
            Metadata dictionary
        """
        metadata = {
            "scaler_type": self.scaler_type,
            "is_fitted": self.is_fitted
        }

        if self.is_fitted:
            metadata["n_features"] = len(self.feature_medians)

            if self.scaler_type == "standard":
                metadata["mean"] = self.scaler.mean_.tolist()
                metadata["std"] = self.scaler.scale_.tolist()
            elif self.scaler_type == "robust":
                metadata["center"] = self.scaler.center_.tolist()
                metadata["scale"] = self.scaler.scale_.tolist()

        return metadata


def remove_correlated_features(
    X: np.ndarray,
    feature_names: list,
    threshold: float = 0.95
) -> Tuple[np.ndarray, list, list]:
    """
    Remove highly correlated features

    Args:
        X: Feature matrix
        feature_names: List of feature names
        threshold: Correlation threshold

    Returns:
        (X_reduced, kept_features, removed_features)
    """
    logger.info(f"Checking for correlated features (threshold={threshold})...")

    # Compute correlation matrix
    corr_matrix = np.corrcoef(X.T)

    # Find pairs above threshold
    to_remove = set()

    for i in range(len(feature_names)):
        for j in range(i + 1, len(feature_names)):
            if abs(corr_matrix[i, j]) > threshold:
                # Remove feature with lower variance
                var_i = np.var(X[:, i])
                var_j = np.var(X[:, j])

                if var_i < var_j:
                    to_remove.add(i)
                    logger.info(
                        f"Removing {feature_names[i]} (corr={corr_matrix[i, j]:.3f} "
                        f"with {feature_names[j]})"
                    )
                else:
                    to_remove.add(j)
                    logger.info(
                        f"Removing {feature_names[j]} (corr={corr_matrix[i, j]:.3f} "
                        f"with {feature_names[i]})"
                    )

    # Remove features
    keep_indices = [i for i in range(len(feature_names)) if i not in to_remove]

    X_reduced = X[:, keep_indices]
    kept_features = [feature_names[i] for i in keep_indices]
    removed_features = [feature_names[i] for i in to_remove]

    logger.info(f"Kept {len(kept_features)} features, removed {len(removed_features)}")

    return X_reduced, kept_features, removed_features


def check_feature_importance_threshold(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: list,
    threshold: float = 0.01
) -> Tuple[np.ndarray, list]:
    """
    Remove low-importance features (simple variance-based screening)

    Args:
        X: Feature matrix
        y: Labels
        feature_names: List of feature names
        threshold: Minimum relative variance threshold

    Returns:
        (X_reduced, kept_features)
    """
    logger.info("Screening features by variance...")

    # Compute variance for each feature
    variances = np.var(X, axis=0)
    max_var = np.max(variances)
    rel_variances = variances / max_var

    # Keep features above threshold
    keep_mask = rel_variances >= threshold
    n_kept = np.sum(keep_mask)

    X_reduced = X[:, keep_mask]
    kept_features = [name for name, keep in zip(feature_names, keep_mask) if keep]

    removed = [name for name, keep in zip(feature_names, keep_mask) if not keep]
    if removed:
        logger.info(f"Removed low-variance features: {', '.join(removed)}")

    logger.info(f"Kept {n_kept}/{len(feature_names)} features after variance screening")

    return X_reduced, kept_features
