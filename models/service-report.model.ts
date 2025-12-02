// src/models/service-report.model.ts

// Reporte técnico asociado a un proceso
export interface ServiceReport {
  id: number;
  process_id: number;

  city: string;
  service_date: string; // ISO date string
  address: string;

  requested_by: string;
  email: string;
  phone: string;

  nit_document: string;
  company: string;

  service_value: string;       // viene como string en la respuesta
  service_value_note: string;
  service_description: string;

  // Flags (el backend devuelve 0/1)
  pending: number;                 // 0 ó 1
  pending_description: string;
  previous_service_charged: number;
  warranty: number;
  solved: number;
  training_given: number;
  ads_installed: number;
  equipment_tests: number;
  work_area_clean: number;

  entry_time: string;  // "HH:mm:ss"
  exit_time: string;   // "HH:mm:ss"

  representative_name: string;

  created_at: string;
  updated_at: string;
}

// Body para crear un reporte
export interface CreateServiceReportDTO {
  process_id: number;

  city: string;
  service_date: string;
  address: string;

  requested_by: string;
  email: string;
  phone: string;

  nit_document: string;
  company: string;

  service_value: string;
  service_value_note: string;
  service_description: string;

  pending: number;
  pending_description: string;
  previous_service_charged: number;
  warranty: number;
  solved: number;
  training_given: number;
  ads_installed: number;
  equipment_tests: number;
  work_area_clean: number;

  entry_time: string;
  exit_time: string;

  representative_name: string;
}

// Para actualizar (PUT) – todo opcional
export interface UpdateServiceReportDTO {
  process_id?: number;

  city?: string;
  service_date?: string;
  address?: string;

  requested_by?: string;
  email?: string;
  phone?: string;

  nit_document?: string;
  company?: string;

  service_value?: string;
  service_value_note?: string;
  service_description?: string;

  pending?: number;
  pending_description?: string;
  previous_service_charged?: number;
  warranty?: number;
  solved?: number;
  training_given?: number;
  ads_installed?: number;
  equipment_tests?: number;
  work_area_clean?: number;

  entry_time?: string;
  exit_time?: string;

  representative_name?: string;
}
