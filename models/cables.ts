// src/types/cables.ts

// Lo que devuelve el backend en el listado y en GET /{id}
export interface CableOrAccessory {
  id: number;
  name: string;
  description: string;
  measurement_type: string; // ej: "metro", "unidad", etc.
  price: string;            // viene como "3500.00" en la API
}

// Para crear uno nuevo (no tiene id)
export interface CreateCableOrAccessoryDTO {
  name: string;
  description: string;
  measurement_type: string;
  price: string;
}

// Para actualizar (puede ser parcial si quieres)
export interface UpdateCableOrAccessoryDTO {
  name?: string;
  description?: string;
  measurement_type?: string;
  price?: string;
}
