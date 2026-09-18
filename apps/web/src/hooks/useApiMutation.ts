import { useState, useCallback, useRef } from 'react';
import { ApiError } from '../lib/api/errors';

export interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: ApiError, variables: TVariables) => void | Promise<void>;
}

export interface UseApiMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiError | null;
  data: TData | null;
  reset: () => void;
}

export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsPending(false);
    setIsSuccess(false);
  }, []);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsPending(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsSuccess(true);
        setIsPending(false);

        if (optionsRef.current.onSuccess) {
          await optionsRef.current.onSuccess(result, variables);
        }

        return result;
      } catch (err: unknown) {
        const normalized =
          err instanceof ApiError
            ? err
            : new ApiError(err instanceof Error ? err.message : 'Mutation failed', 500);

        setError(normalized);
        setIsPending(false);
        setIsSuccess(false);

        if (optionsRef.current.onError) {
          await optionsRef.current.onError(normalized, variables);
        }

        throw normalized;
      }
    },
    [mutationFn]
  );

  return {
    mutate,
    isPending,
    isSuccess,
    isError: error !== null,
    error,
    data,
    reset,
  };
}
