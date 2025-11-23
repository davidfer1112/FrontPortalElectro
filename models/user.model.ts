// src/models/user.model.ts

// Usuario tal como viene del backend
export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;

  // Por si el backend los manda (los dejamos opcionales)
  created_at?: string;
  updated_at?: string;
}

// Datos para crear un usuario
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role_id: number;
}

// Datos para actualizar un usuario (parcial)
export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  role_id?: number;
}
