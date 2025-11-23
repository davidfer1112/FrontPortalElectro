// src/services/cablesAndAccessoriesService.ts
import api from '../api/axiosInstance';
import type {
  CableOrAccessory,
  CreateCableOrAccessoryDTO,
  UpdateCableOrAccessoryDTO,
} from '../models/cables';

const RESOURCE_PATH = '/cables-and-accessories';

export const cablesAndAccessoriesService = {
  // GET /api/cables-and-accessories
  async getAll(): Promise<CableOrAccessory[]> {
    const response = await api.get<CableOrAccessory[]>(RESOURCE_PATH);
    return response.data;
  },

  // GET /api/cables-and-accessories/{id}
  async getById(id: number | string): Promise<CableOrAccessory> {
    const response = await api.get<CableOrAccessory>(
      `${RESOURCE_PATH}/${id}`
    );
    return response.data;
  },

  // POST /api/cables-and-accessories
  async create(
    data: CreateCableOrAccessoryDTO
  ): Promise<CableOrAccessory> {
    const response = await api.post<CableOrAccessory>(RESOURCE_PATH, data);
    return response.data;
  },

  // PUT /api/cables-and-accessories/{id}
  async update(
    id: number | string,
    data: UpdateCableOrAccessoryDTO
  ): Promise<CableOrAccessory> {
    const response = await api.put<CableOrAccessory>(
      `${RESOURCE_PATH}/${id}`,
      data
    );
    return response.data;
  },

  // DELETE /api/cables-and-accessories/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE_PATH}/${id}`);
  },
};
