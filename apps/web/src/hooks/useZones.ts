import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { ZoneSummaryResponse, ZoneDetailResponse } from '../lib/api/types';

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
