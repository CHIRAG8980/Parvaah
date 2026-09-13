"""API endpoints for data source health and confidence monitoring."""

from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.datasource import DataSourcesHealthResponse, DataSourceItem

router = APIRouter(prefix="/datasources", tags=["Data Sources"])


@router.get("/health", response_model=DataSourcesHealthResponse)
def get_datasources_health():
    """Monitor freshness, latency, and reliability of external ingestion pipelines."""
    sources = [
        DataSourceItem(
            source_id="src-imd-radar",
            name="IMD Doppler Radar & Gridded Rainfall",
            status="Operational",
            last_sync="4 mins ago",
            latency_ms=120,
            confidence_score=0.96,
            usable_records_pct=99.4,
            remarks="Normal telemetry reception across North East meteorological centres.",
        ),
        DataSourceItem(
            source_id="src-sentinel-1",
            name="Sentinel-1 SAR / InSAR Ground Deformation",
            status="Operational",
            last_sync="2 days ago (Cycle Pass #144)",
            latency_ms=850,
            confidence_score=0.88,
            usable_records_pct=92.1,
            remarks="Phase coherence satisfactory over non-dense canopy slopes.",
        ),
        DataSourceItem(
            source_id="src-sentinel-2",
            name="Sentinel-2 Multispectral NDVI (Vegetation Stress)",
            status="Degraded",
            last_sync="4 days ago",
            latency_ms=1420,
            confidence_score=0.74,
            usable_records_pct=68.5,
            remarks="Monsoon cloud cover obscuring southern Meghalaya escparpments.",
        ),
        DataSourceItem(
            source_id="src-comm-gauges",
            name="Community Rain-Gauge Telemetry Network (NGO/Panchayat)",
            status="Operational",
            last_sync="12 mins ago",
            latency_ms=310,
            confidence_score=0.91,
            usable_records_pct=95.0,
            remarks="18 out of 19 deployed local IoT gauges reporting real-time tips.",
        ),
        DataSourceItem(
            source_id="src-nrsc-gsi",
            name="NRSC / GSI Landslide Inventory & Susceptibility Basemap",
            status="Operational",
            last_sync="14 days ago",
            latency_ms=640,
            confidence_score=0.95,
            usable_records_pct=100.0,
            remarks="Historical polygon basemap synchronized with National Disaster Registry.",
        ),
    ]

    return DataSourcesHealthResponse(
        overall_status="Normal Monitoring Active",
        total_sources=len(sources),
        active_sources=4,
        stale_sources_count=1,
        sources=sources,
    )


@router.get("/confidence")
def get_datasources_confidence():
    """Retrieve summarized confidence indicators across data layers."""
    return {
        "fusion_confidence_index": 0.89,
        "satellite_coherence_index": 0.82,
        "meteorological_confidence_index": 0.95,
        "ground_truth_validation_pct": 91.0,
        "last_evaluated": datetime.now(timezone.utc).isoformat(),
    }
