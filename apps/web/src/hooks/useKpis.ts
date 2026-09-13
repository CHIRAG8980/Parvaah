import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { KpiSummaryResponse } from '../lib/api/types';

export function useKpis() {
  return useApiQuery<KpiSummaryResponse>(
    async (signal) => {
      return apiClient.get<KpiSummaryResponse>('/analytics/kpis', { signal });
    },
    [],
    { refetchIntervalMs: 30000 }
  );
}
