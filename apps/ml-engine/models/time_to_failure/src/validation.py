"""
Validation module for Time-to-Failure data and model assumptions.
Checks temporal integrity, sample size, and statistical defensibility.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

from .config import MIN_EVENTS_FOR_TTF, MIN_UNIQUE_DATES, MIN_TEMPORAL_SPAN_DAYS

logger = logging.getLogger(__name__)


class TTFValidation:
    """Validates data requirements for TTF modeling."""

    def __init__(self, min_events: int = MIN_EVENTS_FOR_TTF):
        self.min_events = min_events
        self.validation_results = {}

    def validate_sample_size(self, df: pd.DataFrame) -> dict:
        """
        Check if sample size is sufficient for regression modeling.

        Args:
            df: DataFrame with event data

        Returns:
            Validation report
        """
        n_events = len(df)
        is_sufficient = n_events >= self.min_events

        report = {
            "check": "sample_size",
            "passed": is_sufficient,
            "n_events": n_events,
            "required": self.min_events,
            "message": None
        }

        if not is_sufficient:
            report["message"] = (
                f"Insufficient sample size: {n_events} events (need {self.min_events}). "
                "TTF regression requires adequate observations for train/test split."
            )
        else:
            report["message"] = f"Sample size sufficient: {n_events} events"

        return report

    def validate_temporal_span(self, df: pd.DataFrame, date_col: str = 'event_date') -> dict:
        """
        Check temporal diversity and span.

        Args:
            df: DataFrame with dates
            date_col: Name of date column

        Returns:
            Validation report
        """
        dates = df[date_col].dropna()

        if len(dates) == 0:
            return {
                "check": "temporal_span",
                "passed": False,
                "message": "No valid dates found"
            }

        date_range = (dates.max() - dates.min()).days
        unique_dates = dates.dt.date.nunique()
        events_per_date = len(dates) / unique_dates

        passed = (
            date_range >= MIN_TEMPORAL_SPAN_DAYS and
            unique_dates >= MIN_UNIQUE_DATES
        )

        report = {
            "check": "temporal_span",
            "passed": passed,
            "span_days": date_range,
            "required_span_days": MIN_TEMPORAL_SPAN_DAYS,
            "unique_dates": unique_dates,
            "required_unique_dates": MIN_UNIQUE_DATES,
            "events_per_date": round(events_per_date, 2),
            "date_range": (dates.min().isoformat(), dates.max().isoformat()),
            "message": None
        }

        if not passed:
            issues = []
            if date_range < MIN_TEMPORAL_SPAN_DAYS:
                issues.append(f"Span too short: {date_range} days (need {MIN_TEMPORAL_SPAN_DAYS})")
            if unique_dates < MIN_UNIQUE_DATES:
                issues.append(f"Too few unique dates: {unique_dates} (need {MIN_UNIQUE_DATES})")
            report["message"] = "; ".join(issues)
        else:
            report["message"] = f"Temporal span sufficient: {date_range} days across {unique_dates} dates"

        return report

    def check_temporal_leakage(
        self,
        train_dates: pd.Series,
        test_dates: pd.Series
    ) -> dict:
        """
        Verify no temporal leakage in train/test split.

        Args:
            train_dates: Training set dates
            test_dates: Test set dates

        Returns:
            Validation report
        """
        train_max = train_dates.max()
        test_min = test_dates.min()

        passed = train_max < test_min

        report = {
            "check": "temporal_leakage",
            "passed": passed,
            "train_max": train_max.isoformat() if pd.notna(train_max) else None,
            "test_min": test_min.isoformat() if pd.notna(test_min) else None,
            "message": None
        }

        if not passed:
            report["message"] = (
                f"TEMPORAL LEAKAGE DETECTED: Latest training date ({train_max.date()}) "
                f"is not before earliest test date ({test_min.date()})"
            )
        else:
            gap_days = (test_min - train_max).days
            report["gap_days"] = gap_days
            report["message"] = f"No temporal leakage. Gap: {gap_days} days"

        return report

    def validate_feature_availability(
        self,
        df: pd.DataFrame,
        required_features: List[str]
    ) -> dict:
        """
        Check that required features are available without future leakage.

        Args:
            df: DataFrame with features
            required_features: List of required feature names

        Returns:
            Validation report
        """
        missing = [f for f in required_features if f not in df.columns]
        present = [f for f in required_features if f in df.columns]

        # Check for null values
        null_counts = df[present].isnull().sum()
        high_null = null_counts[null_counts > len(df) * 0.5].to_dict()

        passed = len(missing) == 0 and len(high_null) == 0

        report = {
            "check": "feature_availability",
            "passed": passed,
            "missing_features": missing,
            "high_null_features": high_null,
            "message": None
        }

        if missing:
            report["message"] = f"Missing required features: {missing}"
        elif high_null:
            report["message"] = f"High null rates (>50%): {list(high_null.keys())}"
        else:
            report["message"] = f"All {len(required_features)} features available"

        return report

    def check_chronological_ordering(self, df: pd.DataFrame, date_col: str = 'event_date') -> dict:
        """
        Verify events are properly ordered chronologically.

        Args:
            df: DataFrame with index as temporal order
            date_col: Date column name

        Returns:
            Validation report
        """
        dates = df[date_col]
        is_sorted = dates.is_monotonic_increasing

        report = {
            "check": "chronological_ordering",
            "passed": is_sorted,
            "message": "Events are chronologically ordered" if is_sorted else "Events are NOT chronologically ordered"
        }

        return report

    def run_all_validations(
        self,
        df: pd.DataFrame,
        date_col: str = 'event_date',
        required_features: Optional[List[str]] = None
    ) -> dict:
        """
        Run complete validation suite.

        Args:
            df: DataFrame with event data
            date_col: Date column name
            required_features: List of required feature names

        Returns:
            Complete validation report
        """
        logger.info("Running TTF validation suite...")

        validations = [
            self.validate_sample_size(df),
            self.validate_temporal_span(df, date_col),
            self.check_chronological_ordering(df, date_col),
        ]

        if required_features:
            validations.append(
                self.validate_feature_availability(df, required_features)
            )

        all_passed = all(v["passed"] for v in validations)

        report = {
            "overall_passed": all_passed,
            "is_defensible": all_passed,
            "validations": validations,
            "summary": self._generate_summary(validations, all_passed)
        }

        self.validation_results = report
        return report

    def _generate_summary(self, validations: List[dict], all_passed: bool) -> str:
        """Generate human-readable summary."""
        if all_passed:
            return "✓ All validations passed. Data is suitable for TTF modeling."
        else:
            failed = [v for v in validations if not v["passed"]]
            summary = f"✗ {len(failed)}/{len(validations)} validations failed:\n"
            for v in failed:
                summary += f"  - {v['check']}: {v['message']}\n"
            return summary


def check_model_defensibility(validation_report: dict) -> dict:
    """
    Final defensibility check for TTF model training.

    Args:
        validation_report: Output from run_all_validations

    Returns:
        Defensibility decision and rationale
    """
    defensible = validation_report["overall_passed"]

    decision = {
        "can_train": defensible,
        "rationale": None,
        "recommendations": []
    }

    if not defensible:
        failed_checks = [
            v["check"] for v in validation_report["validations"]
            if not v["passed"]
        ]

        decision["rationale"] = (
            f"TTF model training is NOT defensible. "
            f"Failed checks: {', '.join(failed_checks)}"
        )

        # Generate recommendations based on what failed
        for validation in validation_report["validations"]:
            if not validation["passed"]:
                check = validation["check"]
                if check == "sample_size":
                    decision["recommendations"].append(
                        "Collect more landslide events with exact dates. "
                        f"Current: {validation['n_events']}, Required: {validation['required']}"
                    )
                elif check == "temporal_span":
                    decision["recommendations"].append(
                        "Need events spanning longer time period. "
                        f"Current: {validation['span_days']} days, Required: {validation['required_span_days']}"
                    )
                elif check == "temporal_leakage":
                    decision["recommendations"].append(
                        "Fix temporal data split to prevent leakage"
                    )

    else:
        decision["rationale"] = "All validation checks passed. Model training is defensible."

    return decision
