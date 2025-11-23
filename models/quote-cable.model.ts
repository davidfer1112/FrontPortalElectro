// src/models/quote-cable.model.ts

// Línea de cotización para cables/accesorios
export interface QuoteCable {
  id: number;
  quote_id: number;
  cable_accessory_id: number;
  quantity: number;
  unit_price: string; // en la respuesta viene como "120000.00"
}

// Datos para crear una línea de cotización
export interface CreateQuoteCableDTO {
  quote_id: number;
  cable_accessory_id: number;
  quantity: number;
  // el backend acepta número, pero lo tipamos flexible
  unit_price: number | string;
}

// Datos para actualizar una línea (parcial)
export interface UpdateQuoteCableDTO {
  quote_id?: number;
  cable_accessory_id?: number;
  quantity?: number;
  unit_price?: number | string;
}
