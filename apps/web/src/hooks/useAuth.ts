'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { apiClient } from '../lib/api/client';
import {
  UserProfile,
  TokenResponse,
  LoginRequest,
  PasswordChangeRequest,
  SessionStatusResponse,
} from '../lib/api/types';
import { useApiMutation } from './useApiMutation';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const loadSession = useCallback(async () => {
    try {
      const session = await apiClient.get<SessionStatusResponse>('/auth/session', {
        skipAuth: true,
      });

      if (session.authenticated && session.user) {
        startTransition(() => {
          setUser(session.user);
          setIsAuthenticated(true);
        });
      } else {
        startTransition(() => {
          setUser(null);
          setIsAuthenticated(false);
        });
      }
    } catch {
      startTransition(() => {
        setUser(null);
        setIsAuthenticated(false);
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    // Proactive background silent refresh every 10 minutes (access token lives 15m)
    const interval = setInterval(() => {
      apiClient.post<TokenResponse>('/auth/refresh', {}, { skipAuth: true }).catch(() => {
        // Ignored; automatic refresh handler in apiClient will deal with expired sessions
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadSession]);

  const loginMutation = useApiMutation<TokenResponse, LoginRequest>(
    async (credentials: LoginRequest) => {
      // Direct POST to /auth/login; sets HttpOnly access & refresh cookies on browser
      return apiClient.post<TokenResponse>('/auth/login', credentials, {
        skipAuth: true,
      });
    },
    {
      onSuccess: (data) => {
        setIsAuthenticated(true);
        const profile: UserProfile = {
          user_id: data.user_id,
          username: data.username,
          full_name: data.full_name,
          role: data.role,
          district: data.district,
          state: data.state,
          escalation_level: data.escalation_level,
          contact_number: '+919436000000',
          csrf_token: data.csrf_token,
        };
        setUser(profile);
      },
    }
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Discard errors during logout
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const changePassword = useCallback(async (payload: PasswordChangeRequest) => {
    return apiClient.post<TokenResponse>('/auth/change-password', payload);
  }, []);

  // RBAC helpers
  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role.includes('admin');
  const isStateOfficer = isAdmin || role.includes('state') || role.includes('director');
  const isDistrictOfficer = isAdmin || isStateOfficer || role.includes('district');

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isStateOfficer,
    isDistrictOfficer,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    changePassword,
    refreshSession: loadSession,
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
      setError(err instanceof Error ? err : new Error('Failed to fetch emergency officials'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  return { officers, isLoading, error, refetch: fetchOfficers };
}
