// src/models/role.model.ts

// Rol básico
export interface Role {
  id: number;
  name: string;
}

// Para crear un rol
export interface CreateRoleDTO {
  name: string;
}

// Para actualizar un rol (parcial)
export interface UpdateRoleDTO {
  name?: string;
}
