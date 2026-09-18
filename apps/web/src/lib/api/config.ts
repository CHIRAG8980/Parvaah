/**
 * Production API client configuration.
 *
 * All requests route through the secure same-origin reverse-proxy (/api/backend)
 * which preserves HttpOnly, Secure, SameSite cookies directly without exposing
 * credentials or tokens to JavaScript storage (XSS protected).
 */

export const API_CONFIG = {
  baseUrl: typeof window !== 'undefined'
    ? '/api/backend'
    : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://127.0.0.1:8000/api/v1'),
  defaultTimeoutMs: 10000,
  mutationTimeoutMs: 15000,
  storageKeys: {
    liveLocation: 'parvaah_live_location',
    sidebarCollapsed: 'parvaah_sidebar_collapsed',
  },
} as const;

/**
 * Helper to retrieve CSRF token from document.cookie for mutating requests.
 * Tokens are double-submitted via the X-CSRF-Token header.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )parvaah_csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
