import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { apiClient } from '@/lib/api-client';
import type { User } from '@finance-app/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  loadAuth: async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Verify token by fetching profile
      const { data } = await apiClient.get('/auth/me');
      set({
        user: data.data,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await storage.clearTokens();
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user, tokens } = data.data;

    await storage.setAccessToken(tokens.accessToken);
    await storage.setRefreshToken(tokens.refreshToken);

    set({ user, accessToken: tokens.accessToken, isAuthenticated: true });
  },

  register: async (name: string, email: string, password: string) => {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    const { user, tokens } = data.data;

    await storage.setAccessToken(tokens.accessToken);
    await storage.setRefreshToken(tokens.refreshToken);

    set({ user, accessToken: tokens.accessToken, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore errors
    } finally {
      await storage.clearTokens();
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
