import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { apiClient } from '../lib/api/client';
import { SystemSettings, SystemSettingsUpdateRequest } from '../lib/api/types';

export function useSettings() {
  const query = useApiQuery<SystemSettings>(
    async (signal) => {
      return apiClient.get<SystemSettings>('/settings', { signal });
    },
    []
  );

  const mutation = useApiMutation<SystemSettings, SystemSettingsUpdateRequest>(
    async (payload: SystemSettingsUpdateRequest) => {
      return apiClient.put<SystemSettings>('/settings', payload);
    },
    {
      onSuccess: () => {
        query.refetch();
      },
    }
  );

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}
