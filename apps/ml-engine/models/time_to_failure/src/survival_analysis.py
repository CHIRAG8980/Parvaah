"""
Survival analysis for interval-censored landslide data.
Alternative to exact-date TTF when only year-level information available.
"""
import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def assess_censoring_feasibility(
    exact_df: pd.DataFrame,
    year_df: pd.DataFrame
) -> dict:
    """
    Assess whether survival analysis with censoring is feasible.

    Args:
        exact_df: Events with exact dates
        year_df: Events with year-only information

    Returns:
        Feasibility assessment
    """
    n_exact = len(exact_df)
    n_year_only = len(year_df)
    n_total = n_exact + n_year_only

    censoring_rate = n_year_only / n_total if n_total > 0 else 0

    assessment = {
        "n_exact": n_exact,
        "n_year_only": n_year_only,
        "n_total": n_total,
        "censoring_rate": round(censoring_rate, 3),
        "feasible": False,
        "rationale": None,
        "recommendations": []
    }

    # Survival analysis typically needs at least 30-50 events total
    if n_total < 30:
        assessment["rationale"] = (
            f"Insufficient total events for survival analysis: {n_total} (need ~50)"
        )
        assessment["recommendations"].append(
            "Collect more historical landslide data with any temporal information"
        )
        return assessment

    # If censoring rate is too high (>80%), estimates become unreliable
    if censoring_rate > 0.8:
        assessment["rationale"] = (
            f"Censoring rate too high: {censoring_rate*100:.1f}% "
            "(survival estimates unreliable above 80%)"
        )
        assessment["recommendations"].append(
            "Prioritize obtaining exact dates for recent events"
        )
        return assessment

    # If we have reasonable data
    if n_total >= 30 and censoring_rate <= 0.8:
        assessment["feasible"] = True
        assessment["rationale"] = (
            f"Survival analysis may be feasible with {n_total} events "
            f"and {censoring_rate*100:.1f}% censoring rate"
        )
        assessment["recommendations"].append(
            "Implement Kaplan-Meier or Cox proportional hazards with interval censoring"
        )
        assessment["recommendations"].append(
            "Use specialized packages: lifelines, scikit-survival, or survival (R)"
        )

    return assessment


def create_interval_censored_data(
    year_df: pd.DataFrame,
    reference_year: int = 2010
) -> pd.DataFrame:
    """
    Convert year-only events to interval-censored format.

    Each year-only event is known to occur within [Jan 1, Dec 31] of that year.

    Args:
        year_df: DataFrame with event_year column
        reference_year: Reference year for time-to-event calculation

    Returns:
        DataFrame with (time_left, time_right) intervals
    """
    if 'event_year' not in year_df.columns:
        raise ValueError("year_df must have 'event_year' column")

    result = year_df.copy()

    # Convert year to interval in years from reference
    result['time_left'] = result['event_year'] - reference_year
    result['time_right'] = result['time_left'] + 1  # End of year

    # Flag as interval-censored
    result['censoring_type'] = 'interval'

    logger.info(
        f"Created interval-censored data for {len(result)} year-only events "
        f"(reference: {reference_year})"
    )

    return result


def create_survival_dataframe(
    exact_df: pd.DataFrame,
    year_df: pd.DataFrame,
    reference_date: pd.Timestamp
) -> pd.DataFrame:
    """
    Combine exact and year-only events into unified survival analysis format.

    Args:
        exact_df: Events with exact dates
        year_df: Events with year-only dates
        reference_date: Reference date for time calculations

    Returns:
        Combined DataFrame in survival format
    """
    # Exact events: point observations
    exact_survival = []
    if not exact_df.empty and 'event_date' in exact_df.columns:
        exact_copy = exact_df.copy()
        exact_copy['time_years'] = (exact_copy['event_date'] - reference_date).dt.days / 365.25
        exact_copy['censoring_type'] = 'exact'
        exact_copy['time_left'] = exact_copy['time_years']
        exact_copy['time_right'] = exact_copy['time_years']
        exact_survival.append(exact_copy)

    # Year-only events: interval-censored
    year_survival = []
    if not year_df.empty:
        reference_year = reference_date.year
        year_censored = create_interval_censored_data(year_df, reference_year)
        year_survival.append(year_censored)

    # Combine
    all_survival = pd.concat(exact_survival + year_survival, ignore_index=True)

    logger.info(
        f"Created survival dataframe: {len(all_survival)} events "
        f"({len(exact_survival[0]) if exact_survival else 0} exact, "
        f"{len(year_survival[0]) if year_survival else 0} interval-censored)"
    )

    return all_survival


def generate_survival_report(assessment: dict, output_path: Optional[str] = None) -> str:
    """
    Generate survival analysis feasibility report.

    Args:
        assessment: From assess_censoring_feasibility
        output_path: Where to save report (optional)

    Returns:
        Report text
    """
    lines = [
        "# Survival Analysis Feasibility Report",
        "",
        "## Data Summary",
        f"- **Exact-date events:** {assessment['n_exact']}",
        f"- **Year-only events:** {assessment['n_year_only']}",
        f"- **Total events:** {assessment['n_total']}",
        f"- **Censoring rate:** {assessment['censoring_rate']*100:.1f}%",
        "",
        "## Feasibility Assessment",
        f"**Is survival analysis feasible?** {'✓ YES' if assessment['feasible'] else '✗ NO'}",
        "",
        assessment['rationale'],
        "",
    ]

    if assessment['recommendations']:
        lines.extend([
            "## Recommendations",
            ""
        ])
        for i, rec in enumerate(assessment['recommendations'], 1):
            lines.append(f"{i}. {rec}")
        lines.append("")

    lines.extend([
        "## Statistical Notes",
        "",
        "### Interval Censoring",
        "Year-only events can be treated as **interval-censored** observations:",
        "- Event known to occur within [Jan 1, Dec 31] of the specified year",
        "- Requires specialized survival models (not standard Kaplan-Meier)",
        "- Python: `lifelines`, R: `survival` package with `Surv(time, time2, type='interval2')`",
        "",
        "### Sample Size Requirements",
        "- Minimum ~30 total events for basic survival curves",
        "- ~50-100 events for regression with covariates (Cox model)",
        "- Censoring rate should be below 80% for reliable estimates",
        "",
        "### Recommended Approaches",
        "1. **Kaplan-Meier with interval censoring:** Non-parametric survival curves",
        "2. **Cox proportional hazards:** Semi-parametric regression with covariates",
        "3. **Parametric models (Weibull, log-normal):** If data fits distributional assumptions",
        "",
        "---",
        "*Generated by TTF survival analysis module*"
    ])

    report = "\n".join(lines)

    if output_path:
        with open(output_path, 'w') as f:
            f.write(report)
        logger.info(f"Saved survival analysis report to {output_path}")

    return report


# Note: Actual survival model implementation would require additional libraries
# (lifelines, scikit-survival) which should be added to requirements.txt if needed
