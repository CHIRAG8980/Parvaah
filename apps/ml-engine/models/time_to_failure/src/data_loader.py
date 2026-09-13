"""
Data loading utilities for TTF model.
Handles exact-date and year-only landslide inventories.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
from datetime import datetime
import logging

from .config import GROUND_TRUTH_EXACT, GROUND_TRUTH_YEAR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_exact_date_events() -> pd.DataFrame:
    """
    Load landslide events with exact dates.

    Returns:
        DataFrame with exact event dates and locations
    """
    if not GROUND_TRUTH_EXACT.exists():
        logger.warning(f"Exact-date file not found: {GROUND_TRUTH_EXACT}")
        return pd.DataFrame()

    df = pd.read_csv(GROUND_TRUTH_EXACT)

    # Parse event_date
    if 'event_date' in df.columns:
        df['event_date'] = pd.to_datetime(df['event_date'], errors='coerce')
        # Remove rows with invalid dates
        initial_count = len(df)
        df = df.dropna(subset=['event_date'])
        if len(df) < initial_count:
            logger.warning(f"Removed {initial_count - len(df)} events with invalid dates")
        df = df.sort_values('event_date').reset_index(drop=True)
    else:
        logger.error("No 'event_date' column found in exact-date file")
        return pd.DataFrame()

    logger.info(f"Loaded {len(df)} events with exact dates")
    return df


def load_year_only_events() -> pd.DataFrame:
    """
    Load landslide events with year-only temporal information.
    These CANNOT be used for exact TTF but may inform coarser analysis.

    Returns:
        DataFrame with year-only events
    """
    if not GROUND_TRUTH_YEAR.exists():
        logger.warning(f"Year-only file not found: {GROUND_TRUTH_YEAR}")
        return pd.DataFrame()

    df = pd.read_csv(GROUND_TRUTH_YEAR)

    # Filter to year-only (event_date is empty but event_year is present)
    if 'event_year' in df.columns:
        year_only = df[df['event_date'].isna() & df['event_year'].notna()].copy()
        logger.info(f"Loaded {len(year_only)} year-only events")
        return year_only
    else:
        logger.error("No 'event_year' column found")
        return pd.DataFrame()


def assess_temporal_coverage(df: pd.DataFrame) -> dict:
    """
    Assess temporal coverage and quality of event data.

    Args:
        df: DataFrame with event_date column

    Returns:
        Dictionary with temporal statistics
    """
    if df.empty or 'event_date' not in df.columns:
        return {
            "n_events": 0,
            "date_range": None,
            "span_days": 0,
            "unique_dates": 0,
            "events_per_day": {},
            "temporal_density": 0.0,
            "is_sufficient": False,
            "warnings": ["No valid temporal data"]
        }

    dates = df['event_date'].dropna()

    if len(dates) == 0:
        return {
            "n_events": 0,
            "date_range": None,
            "span_days": 0,
            "unique_dates": 0,
            "is_sufficient": False,
            "warnings": ["All dates are invalid"]
        }

    date_min = dates.min()
    date_max = dates.max()
    span_days = (date_max - date_min).days
    unique_dates = dates.dt.date.nunique()

    events_per_day = dates.dt.date.value_counts().to_dict()
    temporal_density = len(dates) / span_days if span_days > 0 else 0.0

    warnings = []
    if span_days < 30:
        warnings.append(f"Temporal span is only {span_days} days (minimum 30 recommended)")
    if unique_dates < 10:
        warnings.append(f"Only {unique_dates} unique dates (minimum 10 recommended)")
    if len(dates) < 50:
        warnings.append(f"Only {len(dates)} events (minimum 50 recommended)")

    is_sufficient = len(warnings) == 0

    return {
        "n_events": len(dates),
        "date_range": (str(date_min.date()), str(date_max.date())),
        "span_days": span_days,
        "unique_dates": unique_dates,
        "events_per_day": {str(k): v for k, v in sorted(events_per_day.items())},
        "temporal_density": round(temporal_density, 3),
        "is_sufficient": is_sufficient,
        "warnings": warnings
    }


def load_all_data() -> Tuple[pd.DataFrame, pd.DataFrame, dict]:
    """
    Load all available landslide data and assess feasibility.

    Returns:
        Tuple of (exact_date_df, year_only_df, temporal_assessment)
    """
    exact_df = load_exact_date_events()
    year_df = load_year_only_events()
    assessment = assess_temporal_coverage(exact_df)

    logger.info(f"\n{'='*60}")
    logger.info("DATA LOADING SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"Exact-date events: {assessment['n_events']}")
    logger.info(f"Year-only events: {len(year_df)}")
    logger.info(f"Temporal span: {assessment['span_days']} days")
    logger.info(f"Unique dates: {assessment['unique_dates']}")
    logger.info(f"Sufficient for TTF: {assessment['is_sufficient']}")

    if assessment['warnings']:
        logger.warning("\nWARNINGS:")
        for warning in assessment['warnings']:
            logger.warning(f"  - {warning}")

    logger.info(f"{'='*60}\n")

    return exact_df, year_df, assessment
