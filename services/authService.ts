// src/services/authService.ts
import api from '../api/axiosInstance';
import type { LoginRequest, LoginResponse, AuthUser } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);

    const res = response.data;

    // Guardar en localStorage
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }

    return res;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
