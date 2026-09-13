"""Pydantic schemas for dashboard KPIs and ML performance metrics."""

from pydantic import BaseModel


class KpiMetricItem(BaseModel):
    """Single KPI tile data matching web dashboard requirements."""

    id: str
    label: str
    value: str
    trend: str
    trend_type: str
    comparison: str


class KpiSummaryResponse(BaseModel):
    """Summary KPI tiles for top header of web control room."""

    metrics: list[KpiMetricItem]
    generated_at: str


class DistrictRiskItem(BaseModel):
    """Aggregated landslide risk per district."""

    district: str
    state: str
    risk_level: str
    risk_score: float
    zones_monitored: int
    active_alerts: int


class ModelPerformanceResponse(BaseModel):
    """Model analytics and evaluation indicators."""

    model_version: str
    accuracy_pct: float
    precision_pct: float
    recall_pct: float
    false_alarm_rate_pct: float
    avg_officer_response_time_mins: float
    average_early_lead_time_days: float
    total_predictions_evaluated: int
