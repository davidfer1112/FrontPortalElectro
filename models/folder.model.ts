// src/models/folder.model.ts

// Lo que devuelve la API para una carpeta
export interface Folder {
  id: number;
  name: string;
  parent_id: number | null; // null para carpetas raíz
}

// Para crear una carpeta
export interface CreateFolderDTO {
  name: string;
  parent_id?: number | null; // opcional: si no se envía, se asume raíz
}

// Para actualizar una carpeta
export interface UpdateFolderDTO {
  name?: string;
  parent_id?: number | null;
}
