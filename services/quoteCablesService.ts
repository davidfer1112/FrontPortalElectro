// src/services/quoteCablesService.ts
import api from '../api/axiosInstance';
import type {
  QuoteCable,
  CreateQuoteCableDTO,
  UpdateQuoteCableDTO,
} from '../models/quote-cable.model';

const RESOURCE = '/quote-cables';

export const quoteCablesService = {
  /**
   * Obtener líneas de cotización.
   * - sin argumento -> todas
   * - quoteId -> solo las de esa cotización
   */
  async getAll(quoteId?: number): Promise<QuoteCable[]> {
    const params: Record<string, any> = {};

    if (quoteId !== undefined) {
      params.quote_id = quoteId;
    }

    const res = await api.get<QuoteCable[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/quote-cables/{id}
  async getById(id: number | string): Promise<QuoteCable> {
    const res = await api.get<QuoteCable>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/quote-cables
  async create(data: CreateQuoteCableDTO): Promise<QuoteCable> {
    const res = await api.post<QuoteCable>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/quote-cables/{id}
  async update(
    id: number | string,
    data: UpdateQuoteCableDTO,
  ): Promise<QuoteCable> {
    const res = await api.put<QuoteCable>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/quote-cables/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
