// src/models/process.model.ts

// Proceso / tarea ligada a una cotización
export interface Process {
  id: number;
  name: string;
  created_by: number;   // usuario que creó el proceso
  assigned_to: number;  // usuario asignado
  status: string;       // ej: "pending", "in_progress", "done"
  quote_id: number;     // id de la cotización asociada
  created_at: string;   // ISO date
  updated_at: string;   // ISO date
}

// Para crear un proceso
export interface CreateProcessDTO {
  name: string;
  created_by: number;
  assigned_to: number;
  status?: string;      // opcional, el backend puede poner "pending" por defecto
  quote_id: number;
}

// Para actualizar un proceso
export interface UpdateProcessDTO {
  name?: string;
  created_by?: number;
  assigned_to?: number;
  status?: string;
  quote_id?: number;
}
