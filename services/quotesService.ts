// src/services/quotesService.ts
import api from '../api/axiosInstance';
import type {
  Quote,
  CreateQuoteDTO,
  UpdateQuoteDTO,
} from '../models/quote.model';

const RESOURCE = '/quotes';

export const quotesService = {
  /**
   * Obtener cotizaciones.
   * - sin argumento -> todas
   * - folderId -> solo las de esa carpeta
   */
  async getAll(folderId?: number): Promise<Quote[]> {
    const params: Record<string, any> = {};

    if (folderId !== undefined) {
      params.folder_id = folderId;
    }

    const res = await api.get<Quote[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/quotes/{id}
  async getById(id: number | string): Promise<Quote> {
    const res = await api.get<Quote>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/quotes
  async create(data: CreateQuoteDTO): Promise<Quote> {
    const res = await api.post<Quote>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/quotes/{id}
  async update(
    id: number | string,
    data: UpdateQuoteDTO,
  ): Promise<Quote> {
    const res = await api.put<Quote>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/quotes/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
