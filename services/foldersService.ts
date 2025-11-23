// src/services/foldersService.ts
import api from '../api/axiosInstance';
import type {
  Folder,
  CreateFolderDTO,
  UpdateFolderDTO,
} from '../models/folder.model';

const RESOURCE = '/folders';

export const foldersService = {
  /**
   * Obtener carpetas.
   * - sin argumento -> todas o según el backend (normalmente raíz)
   * - parentId = null -> carpetas raíz
   * - parentId = number -> hijas de esa carpeta
   */
  async getAll(parentId?: number | null): Promise<Folder[]> {
    const params: Record<string, any> = {};

    if (parentId !== undefined) {
      // el backend entiende "null" o vacío como raíz
      params.parent_id = parentId === null ? 'null' : parentId;
    }

    const res = await api.get<Folder[]>(RESOURCE, { params });
    return res.data;
  },

  // GET /api/folders/{id}
  async getById(id: number | string): Promise<Folder> {
    const res = await api.get<Folder>(`${RESOURCE}/${id}`);
    return res.data;
  },

  // POST /api/folders
  async create(data: CreateFolderDTO): Promise<Folder> {
    const res = await api.post<Folder>(RESOURCE, data);
    return res.data;
  },

  // PUT /api/folders/{id}
  async update(
    id: number | string,
    data: UpdateFolderDTO,
  ): Promise<Folder> {
    const res = await api.put<Folder>(`${RESOURCE}/${id}`, data);
    return res.data;
  },

  // DELETE /api/folders/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  },
};
