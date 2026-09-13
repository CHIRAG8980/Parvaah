export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RoadStatus = 'operational' | 'at_risk' | 'blocked';
export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type AlertStatus = 'pending_review' | 'approved' | 'rejected' | 'auto_escalated' | 'resolved';

export interface ExplainabilityFactors {
  slope_degrees: number;
  rainfall24h_mm: number;
  rainfall72h_cumulative_mm: number;
  insar_deformation_mm_yr: number;
  ndvi_index: number;
  soil_moisture_pct: number;
  top_factors: string[];
}

export interface VillageResponse {
  location_id: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  population_estimate: number;
}

export interface HistoricalLandslideEvent {
  event_id: string;
  event_date: string;
  landslide_type: string;
  trigger_cause: string;
  casualties: number;
  infrastructure_damage_desc: string;
}

export interface ZoneSummaryResponse {
  zone_id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  avg_slope_deg: number;
  avg_elevation_m: number;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: ConfidenceLevel;
  time_to_failure_window: string | null;
  created_at?: string;
}

export interface ZoneDetailResponse extends ZoneSummaryResponse {
  factors: ExplainabilityFactors;
  infrastructures: VillageResponse[];
  historical_events: HistoricalLandslideEvent[];
}

export interface AlertQueueItem {
  alert_id: string;
  title: string;
  zone_id: string;
  zone_name: string;
  district: string;
  state: string;
  severity: AlertSeverity;
  status: AlertStatus;
  draft_message: string;
  risk_score_numeric: number;
  seconds_until_escalation: number;
  escalation_level: string;
  created_at: string;
  factors: ExplainabilityFactors;
  suggested_actions: string[];
  dissemination_channels: string[];
}

export interface AlertApproveRequest {
  officer_id: string;
  final_message: string;
  selected_channels: string[];
}

export interface AlertRejectRequest {
  officer_id: string;
  reason_code: string;
  notes: string;
}

export interface ActiveAlertMobileResponse {
  alert_id: string;
  severity: AlertSeverity;
  headline: string;
  body_text: string;
  language: string;
  issued_at: string;
  zone_name: string;
  district: string;
}

export * from './road-types';


export interface DayForecastItem {
  day_label: string;
  date_str: string;
  projected_rainfall_mm: number;
  predicted_risk_level: RiskLevel;
  weather_condition: string;
  temp_c: number;
}

export interface HourlyPrecipitationItem {
  hour_label: string;
  rainfall_mm: number;
  is_projected: boolean;
}

export interface WeatherForecastResponse {
  zone_id: string;
  zone_name: string;
  district: string;
  state: string;
  rainfall_24h_mm: number;
  cumulative_72h_mm: number;
  forecast_days: DayForecastItem[];
  hourly_trend: HourlyPrecipitationItem[];
  imd_radar_station: string;
  active_community_gauges_count: number;
  last_updated: string;
}

export interface DataSourceItem {
  source_id: string;
  name: string;
  status: string;
  last_sync: string;
  latency_ms: number;
  confidence_score: number;
  usable_records_pct: number;
  remarks: string;
}

export interface DataSourcesHealthResponse {
  overall_status: string;
  total_sources: number;
  active_sources: number;
  stale_sources_count: number;
  sources: DataSourceItem[];
}

export interface KpiMetricItem {
  id: string;
  label: string;
  value: string;
  trend: string;
  trend_type: 'increase-danger' | 'neutral' | 'decrease-good';
  comparison: string;
}

export interface KpiSummaryResponse {
  metrics: KpiMetricItem[];
  generated_at: string;
}

export interface DistrictRiskItem {
  district: string;
  state: string;
  risk_level: RiskLevel;
  risk_score: number;
  zones_monitored: number;
  active_alerts: number;
}

export * from './auth-types';

