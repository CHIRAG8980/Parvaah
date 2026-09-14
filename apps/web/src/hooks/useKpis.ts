import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { KpiSummaryResponse } from '../lib/api/types';

export function useKpis(district?: string) {
  const cleanDistrict = district && district !== 'All' && district !== 'All Districts' ? district : undefined;
  return useApiQuery<KpiSummaryResponse>(
    async (signal) => {
      const params: Record<string, string> = {};
      if (cleanDistrict) params.district = cleanDistrict;
      return apiClient.get<KpiSummaryResponse>('/analytics/kpis', { params, signal });
    },
    [cleanDistrict],
    { refetchIntervalMs: 30000 }
  );
}
