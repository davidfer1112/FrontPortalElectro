// src/types/auth.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role_id: number;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  token: string;
}
