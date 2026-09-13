"""
Preprocessing module for Dynamic Hazard model
Handles data cleaning, scaling, and train/val/test splitting
"""

import pandas as pd
import numpy as np
from typing import Tuple, Dict, List, Optional
import logging
from sklearn.preprocessing import StandardScaler, RobustScaler
from datetime import datetime

from config import DataConfig
from utils import save_pickle, load_pickle


class Preprocessor:
    """Preprocess data for LSTM modeling"""

    def __init__(self, config: DataConfig, logger: Optional[logging.Logger] = None):
        """
        Initialize preprocessor

        Args:
            config: Data configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)
        self.scaler = None
        self.feature_names = None
        self.split_dates = {}

    def temporal_split(
        self,
        df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split data chronologically into train/val/test

        Args:
            df: Input DataFrame with 'date' column

        Returns:
            Tuple of (train_df, val_df, test_df)
        """
        df = df.sort_values("date").reset_index(drop=True)

        n = len(df)
        train_size = int(n * self.config.train_ratio)
        val_size = int(n * self.config.val_ratio)

        train_df = df.iloc[:train_size].copy()
        val_df = df.iloc[train_size:train_size + val_size].copy()
        test_df = df.iloc[train_size + val_size:].copy()

        # Store split dates for documentation
        self.split_dates = {
            "train_start": train_df["date"].min(),
            "train_end": train_df["date"].max(),
            "val_start": val_df["date"].min() if len(val_df) > 0 else None,
            "val_end": val_df["date"].max() if len(val_df) > 0 else None,
            "test_start": test_df["date"].min() if len(test_df) > 0 else None,
            "test_end": test_df["date"].max() if len(test_df) > 0 else None,
        }

        self.logger.info(f"Temporal split:")
        self.logger.info(f"  Train: {len(train_df)} samples ({self.split_dates['train_start']} to {self.split_dates['train_end']})")
        self.logger.info(f"  Val:   {len(val_df)} samples ({self.split_dates['val_start']} to {self.split_dates['val_end']})")
        self.logger.info(f"  Test:  {len(test_df)} samples ({self.split_dates['test_start']} to {self.split_dates['test_end']})")

        # Check for class distribution in each split
        for name, split_df in [("Train", train_df), ("Val", val_df), ("Test", test_df)]:
            if len(split_df) > 0 and "landslide_occurred" in split_df.columns:
                pos_rate = 100 * split_df["landslide_occurred"].sum() / len(split_df)
                self.logger.info(f"  {name} positive rate: {pos_rate:.2f}%")

        return train_df, val_df, test_df

    def handle_missing_values(
        self,
        df: pd.DataFrame,
        strategy: str = "forward_fill"
    ) -> pd.DataFrame:
        """
        Handle missing values in features

        Args:
            df: Input DataFrame
            strategy: Strategy for handling missing values

        Returns:
            DataFrame with handled missing values
        """
        df = df.copy()

        # Exclude non-feature columns
        exclude_cols = ["date", "district", "landslide_occurred"]
        feature_cols = [col for col in df.columns if col not in exclude_cols]

        # Log missing values
        missing_counts = df[feature_cols].isnull().sum()
        if missing_counts.sum() > 0:
            self.logger.warning("Missing values before handling:")
            for col, count in missing_counts.items():
                if count > 0:
                    self.logger.warning(f"  {col}: {count} ({100*count/len(df):.2f}%)")

        # Apply strategy
        if strategy == "forward_fill":
            # Forward fill within each district
            df[feature_cols] = df.groupby("district")[feature_cols].ffill()
            # Then backward fill any remaining
            df[feature_cols] = df.groupby("district")[feature_cols].bfill()
            # Finally fill any remaining with 0
            df[feature_cols] = df[feature_cols].fillna(0)

        elif strategy == "zero_fill":
            df[feature_cols] = df[feature_cols].fillna(0)

        elif strategy == "mean_fill":
            # Use mean per district
            for col in feature_cols:
                means = df.groupby("district")[col].transform("mean")
                df[col] = df[col].fillna(means)
                df[col] = df[col].fillna(0)  # Fill any remaining

        else:
            raise ValueError(f"Unknown strategy: {strategy}")

        # Check remaining missing values
        remaining_missing = df[feature_cols].isnull().sum().sum()
        if remaining_missing > 0:
            self.logger.warning(f"Still have {remaining_missing} missing values after handling")
        else:
            self.logger.info("All missing values handled successfully")

        return df

    def fit_scaler(
        self,
        train_df: pd.DataFrame,
        feature_cols: List[str],
        scaler_type: str = "standard"
    ) -> None:
        """
        Fit scaler on training data

        Args:
            train_df: Training DataFrame
            feature_cols: List of feature column names
            scaler_type: Type of scaler ('standard' or 'robust')
        """
        self.feature_names = feature_cols

        if scaler_type == "standard":
            self.scaler = StandardScaler()
        elif scaler_type == "robust":
            self.scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown scaler type: {scaler_type}")

        self.scaler.fit(train_df[feature_cols])
        self.logger.info(f"Fitted {scaler_type} scaler on {len(feature_cols)} features")

    def transform(
        self,
        df: pd.DataFrame,
        feature_cols: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Transform features using fitted scaler

        Args:
            df: Input DataFrame
            feature_cols: Optional list of feature columns (uses stored if None)

        Returns:
            DataFrame with scaled features
        """
        if self.scaler is None:
            raise ValueError("Scaler not fitted. Call fit_scaler first.")

        df = df.copy()
        feature_cols = feature_cols or self.feature_names

        # Scale features
        scaled_values = self.scaler.transform(df[feature_cols])
        df[feature_cols] = scaled_values

        return df

    def prepare_features(
        self,
        df: pd.DataFrame,
        feature_cols: List[str],
        is_train: bool = False
    ) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        """
        Prepare features and labels for modeling

        Args:
            df: Input DataFrame
            feature_cols: List of feature column names
            is_train: Whether this is training data (fit scaler)

        Returns:
            Tuple of (X features, y labels, metadata DataFrame)
        """
        # Handle missing values
        df = self.handle_missing_values(df)

        # Fit or transform scaler
        if is_train:
            self.fit_scaler(df, feature_cols)

        df = self.transform(df, feature_cols)

        # Extract features and labels
        X = df[feature_cols].values
        y = df["landslide_occurred"].values if "landslide_occurred" in df.columns else None

        # Keep metadata
        metadata_cols = ["date", "district"]
        metadata = df[metadata_cols].copy()

        self.logger.info(f"Prepared features: X shape {X.shape}, y shape {y.shape if y is not None else 'None'}")

        return X, y, metadata

    def save_artifacts(self, save_dir) -> None:
        """
        Save preprocessing artifacts

        Args:
            save_dir: Directory to save artifacts
        """
        if self.scaler is not None:
            save_pickle(self.scaler, save_dir / "scaler.pkl")
            self.logger.info(f"Saved scaler to {save_dir / 'scaler.pkl'}")

        if self.feature_names is not None:
            save_pickle(self.feature_names, save_dir / "feature_names.pkl")
            self.logger.info(f"Saved feature names to {save_dir / 'feature_names.pkl'}")

        if self.split_dates:
            save_pickle(self.split_dates, save_dir / "split_dates.pkl")
            self.logger.info(f"Saved split dates to {save_dir / 'split_dates.pkl'}")

    def load_artifacts(self, save_dir) -> None:
        """
        Load preprocessing artifacts

        Args:
            save_dir: Directory to load artifacts from
        """
        scaler_path = save_dir / "scaler.pkl"
        if scaler_path.exists():
            self.scaler = load_pickle(scaler_path)
            self.logger.info(f"Loaded scaler from {scaler_path}")

        feature_names_path = save_dir / "feature_names.pkl"
        if feature_names_path.exists():
            self.feature_names = load_pickle(feature_names_path)
            self.logger.info(f"Loaded feature names from {feature_names_path}")

        split_dates_path = save_dir / "split_dates.pkl"
        if split_dates_path.exists():
            self.split_dates = load_pickle(split_dates_path)
            self.logger.info(f"Loaded split dates from {split_dates_path}")


if __name__ == "__main__":
    from config import get_config
    from utils import setup_logging, set_random_seed
    from data_loader import DataLoader
    from features import FeatureEngineer

    config = get_config()
    logger = setup_logging(config.training.experiment_name)
    set_random_seed(config.training.random_seed)

    # Load and engineer features
    loader = DataLoader(config.data, logger)
    _, daily_df = loader.load_all()

    engineer = FeatureEngineer(config.data, logger)
    featured_df = engineer.engineer_all_features(daily_df)
    feature_cols = engineer.get_feature_names(featured_df)

    # Preprocess
    preprocessor = Preprocessor(config.data, logger)
    train_df, val_df, test_df = preprocessor.temporal_split(featured_df)

    X_train, y_train, meta_train = preprocessor.prepare_features(train_df, feature_cols, is_train=True)
    X_val, y_val, meta_val = preprocessor.prepare_features(val_df, feature_cols, is_train=False)
    X_test, y_test, meta_test = preprocessor.prepare_features(test_df, feature_cols, is_train=False)

    print(f"\nTrain: X={X_train.shape}, y={y_train.shape}")
    print(f"Val:   X={X_val.shape}, y={y_val.shape}")
    print(f"Test:  X={X_test.shape}, y={y_test.shape}")
