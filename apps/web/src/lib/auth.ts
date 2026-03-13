import { apiClient, setAccessToken } from './api-client';
import type { LoginInput, RegisterInput, LoginResponse, User } from '@finance-app/shared';

const REFRESH_TOKEN_KEY = 'rt';

export function saveRefreshToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearStoredRefreshToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function loginRequest(input: LoginInput): Promise<LoginResponse> {
  const response = await apiClient.post<{ success: true; data: LoginResponse }>('/auth/login', input);
  saveRefreshToken(response.data.data.tokens.refreshToken);
  return response.data.data;
}

export async function registerRequest(input: RegisterInput): Promise<LoginResponse> {
  const response = await apiClient.post<{ success: true; data: LoginResponse }>('/auth/register', input);
  saveRefreshToken(response.data.data.tokens.refreshToken);
  return response.data.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
  setAccessToken(null);
  clearStoredRefreshToken();
}

export async function getMeRequest(): Promise<User> {
  const response = await apiClient.get<{ success: true; data: User }>('/auth/me');
  return response.data.data;
}

export async function refreshTokenRequest(refreshToken: string): Promise<{ accessToken: string }> {
  const response = await apiClient.post<{ success: true; data: { accessToken: string } }>(
    '/auth/refresh',
    { refreshToken }
  );
  return response.data.data;
}
