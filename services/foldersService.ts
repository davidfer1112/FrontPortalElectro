// src/services/foldersService.ts
import api from "../api/axiosInstance"
import type {
  Folder,
  CreateFolderDTO,
  UpdateFolderDTO,
} from "../models/folder.model"

const RESOURCE = "/folders"

export const foldersService = {
  /**
   * Obtener carpetas.
   * - Sin argumento → carpetas raíz.
   * - parentId = number → carpetas hijas (GET /folders?folder_id=x)
   */
  async getAll(parentId?: number | null): Promise<Folder[]> {
    const params: Record<string, any> = {}

    // 👇 CAMBIO CLAVE:
    // Si parentId es un número, enviamos folder_id al backend.
    if (typeof parentId === "number") {
      params.folder_id = parentId
    }

    const res = await api.get<Folder[]>(RESOURCE, { params })
    return res.data
  },

  // GET /api/folders/{id}
  async getById(id: number | string): Promise<Folder> {
    const res = await api.get<Folder>(`${RESOURCE}/${id}`)
    return res.data
  },

  // POST /api/folders
  async create(data: CreateFolderDTO): Promise<Folder> {
    const res = await api.post<Folder>(RESOURCE, data)
    return res.data
  },

  // PUT /api/folders/{id}
  async update(id: number | string, data: UpdateFolderDTO): Promise<Folder> {
    const res = await api.put<Folder>(`${RESOURCE}/${id}`, data)
    return res.data
  },

  // DELETE /api/folders/{id}
  async remove(id: number | string): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`)
  },
}
