import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { DataSourcesHealthResponse } from '../lib/api/types';

export function useDataSources() {
  return useApiQuery<DataSourcesHealthResponse>(
    async (signal) => {
      return apiClient.get<DataSourcesHealthResponse>('/datasources/health', { signal });
    },
    [],
    { refetchIntervalMs: 30000 }
  );
}
