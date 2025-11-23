// src/models/catalog.model.ts

// Lo que devuelve el backend para un producto del catálogo
export interface CatalogProduct {
  id: number;
  reference: string;
  description: string;
  image_url: string;
  price: string; // viene como string en la API, ej: "159.99"
}

// Para crear un nuevo producto (no lleva id)
export interface CreateCatalogProductDTO {
  reference: string;
  description: string;
  image_url: string;
  price: string;
}

// Para actualizar un producto (puede ser parcial)
export interface UpdateCatalogProductDTO {
  reference?: string;
  description?: string;
  image_url?: string;
  price?: string;
}
