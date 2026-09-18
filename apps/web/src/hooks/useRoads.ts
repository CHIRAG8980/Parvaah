import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { apiClient } from '../lib/api/client';
import { RoadSegmentResponse, RerouteRequest, RerouteResponse } from '../lib/api/types';

export function useRoads(filters?: { district?: string; zoneId?: string }) {
  const district = filters?.district && filters.district !== 'All' ? filters.district : undefined;
  const zoneId = filters?.zoneId && filters.zoneId !== 'All' ? filters.zoneId : undefined;

  const query = useApiQuery<RoadSegmentResponse[]>(
    async (signal) => {
      const params: Record<string, string> = {};
      if (district) params.district = district;
      if (zoneId) params.zone_id = zoneId;
      return apiClient.get<RoadSegmentResponse[]>('/roads', { params, signal });
    },
    [district, zoneId],
    { refetchIntervalMs: 30000 }
  );

  const rerouteMutation = useApiMutation<RerouteResponse, RerouteRequest>(
    async (request) => {
      return apiClient.post<RerouteResponse>('/roads/reroute', request);
    }
  );

  return {
    ...query,
    roads: query.data || [],
    calculateReroute: rerouteMutation.mutate,
    isRerouting: rerouteMutation.isPending,
    rerouteResult: rerouteMutation.data,
  };
}
