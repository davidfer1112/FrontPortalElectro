// src/services/processesService.ts
import api from '../api/axiosInstance';
import type {
  Process,
  CreateProcessDTO,
  UpdateProcessDTO,
} from '../models/process.model';

const RESOURCE = '/processes';

export const processesService = {
  /**
   * Obtener procesos.
   * - sin filtros -> todos
   * - status -> por estado
   * - quoteId -> por cotización
   * Puedes mandar uno o los dos filtros.
   */
  async getAll(
    options?: { status?: string; quoteId?: number }
  ): Promise<Process[]> {
    const params: Record<string, any> = {};

    if (options?.status) {
      params.status = options.status;
    }
    if (options?.quoteId !== undefined) {
      params.quote_id = options.quoteId;
    }

    const res = await api.get<Process[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/processes/{id}
  async getById(id: number | string): Promise<Process> {
    const res = await api.get<Process>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/processes
  async create(data: CreateProcessDTO): Promise<Process> {
    const res = await api.post<Process>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/processes/{id}
  async update(
    id: number | string,
    data: UpdateProcessDTO,
  ): Promise<Process> {
    const res = await api.put<Process>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/processes/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
