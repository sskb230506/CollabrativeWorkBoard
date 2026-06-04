import apiClient from './client';
import type { ApiResponse, User, AuthTokens, LoginInput, RegisterInput } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Auth API Service
// Pure functions — no hooks, no state. Hooks live in features/auth/hooks.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterInput) =>
    apiClient
      .post<ApiResponse<{ user: User; accessToken: string }>>('/auth/register', data)
      .then((r) => r.data.data),

  login: (data: LoginInput) =>
    apiClient
      .post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', data)
      .then((r) => r.data.data),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout').then((r) => r.data),

  refresh: () =>
    apiClient
      .post<ApiResponse<AuthTokens>>('/auth/refresh')
      .then((r) => r.data.data),

  me: () =>
    apiClient
      .get<ApiResponse<User>>('/auth/me')
      .then((r) => r.data.data),
};
