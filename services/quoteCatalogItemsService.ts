// src/services/quoteCatalogItemsService.ts
import api from '../api/axiosInstance';
import type {
  QuoteCatalogItem,
  CreateQuoteCatalogItemDTO,
  UpdateQuoteCatalogItemDTO,
} from '../models/quote-catalog-item.model';

const RESOURCE = '/quote-catalog-items';

export const quoteCatalogItemsService = {
  /**
   * Obtener líneas de catálogo de una cotización.
   * - sin argumento -> todas
   * - quoteId -> solo las de esa cotización
   */
  async getAll(quoteId?: number): Promise<QuoteCatalogItem[]> {
    const params: Record<string, any> = {};

    if (quoteId !== undefined) {
      params.quote_id = quoteId;
    }

    const res = await api.get<QuoteCatalogItem[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/quote-catalog-items/{id}
  async getById(id: number | string): Promise<QuoteCatalogItem> {
    const res = await api.get<QuoteCatalogItem>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/quote-catalog-items
  async create(
    data: CreateQuoteCatalogItemDTO,
  ): Promise<QuoteCatalogItem> {
    const res = await api.post<QuoteCatalogItem>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/quote-catalog-items/{id}
  async update(
    id: number | string,
    data: UpdateQuoteCatalogItemDTO,
  ): Promise<QuoteCatalogItem> {
    const res = await api.put<QuoteCatalogItem>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/quote-catalog-items/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
