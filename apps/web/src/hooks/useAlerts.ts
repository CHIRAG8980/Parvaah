import { useCallback } from 'react';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { apiClient } from '../lib/api/client';
import {
  AlertQueueItem,
  AlertApproveRequest,
  AlertRejectRequest,
  ActiveAlertMobileResponse,
} from '../lib/api/types';

export function useAlertQueue(statusFilter?: string) {
  const query = useApiQuery<AlertQueueItem[]>(
    async (signal) => {
      const params = statusFilter && statusFilter !== 'All' ? { status: statusFilter.toLowerCase() } : undefined;
      return apiClient.get<AlertQueueItem[]>('/alerts/queue', { params, signal });
    },
    [statusFilter],
    { refetchIntervalMs: 15000 }
  );

  const approveMutation = useApiMutation<{ status: string; message: string }, { alertId: string; request: AlertApproveRequest }>(
    async ({ alertId, request }) => {
      return apiClient.post<{ status: string; message: string }>(`/alerts/${alertId}/approve`, request);
    },
    {
      onSuccess: () => {
        query.refetch();
      },
    }
  );

  const rejectMutation = useApiMutation<{ status: string; message: string }, { alertId: string; request: AlertRejectRequest }>(
    async ({ alertId, request }) => {
      return apiClient.post<{ status: string; message: string }>(`/alerts/${alertId}/reject`, request);
    },
    {
      onSuccess: () => {
        query.refetch();
      },
    }
  );

  const approve = useCallback(
    (alertId: string, request: AlertApproveRequest) => {
      return approveMutation.mutate({ alertId, request });
    },
    [approveMutation]
  );

  const reject = useCallback(
    (alertId: string, request: AlertRejectRequest) => {
      return rejectMutation.mutate({ alertId, request });
    },
    [rejectMutation]
  );

  return {
    ...query,
    alerts: query.data || [],
    approve,
    reject,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

export function useActiveAlerts(zoneId?: string, lang: string = 'en') {
  return useApiQuery<ActiveAlertMobileResponse[]>(
    async (signal) => {
      const params: Record<string, string> = { lang };
      if (zoneId) params.zone_id = zoneId;
      return apiClient.get<ActiveAlertMobileResponse[]>('/alerts/active', { params, signal });
    },
    [zoneId, lang],
    { refetchIntervalMs: 30000 }
  );
}

export function useCheckEscalation() {
  return useApiMutation<{ escalated_count: number; message: string }, void>(
    async () => {
      return apiClient.post<{ escalated_count: number; message: string }>('/alerts/check-escalation');
    }
  );
}

