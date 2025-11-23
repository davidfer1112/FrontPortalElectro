// src/services/catalogService.ts
import api from '../api/axiosInstance';
import type {
  CatalogProduct,
  CreateCatalogProductDTO,
  UpdateCatalogProductDTO,
} from '../models/catalog.model';

const RESOURCE = '/catalog';

export const catalogService = {
  // GET /api/catalog
  async getAll(): Promise<CatalogProduct[]> {
    const res = await api.get<CatalogProduct[]>(RESOURCE);
    return res.data;
  },

  // GET /api/catalog/{id}
  async getById(id: number | string): Promise<CatalogProduct> {
    const res = await api.get<CatalogProduct>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/catalog
  async create(data: CreateCatalogProductDTO): Promise<CatalogProduct> {
    const res = await api.post<CatalogProduct>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/catalog/{id}
  async update(
    id: number | string,
    data: UpdateCatalogProductDTO,
  ): Promise<CatalogProduct> {
    const res = await api.put<CatalogProduct>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/catalog/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
