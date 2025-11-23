// src/models/process-alert.model.ts

// Alerta de proceso tal como la devuelve la API
export interface ProcessAlert {
  id: number;
  process_id: number;
  reported_by: number;
  alert_type: string;
  message: string;
  status: string;              // ej: "open", "closed"
  created_at: string;          // ISO date: "2025-11-07T19:06:23.000Z"
  resolved_at: string | null;  // null si aún no se ha resuelto
}

// Para crear una alerta nueva
export interface CreateProcessAlertDTO {
  process_id: number;
  reported_by: number;
  alert_type: string;
  message: string;
  status?: string;         // opcional, el backend puede poner "open" por defecto
}

// Para actualizar una alerta existente
export interface UpdateProcessAlertDTO {
  process_id?: number;
  reported_by?: number;
  alert_type?: string;
  message?: string;
  status?: string;
  resolved_at?: string | null;
}
