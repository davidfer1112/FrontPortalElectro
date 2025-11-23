// src/services/processAlertsService.ts
import api from '../api/axiosInstance';
import type {
  ProcessAlert,
  CreateProcessAlertDTO,
  UpdateProcessAlertDTO,
} from '../models/process-alert.model';

const RESOURCE = '/process-alerts';

export const processAlertsService = {
  /**
   * Obtener alertas.
   * - sin argumento -> todas
   * - processId -> solo las del proceso indicado
   */
  async getAll(processId?: number): Promise<ProcessAlert[]> {
    const params: Record<string, any> = {};

    if (processId !== undefined) {
      params.process_id = processId;
    }

    const res = await api.get<ProcessAlert[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/process-alerts/{id}
  async getById(id: number | string): Promise<ProcessAlert> {
    const res = await api.get<ProcessAlert>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/process-alerts
  async create(data: CreateProcessAlertDTO): Promise<ProcessAlert> {
    const res = await api.post<ProcessAlert>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/process-alerts/{id}
  async update(
    id: number | string,
    data: UpdateProcessAlertDTO,
  ): Promise<ProcessAlert> {
    const res = await api.put<ProcessAlert>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/process-alerts/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
