"""Data loader with event-level chronological grouping for Pre-Event Lead-Window Classifier"""

from pathlib import Path
from typing import Tuple, List, Dict
import numpy as np
import pandas as pd
from datetime import timedelta

try:
    from .config import LeadWindowConfig, LANDSLIDES_DATED_CSV, RAINFALL_DAILY_CSV
except ImportError:
    from config import LeadWindowConfig, LANDSLIDES_DATED_CSV, RAINFALL_DAILY_CSV


class LeadWindowDataLoader:
    """Extracts pre-event antecedent rainfall feature vectors with strict event-level grouping."""

    def __init__(self, config: LeadWindowConfig = None):
        self.config = config or LeadWindowConfig()

    def load_raw_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        if not LANDSLIDES_DATED_CSV.exists():
            raise FileNotFoundError(f"Dated landslides file missing: {LANDSLIDES_DATED_CSV}")
        if not RAINFALL_DAILY_CSV.exists():
            raise FileNotFoundError(f"IMD rainfall CSV missing: {RAINFALL_DAILY_CSV}")

        ls_df = pd.read_csv(LANDSLIDES_DATED_CSV)
        rain_df = pd.read_csv(RAINFALL_DAILY_CSV)

        ls_df["event_date"] = pd.to_datetime(ls_df["event_date"])
        rain_df["Date"] = pd.to_datetime(rain_df["Date"])
        return ls_df, rain_df

    def _prepare_rainfall_rolling(self, rain_df: pd.DataFrame) -> pd.DataFrame:
        rain_df = rain_df.sort_values(["District", "Date"]).reset_index(drop=True)
        rain_df["rain_1d"] = rain_df["Daily Actual"].fillna(0.0)
        rain_df["rain_3d"] = rain_df.groupby("District")["Daily Actual"].transform(
            lambda s: s.rolling(3, min_periods=1).sum()
        ).fillna(0.0)
        rain_df["rain_7d"] = rain_df.groupby("District")["Daily Actual"].transform(
            lambda s: s.rolling(7, min_periods=1).sum()
        ).fillna(0.0)
        rain_df["rain_14d"] = rain_df.groupby("District")["Daily Actual"].transform(
            lambda s: s.rolling(14, min_periods=1).sum()
        ).fillna(0.0)
        rain_df["rain_30d"] = rain_df.groupby("District")["Daily Actual"].transform(
            lambda s: s.rolling(30, min_periods=1).sum()
        ).fillna(0.0)
        return rain_df

    def build_event_grouped_dataset(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Partition unique historical landslide events chronologically.
        Guarantees that all lead-window samples (T-1, T-3, T-7, T-14) of an event
        stay strictly within that event's split partition.
        """
        ls_df, rain_df = self.load_raw_data()
        rain_df = self._prepare_rainfall_rolling(rain_df)
        rain_lookup = rain_df.set_index(["District", "Date"])

        # Assign unique event_id if not present
        if "event_id" not in ls_df.columns:
            ls_df["event_id"] = np.arange(len(ls_df))

        # Chronological split of unique events
        # Train: <= 2021, Val: 2022, Test: 2023-2024
        train_events_df = ls_df[ls_df["event_date"].dt.year <= 2021].copy()
        val_events_df = ls_df[ls_df["event_date"].dt.year == 2022].copy()
        test_events_df = ls_df[ls_df["event_date"].dt.year >= 2023].copy()

        def extract_samples_for_events(events_df: pd.DataFrame, date_min, date_max) -> pd.DataFrame:
            samples = []
            event_district_dates = set()

            for _, row in events_df.iterrows():
                edate = row["event_date"]
                dist = row["district"] if "district" in row and pd.notnull(row["district"]) else "East Khasi Hills"
                eid = int(row["event_id"])

                # Imminent Window (Class 2): T-0 to T-3
                for offset in [0, 1, 2, 3]:
                    t_date = edate - timedelta(days=offset)
                    if (dist, t_date) in rain_lookup.index:
                        r_row = rain_lookup.loc[(dist, t_date)]
                        if isinstance(r_row, pd.DataFrame):
                            r_row = r_row.iloc[0]
                        samples.append({
                            "date": t_date,
                            "district": dist,
                            "rainfall_1d": float(r_row["rain_1d"]),
                            "rainfall_3d": float(r_row["rain_3d"]),
                            "rainfall_7d": float(r_row["rain_7d"]),
                            "rainfall_14d": float(r_row["rain_14d"]),
                            "rainfall_30d": float(r_row["rain_30d"]),
                            "label": 2,  # Imminent
                            "event_id": eid
                        })
                        event_district_dates.add((dist, t_date.date()))

                # Elevated Saturation Window (Class 1): T-4 to T-14
                for offset in [4, 7, 10, 14]:
                    t_date = edate - timedelta(days=offset)
                    if (dist, t_date) in rain_lookup.index:
                        r_row = rain_lookup.loc[(dist, t_date)]
                        if isinstance(r_row, pd.DataFrame):
                            r_row = r_row.iloc[0]
                        samples.append({
                            "date": t_date,
                            "district": dist,
                            "rainfall_1d": float(r_row["rain_1d"]),
                            "rainfall_3d": float(r_row["rain_3d"]),
                            "rainfall_7d": float(r_row["rain_7d"]),
                            "rainfall_14d": float(r_row["rain_14d"]),
                            "rainfall_30d": float(r_row["rain_30d"]),
                            "label": 1,  # Elevated
                            "event_id": eid
                        })
                        event_district_dates.add((dist, t_date.date()))

            # Baseline Non-Event Days (Class 0) sampled strictly within the temporal period
            period_rain = rain_df[(rain_df["Date"] >= date_min) & (rain_df["Date"] <= date_max)]
            n_base_target = len(samples) // 2
            all_districts = period_rain["District"].unique()

            base_samples = []
            for dist in all_districts:
                d_rain = period_rain[period_rain["District"] == dist]
                cand = d_rain[~d_rain["Date"].dt.date.isin([d for dst, d in event_district_dates if dst == dist])]
                if len(cand) > 0:
                    sampled_cand = cand.sample(min(len(cand), max(1, n_base_target // len(all_districts))), random_state=42)
                    for _, r_row in sampled_cand.iterrows():
                        base_samples.append({
                            "date": r_row["Date"],
                            "district": dist,
                            "rainfall_1d": float(r_row["rain_1d"]),
                            "rainfall_3d": float(r_row["rain_3d"]),
                            "rainfall_7d": float(r_row["rain_7d"]),
                            "rainfall_14d": float(r_row["rain_14d"]),
                            "rainfall_30d": float(r_row["rain_30d"]),
                            "label": 0,  # Baseline
                            "event_id": -1
                        })

            return pd.DataFrame(samples + base_samples)

        train_df = extract_samples_for_events(train_events_df, pd.to_datetime("2014-01-01"), pd.to_datetime("2021-12-31"))
        val_df = extract_samples_for_events(val_events_df, pd.to_datetime("2022-01-01"), pd.to_datetime("2022-12-31"))
        test_df = extract_samples_for_events(test_events_df, pd.to_datetime("2023-01-01"), pd.to_datetime("2024-12-31"))

        return (
            train_df.sample(frac=1.0, random_state=42).reset_index(drop=True),
            val_df.sample(frac=1.0, random_state=42).reset_index(drop=True),
            test_df.sample(frac=1.0, random_state=42).reset_index(drop=True)
        )

    def prepare_dataset(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        return self.build_event_grouped_dataset()
