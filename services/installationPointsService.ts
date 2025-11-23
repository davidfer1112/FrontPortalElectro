// src/services/installationPointsService.ts
import api from '../api/axiosInstance';
import type {
  InstallationPoint,
  CreateInstallationPointDTO,
  UpdateInstallationPointDTO,
} from '../models/installation-point.model';

const RESOURCE = '/installation-points';

export const installationPointsService = {
  /**
   * Obtener puntos de instalación.
   * - sin argumento -> todos
   * - quoteId -> solo los de esa cotización
   */
  async getAll(quoteId?: number): Promise<InstallationPoint[]> {
    const params: Record<string, any> = {};

    if (quoteId !== undefined) {
      params.quote_id = quoteId;
    }

    const res = await api.get<InstallationPoint[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/installation-points/{id}
  async getById(id: number | string): Promise<InstallationPoint> {
    const res = await api.get<InstallationPoint>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/installation-points
  async create(
    data: CreateInstallationPointDTO,
  ): Promise<InstallationPoint> {
    const res = await api.post<InstallationPoint>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/installation-points/{id}
  async update(
    id: number | string,
    data: UpdateInstallationPointDTO,
  ): Promise<InstallationPoint> {
    const res = await api.put<InstallationPoint>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/installation-points/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
