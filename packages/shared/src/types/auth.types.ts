export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  preferredCurrency: 'PEN' | 'USD';
  timezone: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
