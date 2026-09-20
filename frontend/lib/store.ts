'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      setUser: (user) =>
        set((state) => ({
          user,
          accessToken: user?.access_token ?? state.accessToken ?? null,
          refreshToken: user?.refresh_token ?? state.refreshToken ?? null,
        })),
      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: state.user
            ? { ...state.user, access_token: accessToken ?? undefined, refresh_token: refreshToken ?? undefined }
            : null,
        })),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'innov8-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken ?? state.user?.access_token ?? null,
        refreshToken: state.refreshToken ?? state.user?.refresh_token ?? null,
      }),
    }
  )
);
