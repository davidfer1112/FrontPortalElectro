// src/services/processMaterialsService.ts
import api from '../api/axiosInstance';
import type {
  ProcessMaterial,
  CreateProcessMaterialDTO,
  UpdateProcessMaterialDTO,
} from '../models/process-material.model';

const RESOURCE = '/process-materials';

export const processMaterialsService = {
  /**
   * Obtener materiales de proceso.
   * - sin argumento -> todos
   * - processId -> solo los de ese proceso
   */
  async getAll(processId?: number): Promise<ProcessMaterial[]> {
    const params: Record<string, any> = {};

    if (processId !== undefined) {
      params.process_id = processId;
    }

    const res = await api.get<ProcessMaterial[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/process-materials/{id}
  async getById(id: number | string): Promise<ProcessMaterial> {
    const res = await api.get<ProcessMaterial>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/process-materials
  async create(
    data: CreateProcessMaterialDTO,
  ): Promise<ProcessMaterial> {
    const res = await api.post<ProcessMaterial>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/process-materials/{id}
  async update(
    id: number | string,
    data: UpdateProcessMaterialDTO,
  ): Promise<ProcessMaterial> {
    const res = await api.put<ProcessMaterial>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/process-materials/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
