// src/services/usersService.ts
import api from '../api/axiosInstance';
import type { User, CreateUserDTO, UpdateUserDTO } from '../models/user.model';

const RESOURCE = '/users';

export const usersService = {
  // GET /api/users  -> todos los usuarios
  async getAll(): Promise<User[]> {
    const res = await api.get<User[]>(RESOURCE);
    return res.data;
  },

  // GET /api/users/{id}
  async getById(id: number | string): Promise<User> {
    const res = await api.get<User>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/users
  async create(data: CreateUserDTO): Promise<User> {
    const res = await api.post<User>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/users/{id}
  async update(
    id: number | string,
    data: UpdateUserDTO,
  ): Promise<User> {
    const res = await api.put<User>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/users/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
