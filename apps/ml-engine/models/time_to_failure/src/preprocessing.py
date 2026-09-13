"""
Preprocessing for Time-to-Failure modeling.
Handles data cleaning, feature scaling, and temporal alignment.
"""
from typing import Tuple, Optional, List
import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class TTFPreprocessor:
    """Preprocessor for TTF data with temporal awareness."""

    def __init__(self):
        self.feature_scaler = StandardScaler()
        self.fitted = False
        self.feature_names: Optional[List[str]] = None

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove invalid records and handle missing values."""
        cleaned = df.dropna(subset=['latitude', 'longitude'])
        if 'event_date' in cleaned.columns:
            cleaned = cleaned.dropna(subset=['event_date'])
            cleaned = cleaned.drop_duplicates(subset=['latitude', 'longitude', 'event_date'])
        removed = len(df) - len(cleaned)
        if removed > 0:
            logger.info(f"Removed {removed} invalid/duplicate records during cleaning")
        return cleaned

    def create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create temporal features from event dates."""
        if 'event_date' not in df.columns:
            logger.warning("No event_date column - cannot create temporal features")
            return df

        result = df.copy()
        result['day_of_year'] = result['event_date'].dt.dayofyear
        result['month'] = result['event_date'].dt.month
        result['year'] = result['event_date'].dt.year
        result['is_monsoon'] = result['month'].isin([5, 6, 7, 8, 9]).astype(int)
        ref_date = result['event_date'].min()
        result['days_since_start'] = (result['event_date'] - ref_date).dt.days
        return result

    def handle_missing_features(self, df: pd.DataFrame, strategy: str = 'mean') -> pd.DataFrame:
        """Handle missing values in numeric feature columns."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        missing_counts = df[numeric_cols].isnull().sum()
        cols_with_missing = missing_counts[missing_counts > 0]

        if len(cols_with_missing) == 0:
            return df

        result = df.copy()
        for col in cols_with_missing.index:
            if strategy == 'median':
                fill_val = result[col].median()
            elif strategy == 'zero':
                fill_val = 0
            else:
                fill_val = result[col].mean()
            result[col] = result[col].fillna(fill_val)
        return result

    def fit(self, X: pd.DataFrame) -> None:
        """Fit scaler on training data."""
        self.feature_names = list(X.columns)
        self.feature_scaler.fit(X)
        self.fitted = True

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform features using fitted scaler."""
        if not self.fitted:
            raise RuntimeError("Preprocessor not fitted. Call fit() first.")
        X_aligned = X[self.feature_names]
        scaled = self.feature_scaler.transform(X_aligned)
        return pd.DataFrame(scaled, columns=self.feature_names, index=X.index)

    def fit_transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Fit and transform in one step."""
        self.fit(X)
        return self.transform(X)


def create_chronological_split(
    df: pd.DataFrame,
    date_col: str = 'event_date',
    test_fraction: float = 0.2
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split data chronologically for temporal validation."""
    df_sorted = df.sort_values(date_col).reset_index(drop=True)
    split_idx = int(len(df_sorted) * (1 - test_fraction))
    train_df = df_sorted.iloc[:split_idx].copy()
    test_df = df_sorted.iloc[split_idx:].copy()
    split_date = df_sorted.iloc[split_idx][date_col]
    logger.info(f"Chronological split at {split_date.date()}: train={len(train_df)}, test={len(test_df)}")
    return train_df, test_df


def prepare_features_and_targets(
    df: pd.DataFrame,
    target_col: str = 'ttf_days',
    exclude_cols: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, pd.Series]:
    """Separate numeric features and target variable."""
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found")

    if exclude_cols is None:
        exclude_cols = [
            'event_date', 'event_datetime', 'event_year',
            'date_precision', 'source_row', 'source_line',
            'landslide_id', 'district', 'state', 'location', target_col
        ]

    feature_cols = [
        col for col in df.columns
        if col not in exclude_cols and pd.api.types.is_numeric_dtype(df[col])
    ]
    return df[feature_cols].copy(), df[target_col].copy()
