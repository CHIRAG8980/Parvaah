import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import {
  ZoneSummaryResponse,
  ZoneDetailResponse,
  UnifiedRiskPredictionResponse,
  LandslideHeatmapResponse,
} from '../lib/api/types';

export function useZones(filters?: { district?: string; state?: string }) {
  const district = filters?.district && filters.district !== 'All' ? filters.district : undefined;
  const state = filters?.state && filters.state !== 'All' && filters.state !== 'All States' ? filters.state : undefined;

  const query = useApiQuery<ZoneSummaryResponse[]>(
    async (signal) => {
      const params: Record<string, string> = {};
      if (district) params.district = district;
      if (state) params.state = state;
      return apiClient.get<ZoneSummaryResponse[]>('/zones', { params, signal });
    },
    [district, state],
    { refetchIntervalMs: 60000 }
  );

  return {
    ...query,
    zones: query.data || [],
  };
}

export function useZoneDetail(zoneId?: string) {
  return useApiQuery<ZoneDetailResponse>(
    async (signal) => {
      if (!zoneId) throw new Error('Zone ID is required');
      return apiClient.get<ZoneDetailResponse>(`/zones/${zoneId}/detail`, { signal });
    },
    [zoneId],
    { enabled: Boolean(zoneId) }
  );
}

export function useLandslideHeatmap(district?: string) {
  const cleanDistrict = district && district !== 'All' && district !== 'All Districts' ? district : undefined;
  return useApiQuery<LandslideHeatmapResponse>(
    async (signal) => {
      const params: Record<string, string> = {};
      if (cleanDistrict) params.district = cleanDistrict;
      return apiClient.get<LandslideHeatmapResponse>('/zones/heatmap', { params, signal });
    },
    [cleanDistrict],
    { refetchIntervalMs: 60000 }
  );
}

export function useZonePrediction(zoneId?: string) {
  return useApiQuery<UnifiedRiskPredictionResponse>(
    async (signal) => {
      if (!zoneId) throw new Error('Zone ID is required');
      return apiClient.get<UnifiedRiskPredictionResponse>(`/predict/zone/${zoneId}`, { signal });
    },
    [zoneId],
    { enabled: Boolean(zoneId), refetchIntervalMs: 60000 }
  );
}

export function useModelVersion() {
  return useApiQuery<Record<string, unknown>>(
    async (signal) => {
      return apiClient.get<Record<string, unknown>>('/predict/model/version', { signal });
    },
    [],
    { refetchIntervalMs: 120000 }
  );
}


