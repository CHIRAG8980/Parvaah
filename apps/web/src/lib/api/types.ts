export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OUT_OF_COVERAGE';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'OUT_OF_COVERAGE' | 'out_of_coverage';
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
  historical_condition_window?: string | null;
  time_to_failure_window: string | null;
  created_at?: string;
}

export interface LandslideHeatmapResponse {
  points: [number, number, number][]; // [lat, lng, intensity]
  count: number;
  source: string;
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

export interface SystemSettings {
  rainfall_warning: number;
  rainfall_critical: number;
  insar_velocity: number;
  soil_saturation: number;
  seismic_threshold: number;
  channels: {
    ndmaCap: boolean;
    whatsappSdma: boolean;
    smsDisasterRelay: boolean;
    broRadioPush: boolean;
    sirenCivilDefense: boolean;
    emailBulletin: boolean;
  };
  aws_poll_rate: string;
  insar_sync_interval: string;
  inclinometer_heartbeat: string;
  edge_failover: boolean;
  updated_at: string;
}

export interface SystemSettingsUpdateRequest {
  rainfall_warning?: number;
  rainfall_critical?: number;
  insar_velocity?: number;
  soil_saturation?: number;
  seismic_threshold?: number;
  channels?: {
    ndmaCap: boolean;
    whatsappSdma: boolean;
    smsDisasterRelay: boolean;
    broRadioPush: boolean;
    sirenCivilDefense: boolean;
    emailBulletin: boolean;
  };
  aws_poll_rate?: string;
  insar_sync_interval?: string;
  inclinometer_heartbeat?: string;
  edge_failover?: boolean;
}

export * from './auth-types';

export interface StaticSusceptibilityDetails {
  score: number | null;
  category: string;
  status: string;
  model_type: string;
  features: Record<string, number | null>;
}

export interface DynamicHazardDetails {
  score: number | null;
  trigger_state: string;
  confidence: number | null;
  status: string;
  model_type: string;
  rainfall_24h_mm: number;
  rainfall_72h_mm: number;
  rainfall_antecedent_7d_mm: number;
}

export interface LeadWindowDetails {
  condition_class: number | null;
  similarity_score: number | null;
  description: string;
  historical_condition_window?: string | null;
  lead_days_min: number | null;
  lead_days_max: number | null;
  status: string;
  model_type: string;
}

export interface FusionDetails {
  score: number | null;
  risk_level: string;
  confidence_score: number | null;
  confidence_level: string | null;
  status: string;
  model_type: string;
}

export interface ModelsBreakdown {
  static_susceptibility: StaticSusceptibilityDetails;
  dynamic_hazard: DynamicHazardDetails;
  lead_window: LeadWindowDetails;
  fusion: FusionDetails;
}

export interface DataSourceTelemetryItem {
  source?: string;
  status?: string;
  quality?: string;
  coherence?: number | null;
  deformation_mm?: number | null;
  los_deformation_m?: number | null;
  fusion_weight?: number | null;
  resolution?: string;
  soil_moisture_pct?: number | null;
  coverage?: string;
  detail?: string;
  [key: string]: string | number | boolean | null | undefined | string[];
}

export interface DataAvailabilityMap {
  operational_provenance?: string;
  geographic_coverage?: DataSourceTelemetryItem;
  topography_cartodem?: DataSourceTelemetryItem;
  geology_bhuvan?: DataSourceTelemetryItem;
  meteorology_imd?: DataSourceTelemetryItem;
  insar_nisar?: DataSourceTelemetryItem;
  soil_moisture_eos04?: DataSourceTelemetryItem;
  foreign_sources_policy?: {
    status?: string;
    sources?: string[];
  };
  [key: string]: DataSourceTelemetryItem | { status?: string; sources?: string[] } | string | undefined;
}

export interface UnifiedRiskPredictionResponse {
  zone_id: string;
  zone_name?: string | null;
  risk_score: number | null;
  risk_level: RiskLevel;
  confidence?: ConfidenceLevel | null;
  confidence_score: number | null;
  historical_condition_window?: string | null;
  time_to_failure_window?: string | null;
  time_to_failure_min_days?: number | null;
  time_to_failure_max_days?: number | null;
  models: ModelsBreakdown;
  data_availability: DataAvailabilityMap;
  contributing_factors: string[];
  model_version: string;
  model_loaded: boolean;
  preprocessor_loaded: boolean;
  data_source: string;
  rainfall_reading_timestamp?: string | null;
  prediction_computed_at: string;
  risk_score_id: string;
  feature_importances: Record<string, number>;
  explainability: ExplainabilityFactors;
}

