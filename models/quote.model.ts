// src/models/quote.model.ts

// Cotización
export interface Quote {
  id: number;
  folder_id: number;
  name: string;
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

// Datos para crear una cotización
export interface CreateQuoteDTO {
  folder_id: number;
  name: string;
}

// Datos para actualizar una cotización (parcial)
export interface UpdateQuoteDTO {
  folder_id?: number;
  name?: string;
}
