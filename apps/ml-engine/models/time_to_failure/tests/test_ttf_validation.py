"""
Test suite for TTF data loading and temporal assessment.
"""
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import sys

from ttf.data_loader import assess_temporal_coverage
from ttf.target_definition import TimeToFailureTarget
from ttf.validation import TTFValidation


class TestTemporalAssessment:
    """Test temporal coverage assessment."""

    def test_sufficient_data(self):
        """Test with sufficient temporal data."""
        dates = pd.date_range('2024-01-01', periods=100, freq='D')
        df = pd.DataFrame({'event_date': dates})

        assessment = assess_temporal_coverage(df)

        assert assessment['n_events'] == 100
        assert assessment['span_days'] == 99
        assert assessment['unique_dates'] == 100
        assert assessment['is_sufficient'] is True

    def test_insufficient_span(self):
        """Test with insufficient temporal span."""
        dates = pd.date_range('2024-01-01', periods=10, freq='D')
        df = pd.DataFrame({'event_date': dates})

        assessment = assess_temporal_coverage(df)

        assert assessment['span_days'] == 9
        assert assessment['is_sufficient'] is False
        assert any('span' in w.lower() for w in assessment['warnings'])

    def test_insufficient_events(self):
        """Test with too few events."""
        dates = pd.date_range('2024-01-01', periods=20, freq='D')
        df = pd.DataFrame({'event_date': dates})

        assessment = assess_temporal_coverage(df)

        assert assessment['n_events'] == 20
        assert assessment['is_sufficient'] is False

    def test_empty_dataframe(self):
        """Test with empty dataframe."""
        df = pd.DataFrame()

        assessment = assess_temporal_coverage(df)

        assert assessment['n_events'] == 0
        assert assessment['is_sufficient'] is False


class TestTargetDefinition:
    """Test TTF target construction."""

    def test_compute_ttf(self):
        """Test basic TTF computation."""
        reference = datetime(2024, 1, 1)
        dates = pd.Series([
            datetime(2024, 1, 5),
            datetime(2024, 1, 10),
            datetime(2024, 1, 15),
        ])

        target = TimeToFailureTarget(reference_date=reference)
        ttf = target.compute_ttf(dates)

        assert list(ttf) == [4, 9, 14]

    def test_negative_ttf_removed(self):
        """Test that past events are removed."""
        reference = datetime(2024, 1, 10)
        dates = pd.Series([
            datetime(2024, 1, 5),   # Past
            datetime(2024, 1, 15),  # Future
            datetime(2024, 1, 20),  # Future
        ])

        target = TimeToFailureTarget(reference_date=reference)
        ttf = target.compute_ttf(dates)

        assert len(ttf) == 2  # Only future events
        assert all(ttf >= 0)

    def test_validate_target_construction(self):
        """Test target validation."""
        df = pd.DataFrame({
            'event_date': pd.date_range('2024-01-01', periods=10, freq='D')
        })

        target = TimeToFailureTarget()
        report = target.validate_target_construction(df)

        assert report['valid'] is True
        assert 'stats' in report


class TestValidation:
    """Test validation suite."""

    def test_sample_size_validation(self):
        """Test sample size check."""
        validator = TTFValidation(min_events=50)

        # Sufficient
        df_large = pd.DataFrame({'event_date': pd.date_range('2024-01-01', periods=60, freq='D')})
        result = validator.validate_sample_size(df_large)
        assert result['passed'] is True

        # Insufficient
        df_small = pd.DataFrame({'event_date': pd.date_range('2024-01-01', periods=20, freq='D')})
        result = validator.validate_sample_size(df_small)
        assert result['passed'] is False

    def test_temporal_span_validation(self):
        """Test temporal span check."""
        validator = TTFValidation()

        # Sufficient span and diversity
        df = pd.DataFrame({
            'event_date': pd.date_range('2024-01-01', periods=50, freq='D')
        })
        result = validator.validate_temporal_span(df)
        assert result['passed'] is True

        # Insufficient span
        df_short = pd.DataFrame({
            'event_date': pd.date_range('2024-01-01', periods=10, freq='D')
        })
        result = validator.validate_temporal_span(df_short)
        assert result['passed'] is False

    def test_temporal_leakage_detection(self):
        """Test temporal leakage check."""
        validator = TTFValidation()

        # No leakage
        train_dates = pd.Series(pd.date_range('2024-01-01', periods=10, freq='D'))
        test_dates = pd.Series(pd.date_range('2024-01-15', periods=5, freq='D'))
        result = validator.check_temporal_leakage(train_dates, test_dates)
        assert result['passed'] is True

        # Leakage present
        train_dates_leak = pd.Series(pd.date_range('2024-01-01', periods=20, freq='D'))
        test_dates_leak = pd.Series(pd.date_range('2024-01-15', periods=5, freq='D'))
        result = validator.check_temporal_leakage(train_dates_leak, test_dates_leak)
        assert result['passed'] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
