import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { API_CONFIG, getAuthToken, setAuthToken, removeAuthToken } from '../lib/api/config';
import { UserProfile, TokenResponse, LoginRequest } from '../lib/api/types';
import { useApiMutation } from './useApiMutation';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const loadUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await apiClient.get<UserProfile>('/auth/me');
      setUser(profile);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(API_CONFIG.storageKeys.userProfile, JSON.stringify(profile));
      }
    } catch {
      removeAuthToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const loginMutation = useApiMutation<TokenResponse, LoginRequest>(
    async (credentials: LoginRequest) => {
      const result = await apiClient.post<TokenResponse>('/auth/login', credentials, {
        skipAuth: true,
      });
      setAuthToken(result.access_token);
      return result;
    },
    {
      onSuccess: async (data) => {
        setIsAuthenticated(true);
        const profile: UserProfile = {
          user_id: data.user_id,
          username: data.username,
          full_name: data.full_name,
          role: data.role,
          district: data.district,
          escalation_level: data.escalation_level,
          contact_number: '+919436000000',
        };
        setUser(profile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(API_CONFIG.storageKeys.userProfile, JSON.stringify(profile));
        }
      },
    }
  );

  const logout = useCallback(() => {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_CONFIG.storageKeys.userProfile);
    }
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    refreshProfile: loadUser,
  };
}

export function useOfficers() {
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOfficers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<UserProfile[]>('/auth/officers');
      setOfficers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch officers'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  return { officers, isLoading, error, refetch: fetchOfficers };
}

