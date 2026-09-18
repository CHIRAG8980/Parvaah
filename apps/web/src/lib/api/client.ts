import { API_CONFIG, getCsrfToken } from './config';
import { ApiError } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
  body?: unknown;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  private buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // In browser, relative URL works with Next.js rewrites
    if (typeof window !== 'undefined') {
      const url = new URL(`${API_CONFIG.baseUrl}${cleanEndpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      return url.toString();
    }

    // Server-side direct request
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

  /**
   * Automatic silent token refresh via HttpOnly refresh token cookie.
   * Concurrent 401s latch to this single in-flight refresh promise.
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshUrl = typeof window !== 'undefined'
          ? `${window.location.origin}${API_CONFIG.baseUrl}/auth/refresh`
          : `${API_CONFIG.baseUrl}/auth/refresh`;

        const response = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Sends HttpOnly parvaah_refresh_token cookie
        });

        return response.ok;
      } catch {
        return false;
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

    // Attach double-submit CSRF token for mutating state requests (POST, PUT, DELETE, PATCH)
    const method = (customConfig.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken && !headers['X-CSRF-Token']) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const fetchConfig: RequestInit = {
      ...customConfig,
      headers,
      credentials: 'include', // Always send and receive HttpOnly cookies
      signal: controller.signal,
    };

    if (body !== undefined) {
      fetchConfig.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);

      // Trigger automatic silent refresh if 401 Unauthorized received on protected route
      if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshSuccess = await this.attemptTokenRefresh();
        if (refreshSuccess) {
          // Retry original request with newly rotated cookie session
          const retryResponse = await fetch(url, fetchConfig);
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => null);
            throw ApiError.fromResponse(retryResponse.status, errorData);
          }
          if (retryResponse.status === 204) {
            return undefined as unknown as T;
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
