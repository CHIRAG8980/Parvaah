import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../lib/api/errors';

export interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => Promise<T | null>;
}

export interface UseApiQueryOptions {
  enabled?: boolean;
  refetchIntervalMs?: number;
}

export function useApiQuery<T>(
  queryFn: (signal?: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: UseApiQueryOptions = {}
): UseApiQueryResult<T> {
  const { enabled = true, refetchIntervalMs } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);

  const isMountedRef = useRef(true);
  const activeControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null;

    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn(controller.signal);
      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
      return result;
    } catch (err: unknown) {
      if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return null;
      }
      if (isMountedRef.current) {
        const normalized =
          err instanceof ApiError
            ? err
            : new ApiError(err instanceof Error ? err.message : 'Unknown query error', 500);
        setError(normalized);
        setIsLoading(false);
      }
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);


  useEffect(() => {
    isMountedRef.current = true;
    execute();

    let intervalId: NodeJS.Timeout | null = null;
    if (refetchIntervalMs && refetchIntervalMs > 0) {
      intervalId = setInterval(() => {
        execute();
      }, refetchIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [execute, refetchIntervalMs]);

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch: execute,
  };
}
