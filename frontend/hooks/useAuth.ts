'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { User } from '@/types';

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: clearUser } = useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        const response = await authApi.login(email, password);
        const userData: User = response.data;
        setUser(userData);
        return userData;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors — still clear local state
    } finally {
      clearUser();
      router.push('/login');
    }
  }, [clearUser, router]);

  const fetchMe = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authApi.me();
      setUser(response.data);
      return response.data;
    } catch {
      clearUser();
      return null;
    }
  }, [setUser, clearUser]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'SUPER_ADMIN',
    isJudge: user?.role === 'JUDGE',
    login,
    logout,
    fetchMe,
  };
}
