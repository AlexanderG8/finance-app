import { apiClient, setAccessToken } from './api-client';
import type { LoginInput, RegisterInput, LoginResponse, User } from '@finance-app/shared';

export async function loginRequest(input: LoginInput): Promise<LoginResponse> {
  const response = await apiClient.post<{ success: true; data: LoginResponse }>('/auth/login', input);
  return response.data.data;
}

export async function registerRequest(input: RegisterInput): Promise<LoginResponse> {
  const response = await apiClient.post<{ success: true; data: LoginResponse }>('/auth/register', input);
  return response.data.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
  setAccessToken(null);
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
