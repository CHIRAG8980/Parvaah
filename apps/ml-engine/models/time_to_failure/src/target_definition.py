"""
Target definition and validation for Time-to-Failure modeling.
Handles temporal target construction with strict date validation.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class TimeToFailureTarget:
    """
    Defines and validates time-to-failure targets.

    CRITICAL RULES:
    1. Never fabricate dates for year-only events
    2. Never assume midpoint dates (June 30) for year-only data
    3. Only use exact dates for TTF regression
    4. Document any censoring or interval assumptions explicitly
    """

    def __init__(self, reference_date: Optional[datetime] = None):
        """
        Args:
            reference_date: Date from which to compute time-to-failure.
                          If None, uses earliest event date.
        """
        self.reference_date = reference_date

    def compute_ttf(self, event_dates: pd.Series) -> pd.Series:
        """
        Compute time-to-failure in days from reference date.

        Args:
            event_dates: Series of datetime objects

        Returns:
            Series of time-to-failure in days (positive values)
        """
        if self.reference_date is None:
            self.reference_date = event_dates.min()
            logger.info(f"Set reference date to earliest event: {self.reference_date.date()}")

        ttf_days = (event_dates - self.reference_date).dt.total_seconds() / 86400

        # TTF should be non-negative for events after reference
        if (ttf_days < 0).any():
            n_negative = (ttf_days < 0).sum()
            logger.warning(f"{n_negative} events occur before reference date - these will be excluded")
            ttf_days = ttf_days[ttf_days >= 0]

        return ttf_days

    def validate_target_construction(
        self,
        df: pd.DataFrame,
        date_column: str = 'event_date'
    ) -> dict:
        """
        Validate that target can be constructed without fabricating dates.

        Args:
            df: DataFrame with event dates
            date_column: Name of date column

        Returns:
            Validation report dictionary
        """
        report = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "stats": {}
        }

        if date_column not in df.columns:
            report["valid"] = False
            report["errors"].append(f"Date column '{date_column}' not found")
            return report

        dates = df[date_column]

        # Check for missing dates
        n_missing = dates.isna().sum()
        if n_missing > 0:
            report["warnings"].append(f"{n_missing} missing dates will be excluded")

        # Check for invalid date types
        valid_dates = dates.dropna()
        if not pd.api.types.is_datetime64_any_dtype(valid_dates):
            report["errors"].append("Dates are not in datetime format")
            report["valid"] = False
            return report

        # Check for year-only dates (would be 01-01 or fabricated)
        date_strings = valid_dates.dt.strftime('%m-%d')
        suspicious_dates = date_strings.isin(['01-01', '06-30', '12-31'])
        if suspicious_dates.any():
            n_suspicious = suspicious_dates.sum()
            report["warnings"].append(
                f"{n_suspicious} events on Jan 1, Jun 30, or Dec 31 - "
                "may indicate fabricated dates from year-only data"
            )

        # Temporal statistics
        if len(valid_dates) > 0:
            report["stats"] = {
                "n_valid": len(valid_dates),
                "n_missing": n_missing,
                "date_range": (valid_dates.min().isoformat(), valid_dates.max().isoformat()),
                "span_days": (valid_dates.max() - valid_dates.min()).days,
            }

        return report

    def check_censoring(self, df: pd.DataFrame) -> dict:
        """
        Check for potential censored observations.

        Right-censoring: observations cut off before failure
        Interval-censoring: failure known to occur in time window

        Args:
            df: DataFrame with event information

        Returns:
            Censoring analysis report
        """
        report = {
            "has_censoring": False,
            "censoring_type": None,
            "n_censored": 0,
            "recommendation": None
        }

        # Check if year-only data exists (potential interval censoring)
        if 'date_precision' in df.columns:
            year_only = df[df['date_precision'] == 'year']
            if len(year_only) > 0:
                report["has_censoring"] = True
                report["censoring_type"] = "interval"
                report["n_censored"] = len(year_only)
                report["recommendation"] = (
                    "Consider survival analysis with interval censoring. "
                    "Year-only events can be treated as occurring within "
                    "the specified year (interval)."
                )

        return report


def create_ttf_targets(
    df: pd.DataFrame,
    prediction_timestamp: datetime,
    max_horizon_days: int = 30
) -> pd.DataFrame:
    """
    Create time-to-failure targets for given prediction timestamp.

    This function computes how many days from prediction_timestamp
    until each observed failure occurred.

    Args:
        df: DataFrame with event_date column
        prediction_timestamp: When the prediction is made
        max_horizon_days: Maximum prediction horizon

    Returns:
        DataFrame with TTF targets and validity flags
    """
    result = df.copy()

    # Compute TTF in days
    result['ttf_days'] = (result['event_date'] - prediction_timestamp).dt.total_seconds() / 86400

    # Flag valid predictions (future events within horizon)
    result['is_valid_target'] = (
        (result['ttf_days'] > 0) &  # Event is in future
        (result['ttf_days'] <= max_horizon_days)  # Within prediction horizon
    )

    # Flag past events (cannot be predicted from this timestamp)
    result['is_past_event'] = result['ttf_days'] <= 0

    # Flag distant future (beyond horizon)
    result['is_beyond_horizon'] = result['ttf_days'] > max_horizon_days

    logger.info(f"\nTTF Target Statistics (from {prediction_timestamp.date()}):")
    logger.info(f"  Valid targets: {result['is_valid_target'].sum()}")
    logger.info(f"  Past events: {result['is_past_event'].sum()}")
    logger.info(f"  Beyond horizon: {result['is_beyond_horizon'].sum()}")

    return result
