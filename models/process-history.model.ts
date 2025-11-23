// src/models/process-history.model.ts

// Registro de historial de un proceso
export interface ProcessHistoryEntry {
  id: number;
  process_id: number;
  old_status: string | null;   // estado anterior (puede ser null si es creación)
  new_status: string | null;   // estado nuevo
  changed_by: number;          // id usuario que hizo el cambio
  note: string | null;         // comentario, ej: "Proceso creado."
  created_at: string;          // ISO date
}

// Para crear un registro de historial manualmente
export interface CreateProcessHistoryEntryDTO {
  process_id: number;
  old_status?: string | null;
  new_status?: string | null;
  changed_by: number;
  note?: string | null;
  // created_at normalmente lo pone el backend, así que no lo enviamos
}
