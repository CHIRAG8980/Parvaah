import { API_CONFIG, getAuthToken, removeAuthToken, setAuthToken } from './config';
import { ApiError } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
  body?: unknown;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  private buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_CONFIG.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async attemptTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'officer_meghalaya' }),
        });

        if (!response.ok) {
          removeAuthToken();
          return null;
        }

        const data = (await response.json()) as { access_token?: string };
        if (data.access_token) {
          setAuthToken(data.access_token);
          return data.access_token;
        }

        return null;
      } catch {
        removeAuthToken();
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      params,
      timeoutMs = API_CONFIG.defaultTimeoutMs,
      skipAuth = false,
      headers: customHeaders = {},
      body,
      ...customConfig
    } = options;

    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (!skipAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fetchConfig: RequestInit = {
      ...customConfig,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined) {
      fetchConfig.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);

      if (response.status === 401 && !skipAuth) {
        const refreshedToken = await this.attemptTokenRefresh();
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`;
          const retryResponse = await fetch(url, { ...fetchConfig, headers });
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => null);
            throw ApiError.fromResponse(retryResponse.status, errorData);
          }
          return (await retryResponse.json()) as T;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw ApiError.fromResponse(response.status, errorData);
      }

      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw ApiError.timeout(timeoutMs);
      }

      if (error instanceof Error) {
        throw ApiError.networkError(error);
      }

      throw new ApiError('An unexpected error occurred during request', 500, 'UNEXPECTED_ERROR');
    }
  }

  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
