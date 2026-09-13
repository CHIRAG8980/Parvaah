import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { DistrictRiskItem } from '../lib/api/types';

export function useDistricts() {
  return useApiQuery<DistrictRiskItem[]>(
    async (signal) => {
      return apiClient.get<DistrictRiskItem[]>('/analytics/districts', { signal });
    },
    [],
    { refetchIntervalMs: 60000 }
  );
}
