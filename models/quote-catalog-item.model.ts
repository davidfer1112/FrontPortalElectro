// src/models/quote-catalog-item.model.ts

// Línea de cotización que proviene del catálogo
export interface QuoteCatalogItem {
  id: number;
  quote_id: number;
  catalog_id: number;
  quantity: number;

  // Datos del producto del catálogo
  reference: string;
  description: string;
  image_url: string;
  catalog_price: string;
}

// Datos para crear una nueva línea de catálogo en la cotización
export interface CreateQuoteCatalogItemDTO {
  quote_id: number;
  catalog_id: number;
  quantity: number;
}

// Datos para actualizar una línea (parcial)
export interface UpdateQuoteCatalogItemDTO {
  quote_id?: number;
  catalog_id?: number;
  quantity?: number;
}
