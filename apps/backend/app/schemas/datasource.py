"""Pydantic schemas for data source health and confidence monitoring."""

from pydantic import BaseModel


class DataSourceItem(BaseModel):
    """Status record for an external ingestion pipeline."""

    source_id: str
    name: str
    status: str
    last_sync: str
    latency_ms: int
    confidence_score: float
    usable_records_pct: float
    remarks: str


class DataSourcesHealthResponse(BaseModel):
    """Health monitor response for the web control room."""

    overall_status: str
    total_sources: int
    active_sources: int
    stale_sources_count: int
    sources: list[DataSourceItem]
