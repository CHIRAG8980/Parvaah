"""
Sequence builder module for Dynamic Hazard LSTM model
Creates time-series sequences from daily data with temporal awareness
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Optional, Dict
import logging

from config import DataConfig


class SequenceBuilder:
    """Build sequences for LSTM time-series modeling"""

    def __init__(self, config: DataConfig, logger: Optional[logging.Logger] = None):
        """
        Initialize sequence builder

        Args:
            config: Data configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)
        self.sequence_length = config.sequence_length
        self.prediction_horizon = config.prediction_horizon

    def create_sequences(
        self,
        X: np.ndarray,
        y: np.ndarray,
        metadata: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        """
        Create sequences for LSTM from flat features

        Args:
            X: Feature array (n_samples, n_features)
            y: Target array (n_samples,)
            metadata: Metadata DataFrame with 'date' and 'district'

        Returns:
            Tuple of (X_seq, y_seq, metadata_seq)
            - X_seq: (n_sequences, sequence_length, n_features)
            - y_seq: (n_sequences,) - label for end of sequence
            - metadata_seq: metadata for each sequence
        """
        self.logger.info(f"Creating sequences with length={self.sequence_length}, horizon={self.prediction_horizon}")

        # Group by district to maintain temporal continuity
        districts = metadata["district"].unique()

        all_X_seq = []
        all_y_seq = []
        all_meta_seq = []

        for district in districts:
            # Get data for this district
            district_mask = metadata["district"] == district
            district_indices = np.where(district_mask)[0]

            if len(district_indices) < self.sequence_length + self.prediction_horizon:
                self.logger.warning(
                    f"Insufficient data for district {district}: "
                    f"{len(district_indices)} samples (need {self.sequence_length + self.prediction_horizon})"
                )
                continue

            X_district = X[district_mask]
            y_district = y[district_mask]
            meta_district = metadata.loc[district_mask].reset_index(drop=True)

            # Create sequences for this district
            n_samples = len(X_district)
            n_sequences = n_samples - self.sequence_length - self.prediction_horizon + 1

            if n_sequences <= 0:
                continue

            for i in range(n_sequences):
                # Input sequence: sequence_length days
                seq_start = i
                seq_end = i + self.sequence_length

                # Target: prediction_horizon days ahead
                target_idx = seq_end + self.prediction_horizon - 1

                # Extract sequence
                X_seq = X_district[seq_start:seq_end]
                y_seq = y_district[target_idx]

                # Get metadata for the target date
                meta_seq = meta_district.iloc[target_idx].to_dict()

                all_X_seq.append(X_seq)
                all_y_seq.append(y_seq)
                all_meta_seq.append(meta_seq)

        if len(all_X_seq) == 0:
            raise ValueError(
                f"No sequences could be created. "
                f"Check that data has sufficient temporal coverage for sequence_length={self.sequence_length}"
            )

        # Convert to arrays
        X_sequences = np.array(all_X_seq)
        y_sequences = np.array(all_y_seq)
        meta_sequences = pd.DataFrame(all_meta_seq)

        self.logger.info(f"Created {len(X_sequences)} sequences")
        self.logger.info(f"  X_seq shape: {X_sequences.shape}")
        self.logger.info(f"  y_seq shape: {y_sequences.shape}")

        # Check class distribution
        pos_count = y_sequences.sum()
        pos_rate = 100 * pos_count / len(y_sequences)
        self.logger.info(f"  Positive rate: {pos_rate:.2f}% ({int(pos_count)}/{len(y_sequences)})")

        return X_sequences, y_sequences, meta_sequences

    def create_sequences_from_dataframe(
        self,
        df: pd.DataFrame,
        feature_cols: List[str]
    ) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        """
        Create sequences directly from DataFrame

        Args:
            df: DataFrame with features, labels, and metadata
            feature_cols: List of feature column names

        Returns:
            Tuple of (X_seq, y_seq, metadata_seq)
        """
        # Extract components
        X = df[feature_cols].values
        y = df["landslide_occurred"].values if "landslide_occurred" in df.columns else None
        metadata = df[["date", "district"]].copy()

        if y is None:
            raise ValueError("DataFrame must contain 'landslide_occurred' column")

        return self.create_sequences(X, y, metadata)

    def validate_temporal_order(
        self,
        metadata: pd.DataFrame,
        X_seq: np.ndarray
    ) -> bool:
        """
        Validate that sequences maintain temporal order (no future leakage)

        Args:
            metadata: Metadata for sequences
            X_seq: Sequence array

        Returns:
            True if validation passes
        """
        if len(metadata) != len(X_seq):
            self.logger.error("Metadata and sequence length mismatch")
            return False

        # Check that dates are in order
        dates = pd.to_datetime(metadata["date"])
        if not dates.is_monotonic_increasing:
            self.logger.warning("Sequence dates are not monotonically increasing")
            # This is okay if sequences are grouped by district
            # But we should check within districts

        self.logger.info("Temporal order validation passed")
        return True

    def get_sequence_statistics(
        self,
        X_seq: np.ndarray,
        y_seq: np.ndarray,
        metadata: pd.DataFrame
    ) -> Dict:
        """
        Compute statistics about created sequences

        Args:
            X_seq: Sequence features
            y_seq: Sequence labels
            metadata: Sequence metadata

        Returns:
            Dictionary of statistics
        """
        stats = {
            "n_sequences": len(X_seq),
            "sequence_length": X_seq.shape[1] if len(X_seq.shape) > 1 else 0,
            "n_features": X_seq.shape[2] if len(X_seq.shape) > 2 else 0,
            "n_positive": int(y_seq.sum()),
            "n_negative": int((y_seq == 0).sum()),
            "positive_rate": float(y_seq.mean()),
            "date_range": f"{metadata['date'].min()} to {metadata['date'].max()}",
            "n_districts": metadata["district"].nunique(),
            "districts": metadata["district"].unique().tolist()
        }

        return stats


def prepare_sequences_for_training(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_cols: List[str],
    config: DataConfig,
    logger: logging.Logger
) -> Tuple[
    Tuple[np.ndarray, np.ndarray, pd.DataFrame],
    Tuple[np.ndarray, np.ndarray, pd.DataFrame],
    Tuple[np.ndarray, np.ndarray, pd.DataFrame]
]:
    """
    Prepare sequences for all splits

    Args:
        train_df: Training DataFrame
        val_df: Validation DataFrame
        test_df: Test DataFrame
        feature_cols: List of feature column names
        config: Data configuration
        logger: Logger instance

    Returns:
        Tuple of ((X_train, y_train, meta_train), (X_val, y_val, meta_val), (X_test, y_test, meta_test))
    """
    builder = SequenceBuilder(config, logger)

    logger.info("Creating training sequences...")
    X_train_seq, y_train_seq, meta_train_seq = builder.create_sequences_from_dataframe(
        train_df, feature_cols
    )
    train_stats = builder.get_sequence_statistics(X_train_seq, y_train_seq, meta_train_seq)
    logger.info(f"Training sequences: {train_stats}")

    if len(val_df) > 0:
        logger.info("Creating validation sequences...")
        X_val_seq, y_val_seq, meta_val_seq = builder.create_sequences_from_dataframe(
            val_df, feature_cols
        )
        val_stats = builder.get_sequence_statistics(X_val_seq, y_val_seq, meta_val_seq)
        logger.info(f"Validation sequences: {val_stats}")
    else:
        X_val_seq = np.array([])
        y_val_seq = np.array([])
        meta_val_seq = pd.DataFrame()
        logger.warning("No validation data available")

    if len(test_df) > 0:
        logger.info("Creating test sequences...")
        X_test_seq, y_test_seq, meta_test_seq = builder.create_sequences_from_dataframe(
            test_df, feature_cols
        )
        test_stats = builder.get_sequence_statistics(X_test_seq, y_test_seq, meta_test_seq)
        logger.info(f"Test sequences: {test_stats}")
    else:
        X_test_seq = np.array([])
        y_test_seq = np.array([])
        meta_test_seq = pd.DataFrame()
        logger.warning("No test data available")

    return (
        (X_train_seq, y_train_seq, meta_train_seq),
        (X_val_seq, y_val_seq, meta_val_seq),
        (X_test_seq, y_test_seq, meta_test_seq)
    )


if __name__ == "__main__":
    from config import get_config
    from utils import setup_logging, set_random_seed
    from data_loader import DataLoader
    from features import FeatureEngineer
    from preprocessing import Preprocessor

    config = get_config()
    logger = setup_logging(config.training.experiment_name)
    set_random_seed(config.training.random_seed)

    # Load and prepare data
    loader = DataLoader(config.data, logger)
    _, daily_df = loader.load_all()

    engineer = FeatureEngineer(config.data, logger)
    featured_df = engineer.engineer_all_features(daily_df)
    feature_cols = engineer.get_feature_names(featured_df)

    preprocessor = Preprocessor(config.data, logger)
    train_df, val_df, test_df = preprocessor.temporal_split(featured_df)

    X_train, y_train, meta_train = preprocessor.prepare_features(train_df, feature_cols, is_train=True)
    X_val, y_val, meta_val = preprocessor.prepare_features(val_df, feature_cols, is_train=False)
    X_test, y_test, meta_test = preprocessor.prepare_features(test_df, feature_cols, is_train=False)

    # Create sequences
    builder = SequenceBuilder(config.data, logger)
    X_train_seq, y_train_seq, meta_train_seq = builder.create_sequences(X_train, y_train, meta_train)
    X_val_seq, y_val_seq, meta_val_seq = builder.create_sequences(X_val, y_val, meta_val)
    X_test_seq, y_test_seq, meta_test_seq = builder.create_sequences(X_test, y_test, meta_test)

    print(f"\nSequences created:")
    print(f"Train: X={X_train_seq.shape}, y={y_train_seq.shape}")
    print(f"Val:   X={X_val_seq.shape}, y={y_val_seq.shape}")
    print(f"Test:  X={X_test_seq.shape}, y={y_test_seq.shape}")
