// src/models/installation-point.model.ts

// Punto de instalación tal como lo devuelve la API
export interface InstallationPoint {
  id: number;
  quote_id: number;   // id de la cotización a la que pertenece
  type: string;       // descripción del tipo, ej: "instalacion de camara"
  quantity: number;
  unit_price: string; // "45000.00"
}

// Datos necesarios para crear un punto
export interface CreateInstallationPointDTO {
  quote_id: number;
  type: string;
  quantity: number;
  unit_price: string;
}

// Datos para actualizar (pueden ser parciales)
export interface UpdateInstallationPointDTO {
  quote_id?: number;
  type?: string;
  quantity?: number;
  unit_price?: string;
}
