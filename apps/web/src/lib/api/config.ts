export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  defaultTimeoutMs: 10000,
  mutationTimeoutMs: 15000,
  storageKeys: {
    authToken: 'parvaah_auth_token',
    userProfile: 'parvaah_user_profile',
    liveLocation: 'parvaah_live_location',
  },
} as const;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(API_CONFIG.storageKeys.authToken);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(API_CONFIG.storageKeys.authToken, token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(API_CONFIG.storageKeys.authToken);
}
