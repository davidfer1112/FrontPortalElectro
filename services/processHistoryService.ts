// src/services/processHistoryService.ts
import api from '../api/axiosInstance';
import type {
  ProcessHistoryEntry,
  CreateProcessHistoryEntryDTO,
} from '../models/process-history.model';

const RESOURCE = '/process-history';

export const processHistoryService = {
  /**
   * Obtener historial de procesos.
   * - sin argumento -> historial de todos los procesos
   * - processId -> solo historial de ese proceso
   */
  async getAll(processId?: number): Promise<ProcessHistoryEntry[]> {
    const params: Record<string, any> = {};

    if (processId !== undefined) {
      params.process_id = processId;
    }

    const res = await api.get<ProcessHistoryEntry[]>(RESOURCE, { params });
    return res.data;
  },

  // POST /api/process-history
  async create(
    data: CreateProcessHistoryEntryDTO,
  ): Promise<ProcessHistoryEntry> {
    const res = await api.post<ProcessHistoryEntry>(RESOURCE, data);
    return res.data;
  },
};
