// src/models/process-material.model.ts

// Material asociado a un proceso, tal como lo devuelve la API
export interface ProcessMaterial {
  id: number;
  process_id: number;
  catalog_id: number;
  cable_accessory_id: number;
  quantity: number;

  // Datos del producto del catálogo
  catalog_reference: string;
  catalog_description: string;
  catalog_image_url: string;
  catalog_price: string;

  // Datos del cable/accesorio
  cable_name: string;
  cable_description: string;
  cable_measurement_type: string;
  cable_price: string;
}

// Datos necesarios para crear un material de proceso
export interface CreateProcessMaterialDTO {
  process_id: number;
  catalog_id: number;
  cable_accessory_id: number;
  quantity: number;
}

// Datos para actualizar un material de proceso (parcial)
export interface UpdateProcessMaterialDTO {
  process_id?: number;
  catalog_id?: number;
  cable_accessory_id?: number;
  quantity?: number;
}
