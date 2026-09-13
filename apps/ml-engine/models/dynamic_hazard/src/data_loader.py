"""
Data loading module for Dynamic Hazard model
Loads real IMD rainfall and landslide event data from institutional sources
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, List
from datetime import datetime, timedelta
import logging

from config import (
    LANDSLIDES_DATED,
    RAINFALL_DAILY,
    DataConfig
)
from utils import check_file_exists


class DataLoader:
    """Load and prepare data for dynamic hazard modeling"""

    def __init__(self, config: DataConfig, logger: Optional[logging.Logger] = None):
        """
        Initialize data loader

        Args:
            config: Data configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)

    def load_landslides(self) -> pd.DataFrame:
        """
        Load dated landslide events

        Returns:
            DataFrame with landslide events
        """
        check_file_exists(LANDSLIDES_DATED, "Dated landslide events")

        self.logger.info(f"Loading landslide events from: {LANDSLIDES_DATED}")
        df = pd.read_csv(LANDSLIDES_DATED)

        # Parse dates
        df["event_date"] = pd.to_datetime(df["event_date"])

        # Filter to date range
        start = pd.to_datetime(self.config.start_date)
        end = pd.to_datetime(self.config.end_date)
        df = df[(df["event_date"] >= start) & (df["event_date"] <= end)]

        self.logger.info(f"Loaded {len(df)} landslide events")
        self.logger.info(f"Date range: {df['event_date'].min()} to {df['event_date'].max()}")

        if len(df) == 0:
            self.logger.warning(
                f"No landslide events found in date range {start} to {end}"
            )

        return df

    def load_rainfall(self) -> pd.DataFrame:
        """
        Load IMD daily rainfall data

        Returns:
            DataFrame with rainfall data
        """
        check_file_exists(RAINFALL_DAILY, "IMD rainfall data")

        self.logger.info(f"Loading IMD rainfall data from: {RAINFALL_DAILY}")
        df = pd.read_csv(RAINFALL_DAILY)

        # Parse dates
        df["Date"] = pd.to_datetime(df["Date"])

        # Filter to Meghalaya districts
        df = df[df["State"] == "Meghalaya"]

        # Filter to configured districts
        if self.config.target_districts:
            df = df[df["District"].isin(self.config.target_districts)]

        # Filter to date range
        start = pd.to_datetime(self.config.start_date)
        end = pd.to_datetime(self.config.end_date)
        df = df[(df["Date"] >= start) & (df["Date"] <= end)]

        self.logger.info(f"Loaded {len(df)} rainfall records")
        self.logger.info(f"Districts: {df['District'].unique().tolist()}")
        self.logger.info(f"Date range: {df['Date'].min()} to {df['Date'].max()}")

        if len(df) == 0:
            raise ValueError(
                f"No rainfall data found for Meghalaya in date range {start} to {end}"
            )

        return df

    def create_daily_dataset(
        self,
        landslides: pd.DataFrame,
        rainfall: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create daily dataset with landslide occurrence labels

        Args:
            landslides: Landslide events DataFrame
            rainfall: Rainfall data DataFrame

        Returns:
            Daily dataset with features and labels
        """
        self.logger.info("Creating daily dataset...")

        # Get unique districts and dates
        districts = self.config.target_districts or rainfall["District"].unique()
        start = pd.to_datetime(self.config.start_date)
        end = pd.to_datetime(self.config.end_date)

        # Create complete date range
        date_range = pd.date_range(start=start, end=end, freq="D")

        # Build daily records for each district
        records = []
        for district in districts:
            for date in date_range:
                records.append({
                    "date": date,
                    "district": district
                })

        daily_df = pd.DataFrame(records)

        # Add rainfall data
        rainfall_subset = rainfall[["Date", "District", "Daily Actual", "Daily Normal", "Daily Departure Per"]].copy()
        rainfall_subset.columns = ["date", "district", "rainfall", "rainfall_normal", "rainfall_departure"]

        daily_df = daily_df.merge(
            rainfall_subset,
            on=["date", "district"],
            how="left"
        )

        # Create landslide occurrence labels
        # For each day-district, check if a landslide occurred in that district on that date
        if "district" in landslides.columns:
            event_pairs = set(zip(landslides["event_date"].dt.date, landslides["district"]))
            daily_df["landslide_occurred"] = [
                int((d.date(), dist) in event_pairs)
                for d, dist in zip(daily_df["date"], daily_df["district"])
            ]
        else:
            landslide_dates = set(landslides["event_date"].dt.date)
            daily_df["landslide_occurred"] = [
                int(d.date() in landslide_dates) for d in daily_df["date"]
            ]

        # Log statistics
        total_days = len(daily_df)
        event_days = daily_df["landslide_occurred"].sum()
        non_event_days = total_days - event_days

        self.logger.info(f"Total daily records: {total_days}")
        self.logger.info(f"Event days: {event_days} ({100*event_days/total_days:.2f}%)")
        self.logger.info(f"Non-event days: {non_event_days} ({100*non_event_days/total_days:.2f}%)")

        # Check data completeness
        null_counts = daily_df.isnull().sum()
        if null_counts.sum() > 0:
            self.logger.warning("Missing values detected:")
            for col, count in null_counts.items():
                if count > 0:
                    self.logger.warning(f"  {col}: {count} ({100*count/len(daily_df):.2f}%)")

        return daily_df

    def sample_negative_examples(
        self,
        daily_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Sample negative (non-event) examples to balance dataset

        Args:
            daily_df: Daily dataset with labels

        Returns:
            Balanced dataset
        """
        event_df = daily_df[daily_df["landslide_occurred"] == 1]
        non_event_df = daily_df[daily_df["landslide_occurred"] == 0]

        n_events = len(event_df)
        n_samples = int(n_events * self.config.negative_sampling_ratio)

        if n_samples >= len(non_event_df):
            self.logger.warning(
                f"Requested {n_samples} negative samples but only {len(non_event_df)} available. "
                "Using all non-event days."
            )
            sampled_non_event = non_event_df
        else:
            sampled_non_event = non_event_df.sample(
                n=n_samples,
                random_state=42
            )

        # Combine and shuffle
        balanced_df = pd.concat([event_df, sampled_non_event], ignore_index=True)
        balanced_df = balanced_df.sample(frac=1, random_state=42).reset_index(drop=True)

        self.logger.info(f"Balanced dataset: {len(balanced_df)} samples")
        self.logger.info(f"  Events: {len(event_df)} ({100*len(event_df)/len(balanced_df):.2f}%)")
        self.logger.info(f"  Non-events: {len(sampled_non_event)} ({100*len(sampled_non_event)/len(balanced_df):.2f}%)")

        return balanced_df

    def load_all(self, apply_sampling: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Load all data and create daily dataset

        Args:
            apply_sampling: Deprecated on daily level to preserve temporal continuity
                           for sequence models. Use sequence-level sampling or class weights.

        Returns:
            Tuple of (landslides DataFrame, daily dataset DataFrame)
        """
        self.logger.info("Loading all data...")

        # Load raw data
        landslides = self.load_landslides()
        rainfall = self.load_rainfall()

        # Create daily dataset (continuous daily records)
        daily_df = self.create_daily_dataset(landslides, rainfall)

        # Note: Do not drop random days before rolling/lag feature engineering and sequence creation!
        if apply_sampling:
            self.logger.info(
                "Row-level negative sampling skipped on daily dataset to preserve temporal continuity "
                "for rolling windows and LSTM sequence building. Use class weights in training."
            )

        self.logger.info("Data loading complete")
        return landslides, daily_df


if __name__ == "__main__":
    from config import get_config
    from utils import setup_logging, set_random_seed

    config = get_config()
    logger = setup_logging(config.training.experiment_name)
    set_random_seed(config.training.random_seed)

    loader = DataLoader(config.data, logger)
    landslides, daily_df = loader.load_all()

    print(f"\nLandslides shape: {landslides.shape}")
    print(f"Daily dataset shape: {daily_df.shape}")
    print(f"\nDaily dataset columns: {daily_df.columns.tolist()}")
    print(f"\nDaily dataset sample:\n{daily_df.head()}")
