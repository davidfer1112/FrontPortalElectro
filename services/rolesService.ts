// src/services/rolesService.ts
import api from '../api/axiosInstance';
import type { Role, CreateRoleDTO, UpdateRoleDTO } from '../models/role.model';

const RESOURCE = '/roles';

export const rolesService = {
  // GET /api/roles
  async getAll(): Promise<Role[]> {
    const res = await api.get<Role[]>(RESOURCE);
    return res.data;
  },

  // GET /api/roles/{id}
  async getById(id: number | string): Promise<Role> {
    const res = await api.get<Role>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/roles
  async create(data: CreateRoleDTO): Promise<Role> {
    const res = await api.post<Role>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/roles/{id}
  async update(id: number | string, data: UpdateRoleDTO): Promise<Role> {
    const res = await api.put<Role>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/roles/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
