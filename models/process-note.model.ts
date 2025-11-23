// src/models/process-note.model.ts

// Nota asociada a un proceso
export interface ProcessNote {
  id: number;
  process_id: number;
  note: string;
  created_at: string; // ISO date
}

// Para crear una nota nueva
export interface CreateProcessNoteDTO {
  process_id: number;
  note: string;
}

// Para actualizar una nota
export interface UpdateProcessNoteDTO {
  process_id?: number;
  note?: string;
}
