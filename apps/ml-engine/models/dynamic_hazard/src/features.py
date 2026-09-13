"""
Feature engineering module for Dynamic Hazard model
Creates temporal and rainfall-based features for landslide prediction
"""

import pandas as pd
import numpy as np
from typing import List, Optional
import logging

from config import DataConfig


class FeatureEngineer:
    """Engineer features for dynamic hazard modeling"""

    def __init__(self, config: DataConfig, logger: Optional[logging.Logger] = None):
        """
        Initialize feature engineer

        Args:
            config: Data configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)

    def add_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add temporal features (day, month, season, etc.)

        Args:
            df: DataFrame with 'date' column

        Returns:
            DataFrame with added temporal features
        """
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"])

        # Basic temporal features
        df["day_of_year"] = df["date"].dt.dayofyear
        df["month"] = df["date"].dt.month
        df["day_of_month"] = df["date"].dt.day
        df["day_of_week"] = df["date"].dt.dayofweek
        df["week_of_year"] = df["date"].dt.isocalendar().week

        # Cyclical encoding for periodic features
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        df["day_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
        df["day_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)

        # Season (monsoon-focused for NER)
        # Pre-monsoon: Mar-May, Monsoon: Jun-Sep, Post-monsoon: Oct-Nov, Winter: Dec-Feb
        def get_season(month):
            if month in [3, 4, 5]:
                return 1  # Pre-monsoon
            elif month in [6, 7, 8, 9]:
                return 2  # Monsoon (high risk)
            elif month in [10, 11]:
                return 3  # Post-monsoon
            else:
                return 4  # Winter

        df["season"] = df["month"].apply(get_season)

        # One-hot encode season
        for season in [1, 2, 3, 4]:
            df[f"season_{season}"] = (df["season"] == season).astype(int)

        self.logger.info("Added temporal features")
        return df

    def add_rainfall_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add rainfall-derived features

        Args:
            df: DataFrame with 'rainfall' column

        Returns:
            DataFrame with added rainfall features
        """
        df = df.copy()

        # Ensure rainfall column exists
        if "rainfall" not in df.columns:
            self.logger.warning("No 'rainfall' column found, skipping rainfall features")
            return df

        # Fill missing rainfall with 0 (no rain)
        df["rainfall"] = df["rainfall"].fillna(0)

        # Log-transformed rainfall (handle zero with offset)
        df["rainfall_log"] = np.log1p(df["rainfall"])

        # Rainfall categories
        df["is_rainy"] = (df["rainfall"] > 2.5).astype(int)  # > 2.5mm
        df["is_heavy_rain"] = (df["rainfall"] > 64.5).astype(int)  # Heavy rain threshold
        df["is_very_heavy_rain"] = (df["rainfall"] > 115.5).astype(int)  # Very heavy

        # Squared rainfall (intensity effect)
        df["rainfall_squared"] = df["rainfall"] ** 2

        self.logger.info("Added rainfall features")
        return df

    def add_rolling_features(
        self,
        df: pd.DataFrame,
        windows: Optional[List[int]] = None
    ) -> pd.DataFrame:
        """
        Add rolling window features per district

        Args:
            df: DataFrame with 'date', 'district', 'rainfall'
            windows: List of window sizes (days)

        Returns:
            DataFrame with rolling features
        """
        df = df.copy()
        windows = windows or self.config.rolling_windows

        if "rainfall" not in df.columns:
            self.logger.warning("No 'rainfall' column, skipping rolling features")
            return df

        # Sort by district and date
        df = df.sort_values(["district", "date"]).reset_index(drop=True)

        # Compute rolling features per district
        for window in windows:
            self.logger.info(f"Computing {window}-day rolling features")

            # Rolling sum
            df[f"rainfall_sum_{window}d"] = df.groupby("district")["rainfall"].transform(
                lambda x: x.rolling(window=window, min_periods=1).sum()
            )

            # Rolling mean
            df[f"rainfall_mean_{window}d"] = df.groupby("district")["rainfall"].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )

            # Rolling max
            df[f"rainfall_max_{window}d"] = df.groupby("district")["rainfall"].transform(
                lambda x: x.rolling(window=window, min_periods=1).max()
            )

            # Rolling std (variability)
            df[f"rainfall_std_{window}d"] = df.groupby("district")["rainfall"].transform(
                lambda x: x.rolling(window=window, min_periods=1).std()
            ).fillna(0)

            # Count of rainy days in window
            df[f"rainy_days_{window}d"] = df.groupby("district")["is_rainy"].transform(
                lambda x: x.rolling(window=window, min_periods=1).sum()
            )

        self.logger.info("Added rolling features")
        return df

    def add_lag_features(
        self,
        df: pd.DataFrame,
        lags: Optional[List[int]] = None
    ) -> pd.DataFrame:
        """
        Add lagged rainfall features per district

        Args:
            df: DataFrame with 'date', 'district', 'rainfall'
            lags: List of lag days

        Returns:
            DataFrame with lag features
        """
        df = df.copy()
        lags = lags or self.config.lag_days

        if "rainfall" not in df.columns:
            self.logger.warning("No 'rainfall' column, skipping lag features")
            return df

        # Sort by district and date
        df = df.sort_values(["district", "date"]).reset_index(drop=True)

        # Add lag features per district
        for lag in lags:
            self.logger.info(f"Adding lag-{lag} features")
            df[f"rainfall_lag_{lag}d"] = df.groupby("district")["rainfall"].shift(lag)

        # Fill initial lags with 0
        lag_cols = [f"rainfall_lag_{lag}d" for lag in lags]
        df[lag_cols] = df[lag_cols].fillna(0)

        self.logger.info("Added lag features")
        return df

    def add_antecedent_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add antecedent rainfall features (cumulative before event)

        Args:
            df: DataFrame with rainfall rolling features

        Returns:
            DataFrame with antecedent features
        """
        df = df.copy()

        # Check if rolling features exist
        if "rainfall_sum_7d" not in df.columns:
            self.logger.warning("Rolling features not found, skipping antecedent features")
            return df

        # Antecedent rainfall intensity (recent vs longer-term)
        if "rainfall_sum_3d" in df.columns and "rainfall_sum_7d" in df.columns:
            df["antecedent_ratio_3d_7d"] = df["rainfall_sum_3d"] / (df["rainfall_sum_7d"] + 1)

        if "rainfall_sum_7d" in df.columns and "rainfall_sum_30d" in df.columns:
            df["antecedent_ratio_7d_30d"] = df["rainfall_sum_7d"] / (df["rainfall_sum_30d"] + 1)

        # Recent intensification (compare recent mean to longer-term)
        if "rainfall_mean_3d" in df.columns and "rainfall_mean_14d" in df.columns:
            df["rainfall_intensification"] = df["rainfall_mean_3d"] - df["rainfall_mean_14d"]

        self.logger.info("Added antecedent features")
        return df

    def engineer_all_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all feature engineering steps

        Args:
            df: Raw daily dataset

        Returns:
            DataFrame with all engineered features
        """
        self.logger.info("Starting feature engineering pipeline")

        df = self.add_temporal_features(df)
        df = self.add_rainfall_features(df)
        df = self.add_rolling_features(df)
        df = self.add_lag_features(df)
        df = self.add_antecedent_features(df)

        self.logger.info(f"Feature engineering complete. Total features: {len(df.columns)}")
        self.logger.info(f"Final shape: {df.shape}")

        return df

    def get_feature_names(self, df: pd.DataFrame) -> List[str]:
        """
        Get list of feature column names (excluding metadata and target)

        Args:
            df: DataFrame with features

        Returns:
            List of feature column names
        """
        exclude_cols = ["date", "district", "landslide_occurred", "season"]
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        return feature_cols


if __name__ == "__main__":
    from config import get_config
    from utils import setup_logging, set_random_seed
    from data_loader import DataLoader

    config = get_config()
    logger = setup_logging(config.training.experiment_name)
    set_random_seed(config.training.random_seed)

    # Load data
    loader = DataLoader(config.data, logger)
    _, daily_df = loader.load_all()

    # Engineer features
    engineer = FeatureEngineer(config.data, logger)
    featured_df = engineer.engineer_all_features(daily_df)

    print(f"\nFeatured dataset shape: {featured_df.shape}")
    print(f"\nFeature columns: {engineer.get_feature_names(featured_df)}")
    print(f"\nSample:\n{featured_df.head()}")
