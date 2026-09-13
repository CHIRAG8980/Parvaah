#!/usr/bin/env python3
"""
Extract validated day-level landslide event timestamps from ISRO NRSC Landslide Atlas.
No synthetic dates or midpoint assumptions are made.
Only regex-matched day-month-year occurrences from institutional records are extracted.
"""

import csv
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
INPUT_FILE = BASE_DIR / "data" / "raw" / "ground_truth" / "isro_nrsc_landslide_atlas" / "meghalaya_landslides_clean.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "dynamic_hazard" / "landslides_exact_date_matched.csv"

MONTHS = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12"
}

DATE_PATTERNS = [
    r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+(\d{4})',
]

DISTRICT_KEYWORDS = [
    ('Eastern-West Khasi Hill', 'West Khasi Hills'),
    ('Eastern West Khasi Hills', 'West Khasi Hills'),
    ('East Khasi Hills', 'East Khasi Hills'),
    ('South West Khasi Hills', 'South West Khasi Hills'),
    ('West Khasi Hills', 'West Khasi Hills'),
    ('Ri-Bhoi', 'Ri-Bhoi'),
    ('Ri Bhoi', 'Ri-Bhoi'),
    ('South Garo Hills', 'South Garo Hills'),
    ('North Garo Hills', 'North Garo Hills'),
    ('East Garo Hills', 'East Garo Hills'),
    ('West Garo Hills', 'West Garo Hills'),
]

def extract_dates():
    print(f"Reading from: {INPUT_FILE}")
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    matched_events = []

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            source_row = row.get("source_row", "")
            found_date = None

            for pattern in DATE_PATTERNS:
                match = re.search(pattern, source_row, re.IGNORECASE)
                if match:
                    day = match.group(1).zfill(2)
                    month_name = match.group(2).lower()
                    year = match.group(3)
                    month = MONTHS.get(month_name)
                    if month:
                        found_date = f"{year}-{month}-{day}"
                        break

            if found_date:
                matched_district = "Unknown"
                for pattern_str, standard_name in DISTRICT_KEYWORDS:
                    if pattern_str.lower() in source_row.lower():
                        matched_district = standard_name
                        break

                matched_events.append({
                    "source_line": row.get("source_line", ""),
                    "latitude": row.get("latitude", ""),
                    "longitude": row.get("longitude", ""),
                    "district": matched_district,
                    "event_date": found_date,
                    "event_year": found_date.split("-")[0],
                    "date_precision": "day",
                    "source_row": source_row,
                    "event_datetime": found_date,
                    "grid_lat_idx": row.get("grid_lat_idx", "0"),
                    "grid_lon_idx": row.get("grid_lon_idx", "0"),
                    "grid_distance_km": row.get("grid_distance_km", "0.0")
                })

    print(f"Extracted {len(matched_events)} real dated events.")
    unique_dates = sorted(list(set(e["event_date"] for e in matched_events)))
    print(f"Unique dates ({len(unique_dates)}): {unique_dates[0]} to {unique_dates[-1]}")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        fieldnames = [
            "source_line", "latitude", "longitude", "district", "event_date", "event_year",
            "date_precision", "source_row", "event_datetime", "grid_lat_idx",
            "grid_lon_idx", "grid_distance_km"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(matched_events)

    print(f"Successfully saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    extract_dates()
