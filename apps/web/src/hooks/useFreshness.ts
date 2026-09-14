import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';

export interface FreshnessData {
  data_status: 'LIVE' | 'NEAR_REAL_TIME' | 'STALE' | 'NO_DATA';
  last_prediction_at: string | null;
  prediction_age_minutes: number | null;
  weather_source: string;
  model_version: string;
  model_loaded: boolean;
  preprocessor_loaded: boolean;
  zones_with_predictions: number;
  scheduler_interval_minutes: number;
}

export function useFreshness() {
  return useApiQuery<FreshnessData>(
    async (signal) =>
      apiClient.get<FreshnessData>('/analytics/freshness', { signal }),
    [],
    { refetchIntervalMs: 60_000 }, // poll every 60 seconds
  );
}
