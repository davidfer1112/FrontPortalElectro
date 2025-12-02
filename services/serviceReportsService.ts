// src/services/serviceReportsService.ts
import api from '../api/axiosInstance';
import type {
  ServiceReport,
  CreateServiceReportDTO,
  UpdateServiceReportDTO,
} from '../models/service-report.model';

const RESOURCE = '/service-reports';

export const serviceReportsService = {
  /**
   * Obtener reportes por proceso.
   * Swagger marca process_id como requerido.
   */
  async getByProcess(processId: number): Promise<ServiceReport[]> {
    const res = await api.get<ServiceReport[]>(RESOURCE, {
      params: { process_id: processId },
    });
    return res.data;
  },

  // GET /api/service-reports/{id}
  async getById(id: number | string): Promise<ServiceReport> {
    const res = await api.get<ServiceReport>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/service-reports
  async create(data: CreateServiceReportDTO): Promise<ServiceReport> {
    const res = await api.post<ServiceReport>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/service-reports/{id}
  async update(
    id: number | string,
    data: UpdateServiceReportDTO,
  ): Promise<ServiceReport> {
    const res = await api.put<ServiceReport>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/service-reports/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
