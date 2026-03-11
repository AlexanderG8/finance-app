'use client';

import { create } from 'zustand';
import { setAccessToken } from '@/lib/api-client';
import type { User } from '@finance-app/shared';

interface AuthState {
  // Access token stored in memory only (NOT localStorage)
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (accessToken, user) => {
    setAccessToken(accessToken);
    set(() => ({
      accessToken,
      user,
      isAuthenticated: true,
      isLoading: false,
    }));
  },

  clearAuth: () => {
    setAccessToken(null);
    set(() => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }));
  },

  setUser: (user) => {
    set((state) => ({ ...state, user }));
  },

  setLoading: (isLoading) => {
    set((state) => ({ ...state, isLoading }));
  },
}));
