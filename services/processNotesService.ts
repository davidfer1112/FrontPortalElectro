// src/services/processNotesService.ts
import api from '../api/axiosInstance';
import type {
  ProcessNote,
  CreateProcessNoteDTO,
  UpdateProcessNoteDTO,
} from '../models/process-note.model';

const RESOURCE = '/process-notes';

export const processNotesService = {
  /**
   * Obtener notas de procesos.
   * - sin argumento -> todas
   * - processId -> solo las del proceso indicado
   */
  async getAll(processId?: number): Promise<ProcessNote[]> {
    const params: Record<string, any> = {};

    if (processId !== undefined) {
      params.process_id = processId;
    }

    const res = await api.get<ProcessNote[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/process-notes/{id}
  async getById(id: number | string): Promise<ProcessNote> {
    const res = await api.get<ProcessNote>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/process-notes
  async create(data: CreateProcessNoteDTO): Promise<ProcessNote> {
    const res = await api.post<ProcessNote>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/process-notes/{id}
  async update(
    id: number | string,
    data: UpdateProcessNoteDTO,
  ): Promise<ProcessNote> {
    const res = await api.put<ProcessNote>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/process-notes/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
