"""
Data validation module for Dynamic Hazard model
Validates data quality and completeness before training
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Optional
import logging
from dataclasses import dataclass

from config import DataConfig


@dataclass
class ValidationReport:
    """Container for validation results"""
    passed: bool
    errors: List[str]
    warnings: List[str]
    statistics: Dict[str, any]


class DataValidator:
    """Validate data quality for dynamic hazard modeling"""

    def __init__(self, config: DataConfig, logger: Optional[logging.Logger] = None):
        """
        Initialize validator

        Args:
            config: Data configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)

    def validate_landslides(self, df: pd.DataFrame) -> ValidationReport:
        """
        Validate landslide data

        Args:
            df: Landslide events DataFrame

        Returns:
            Validation report
        """
        errors = []
        warnings = []
        stats = {}

        # Check required columns
        required_cols = ["event_date", "latitude", "longitude"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
            return ValidationReport(False, errors, warnings, stats)

        # Check for null values
        null_counts = df[required_cols].isnull().sum()
        if null_counts.sum() > 0:
            errors.append(f"Null values in required columns: {null_counts.to_dict()}")

        # Check date format
        try:
            dates = pd.to_datetime(df["event_date"])
            stats["date_range"] = f"{dates.min()} to {dates.max()}"
            stats["num_events"] = len(df)
        except Exception as e:
            errors.append(f"Invalid date format: {str(e)}")

        # Check coordinate ranges (Meghalaya bounds)
        if not df.empty:
            lat_valid = (df["latitude"] >= 24.5) & (df["latitude"] <= 26.5)
            lon_valid = (df["longitude"] >= 89.0) & (df["longitude"] <= 92.5)

            invalid_coords = ~(lat_valid & lon_valid)
            if invalid_coords.sum() > 0:
                warnings.append(
                    f"{invalid_coords.sum()} events outside Meghalaya bounds"
                )

            stats["latitude_range"] = f"{df['latitude'].min():.4f} to {df['latitude'].max():.4f}"
            stats["longitude_range"] = f"{df['longitude'].min():.4f} to {df['longitude'].max():.4f}"

        # Check for duplicates
        if "event_date" in df.columns:
            duplicates = df.duplicated(subset=["event_date", "latitude", "longitude"])
            if duplicates.sum() > 0:
                warnings.append(f"{duplicates.sum()} duplicate events found")

        passed = len(errors) == 0
        return ValidationReport(passed, errors, warnings, stats)

    def validate_rainfall(self, df: pd.DataFrame) -> ValidationReport:
        """
        Validate rainfall data

        Args:
            df: Rainfall DataFrame

        Returns:
            Validation report
        """
        errors = []
        warnings = []
        stats = {}

        # Check required columns
        required_cols = ["Date", "District", "Daily Actual"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
            return ValidationReport(False, errors, warnings, stats)

        # Check for null values
        null_counts = df[required_cols].isnull().sum()
        if null_counts.sum() > 0:
            null_pct = 100 * null_counts / len(df)
            for col, pct in null_pct.items():
                if pct > (1 - self.config.min_data_completeness) * 100:
                    errors.append(
                        f"Column '{col}' has {pct:.1f}% null values "
                        f"(threshold: {(1-self.config.min_data_completeness)*100:.1f}%)"
                    )
                elif pct > 0:
                    warnings.append(f"Column '{col}' has {pct:.1f}% null values")

        # Check date format and range
        try:
            dates = pd.to_datetime(df["Date"])
            stats["date_range"] = f"{dates.min()} to {dates.max()}"
            stats["num_records"] = len(df)

            # Check for date gaps
            date_counts = dates.value_counts().sort_index()
            expected_dates = pd.date_range(
                start=dates.min(),
                end=dates.max(),
                freq="D"
            )
            missing_dates = set(expected_dates) - set(date_counts.index)
            if missing_dates:
                warnings.append(f"{len(missing_dates)} missing dates in time series")

        except Exception as e:
            errors.append(f"Invalid date format: {str(e)}")

        # Check districts
        if "District" in df.columns:
            districts = df["District"].unique()
            stats["districts"] = districts.tolist()
            stats["num_districts"] = len(districts)

            # Check coverage for each district
            for district in districts:
                district_data = df[df["District"] == district]
                district_nulls = district_data["Daily Actual"].isnull().sum()
                null_pct = 100 * district_nulls / len(district_data)
                if null_pct > 20:
                    warnings.append(
                        f"District '{district}' has {null_pct:.1f}% missing rainfall"
                    )

        # Check rainfall values
        if "Daily Actual" in df.columns:
            rainfall = df["Daily Actual"].dropna()
            if len(rainfall) > 0:
                stats["rainfall_stats"] = {
                    "min": float(rainfall.min()),
                    "max": float(rainfall.max()),
                    "mean": float(rainfall.mean()),
                    "median": float(rainfall.median())
                }

                # Check for unrealistic values
                if rainfall.min() < 0:
                    errors.append("Negative rainfall values detected")
                if rainfall.max() > 1000:
                    warnings.append(
                        f"Extremely high rainfall detected: {rainfall.max():.1f} mm"
                    )

        passed = len(errors) == 0
        return ValidationReport(passed, errors, warnings, stats)

    def validate_daily_dataset(self, df: pd.DataFrame) -> ValidationReport:
        """
        Validate prepared daily dataset

        Args:
            df: Daily dataset DataFrame

        Returns:
            Validation report
        """
        errors = []
        warnings = []
        stats = {}

        # Check required columns
        required_cols = ["date", "district", "landslide_occurred"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
            return ValidationReport(False, errors, warnings, stats)

        # Check label distribution
        if "landslide_occurred" in df.columns:
            label_dist = df["landslide_occurred"].value_counts()
            stats["label_distribution"] = label_dist.to_dict()

            positive_pct = 100 * label_dist.get(1, 0) / len(df)
            stats["positive_rate"] = positive_pct

            if positive_pct == 0:
                errors.append("No positive examples in dataset")
            elif positive_pct < 1:
                warnings.append(
                    f"Severe class imbalance: {positive_pct:.2f}% positive examples"
                )
            elif positive_pct > 50:
                warnings.append(
                    f"Unusual positive rate: {positive_pct:.2f}% (may be over-sampled)"
                )

        # Check temporal coverage
        if "date" in df.columns:
            dates = pd.to_datetime(df["date"])
            stats["temporal_range"] = f"{dates.min()} to {dates.max()}"
            stats["num_days"] = dates.nunique()

            # Check for sufficient data for sequences
            if stats["num_days"] < self.config.sequence_length + 1:
                errors.append(
                    f"Insufficient temporal coverage: {stats['num_days']} days "
                    f"(need at least {self.config.sequence_length + 1} for sequences)"
                )

        # Check feature completeness
        feature_cols = [col for col in df.columns if col not in ["date", "district", "landslide_occurred"]]
        if feature_cols:
            completeness = (1 - df[feature_cols].isnull().sum() / len(df)) * 100
            low_completeness = completeness[completeness < self.config.min_data_completeness * 100]

            if len(low_completeness) > 0:
                warnings.append(
                    f"Low completeness features: {low_completeness.to_dict()}"
                )

            stats["num_features"] = len(feature_cols)
            stats["feature_completeness"] = completeness.mean()

        passed = len(errors) == 0
        return ValidationReport(passed, errors, warnings, stats)

    def print_report(self, report: ValidationReport, name: str) -> None:
        """
        Print validation report

        Args:
            report: Validation report
            name: Name of validation
        """
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"Validation Report: {name}")
        self.logger.info(f"{'='*60}")

        self.logger.info(f"Status: {'PASSED' if report.passed else 'FAILED'}")

        if report.statistics:
            self.logger.info("\nStatistics:")
            for key, value in report.statistics.items():
                self.logger.info(f"  {key}: {value}")

        if report.errors:
            self.logger.error("\nErrors:")
            for error in report.errors:
                self.logger.error(f"  - {error}")

        if report.warnings:
            self.logger.warning("\nWarnings:")
            for warning in report.warnings:
                self.logger.warning(f"  - {warning}")

        self.logger.info(f"{'='*60}\n")


if __name__ == "__main__":
    from config import get_config
    from utils import setup_logging, set_random_seed
    from data_loader import DataLoader

    config = get_config()
    logger = setup_logging(config.training.experiment_name)
    set_random_seed(config.training.random_seed)

    # Load data
    loader = DataLoader(config.data, logger)
    landslides, daily_df = loader.load_all()

    # Validate
    validator = DataValidator(config.data, logger)

    landslide_report = validator.validate_landslides(landslides)
    validator.print_report(landslide_report, "Landslide Data")

    daily_report = validator.validate_daily_dataset(daily_df)
    validator.print_report(daily_report, "Daily Dataset")
