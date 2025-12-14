"use client"

import { useEffect, useState, useRef } from "react"
import {
  ChevronRight,
  AlertCircle,
  Plus,
  CheckCircle,
  X,
  Send,
  AlertOctagon,
  Package,
  CheckSquare,
  Truck,
  Zap,
  FileSignature,
  Edit2,
  Trash2,
  RotateCcw,
} from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

import type { Process } from "@/models/process.model"
import type { ProcessMaterial } from "@/models/process-material.model"
import type { ProcessNote } from "@/models/process-note.model"
import type { ProcessAlert } from "@/models/process-alert.model"
import type { ServiceReport } from "@/models/service-report.model"

import { processesService } from "@/services/processesService"
import { processMaterialsService } from "@/services/processMaterialsService"
import { processNotesService } from "@/services/processNotesService"
import { processAlertsService } from "@/services/processAlertsService"
import { serviceReportsService } from "@/services/serviceReportsService"
import { processHistoryService } from "@/services/processHistoryService"

// ================== TIPOS AUXILIARES FRONT ==================

export type ProcessWithStage = Process & {
  current_stage: number
  client_signature?: string | null
}

interface ProcessDetail extends ProcessWithStage {
  materials: ProcessMaterial[]
  notes: ProcessNote[]
  alerts: ProcessAlert[]
  serviceReport: ServiceReport | null
}

// Estado del formulario de reporte de servicio
type ServiceReportFormState = {
  id?: number
} & {
  process_id: number
  city: string
  service_date: string
  address: string
  requested_by: string
  email: string
  phone: string
  nit_document: string
  company: string
  service_value: string
  service_value_note: string
  service_description: string
  pending: number
  pending_description: string
  previous_service_charged: number
  warranty: number
  solved: number
  training_given: number
  ads_installed: number
  equipment_tests: number
  work_area_clean: number
  entry_time: string
  exit_time: string
  representative_name: string
}

// Toast
type ToastType = "success" | "error" | "info"
interface ToastState {
  message: string
  type: ToastType
}

// ================== CONST ETAPAS ==================

const PROCESS_STAGES = [
  {
    id: 1,
    name: "Creación",
    description: "Administrador crea el proceso",
    icon: Plus,
    color: "bg-blue-50",
  },
  {
    id: 2,
    name: "Alistamiento",
    description: "Almacén alista materiales",
    icon: Package,
    color: "bg-yellow-50",
  },
  {
    id: 3,
    name: "Validación",
    description: "Coordinador de Tecnología revisa",
    icon: CheckSquare,
    color: "bg-purple-50",
  },
  {
    id: 4,
    name: "Verificación",
    description: "Técnico verifica completitud",
    icon: AlertCircle,
    color: "bg-orange-50",
  },
  {
    id: 5,
    name: "Transporte",
    description: "Traslado al sitio",
    icon: Truck,
    color: "bg-cyan-50",
  },
  {
    id: 6,
    name: "Ejecución",
    description: "Instalación",
    icon: Zap,
    color: "bg-green-50",
  },
  {
    id: 7,
    name: "Finalización",
    description: "Requiere firma del cliente",
    icon: FileSignature,
    color: "bg-red-50",
  },
]

// ================== HELPERS ==================

/**
 * Mapea el campo status del backend al número de etapa.
 * Soporta:
 *  - status = "1" | "2" | ... "7"  (modo nuevo por etapa)
 *  - status = "pending" | "in_progress" | "done" (modo antiguo)
 */
function mapStatusToStage(status: string): number {
  const asNum = Number(status)
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= PROCESS_STAGES.length) {
    return asNum
  }

  switch (status) {
    case "pending":
      return 1
    case "in_progress":
      return 3
    case "done":
    case "completed":
      return 7
    default:
      return 1
  }
}

// ================== COMPONENTES ==================

// --- TIMELINE COMO LÍNEA CONECTADA ---
function ProcessTimeline({ process }: { process: ProcessWithStage }) {
  const totalStages = PROCESS_STAGES.length
  const normalizedIndex = Math.max(
    0,
    Math.min(process.current_stage - 1, totalStages - 1),
  )

  const progressPercent =
    totalStages > 1 ? (normalizedIndex / (totalStages - 1)) * 100 : 0

  return (
    <div className="mb-8">
      <h3 className="font-semibold text-gray-900 mb-6">Flujo del Proceso</h3>

      <div className="relative mt-4">
        {/* Línea base gris que conecta todas las etapas */}
        <div className="absolute top-10 left-6 right-6 h-1 bg-gray-200 rounded-full" />

        {/* Línea de progreso verde solo hasta la etapa actual */}
        <div
          className="absolute top-10 left-6 h-1 bg-green-500 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Etapas */}
        <div className="relative flex items-center justify-between">
          {PROCESS_STAGES.map((stage) => {
            const isCompleted = stage.id < process.current_stage
            const isActive = stage.id === process.current_stage
            const StageIcon = stage.icon

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center flex-1 text-center"
              >
                <div
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-green-100 border-green-500"
                      : isActive
                      ? `${stage.color} border-red-500 animate-pulse`
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <StageIcon
                    className={`w-8 h-8 ${
                      isCompleted
                        ? "text-green-600"
                        : isActive
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  />
                </div>
                <div className="mt-4">
                  <p className="font-semibold text-gray-900 text-sm">
                    {stage.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {stage.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------------------------

function ProcessDetailModal({
  process,
  onClose,
  onUpdated,
}: {
  process: ProcessDetail
  onClose: () => void
  onUpdated: (p: ProcessDetail) => void
}) {
  const [activeTab, setActiveTab] = useState<
    "timeline" | "materials" | "notes" | "alerts" | "report"
  >("timeline")

  // Estado local de datos asociados
  const [materials] = useState<ProcessMaterial[]>(process.materials)
  const [notes, setNotes] = useState<ProcessNote[]>(process.notes)
  const [alerts] = useState<ProcessAlert[]>(process.alerts)
  const [serviceReport, setServiceReport] = useState<ServiceReport | null>(
    process.serviceReport,
  )

  // Edición básica del proceso
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: process.name,
    status: String(process.current_stage ?? mapStatusToStage(process.status)),
    assigned_to: process.assigned_to,
  })

  // Notas
  const [newNote, setNewNote] = useState("")
  const [showDeleteNoteId, setShowDeleteNoteId] = useState<number | null>(null)

  // Reporte de servicio
  const [reportForm, setReportForm] = useState<ServiceReportFormState>(() => {
    if (serviceReport) {
      return {
        id: serviceReport.id,
        process_id: serviceReport.process_id,
        city: serviceReport.city,
        service_date: serviceReport.service_date.slice(0, 10),
        address: serviceReport.address,
        requested_by: serviceReport.requested_by,
        email: serviceReport.email,
        phone: serviceReport.phone,
        nit_document: serviceReport.nit_document,
        company: serviceReport.company,
        service_value: serviceReport.service_value,
        service_value_note: serviceReport.service_value_note,
        service_description: serviceReport.service_description,
        pending: serviceReport.pending,
        pending_description: serviceReport.pending_description,
        previous_service_charged: serviceReport.previous_service_charged,
        warranty: serviceReport.warranty,
        solved: serviceReport.solved,
        training_given: serviceReport.training_given,
        ads_installed: serviceReport.ads_installed,
        equipment_tests: serviceReport.equipment_tests,
        work_area_clean: serviceReport.work_area_clean,
        entry_time: serviceReport.entry_time,
        exit_time: serviceReport.exit_time,
        representative_name: serviceReport.representative_name,
      }
    }

    // valores por defecto para crear
    return {
      process_id: process.id,
      city: "",
      service_date: new Date().toISOString().slice(0, 10),
      address: "",
      requested_by: "",
      email: "",
      phone: "",
      nit_document: "",
      company: "",
      service_value: "",
      service_value_note: "",
      service_description: "",
      pending: 0,
      pending_description: "",
      previous_service_charged: 0,
      warranty: 0,
      solved: 1,
      training_given: 0,
      ads_installed: 0,
      equipment_tests: 0,
      work_area_clean: 0,
      entry_time: "08:00:00",
      exit_time: "17:00:00",
      representative_name: "",
    }
  })

  // Firma (solo frontend)
  const [clientSignature, setClientSignature] = useState<string | null>(null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)

  const [toast, setToast] = useState<ToastState | null>(null)
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ======== acciones proceso ========

  const handleSaveEdit = async () => {
    try {
      const oldStatus = process.status
      const newStage = Number(editData.status)

      if (!newStage || newStage < 1 || newStage > PROCESS_STAGES.length) {
        showToast("Etapa inválida", "error")
        return
      }

      await processesService.update(process.id, {
        name: editData.name,
        status: String(newStage),
        assigned_to: editData.assigned_to,
      })

      await processHistoryService.create({
        process_id: process.id,
        old_status: oldStatus,
        new_status: String(newStage),
        changed_by: process.assigned_to,
        note: "Actualización de etapa desde panel de procesos",
      })

      const updated: ProcessDetail = {
        ...process,
        name: editData.name,
        status: String(newStage),
        assigned_to: editData.assigned_to,
        current_stage: newStage,
        materials,
        notes,
        alerts,
        serviceReport,
      }
      onUpdated(updated)
      setIsEditing(false)
      showToast("Proceso actualizado correctamente", "success")
    } catch (err) {
      console.error(err)
      showToast("No se pudo actualizar el proceso", "error")
    }
  }

  // ======== notas ========

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      const created = await processNotesService.create({
        process_id: process.id,
        note: newNote.trim(),
      })
      setNotes((prev) => [...prev, created])
      setNewNote("")
      showToast("Nota agregada", "success")
    } catch (err) {
      console.error(err)
      showToast("No se pudo agregar la nota", "error")
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      await processNotesService.remove(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      setShowDeleteNoteId(null)
      showToast("Nota eliminada", "success")
    } catch (err) {
      console.error(err)
      showToast("No se pudo eliminar la nota", "error")
    }
  }

  // ======== firma ========

  const handleSignature = () => {
    if (!signatureCanvasRef.current) return
    const data = signatureCanvasRef.current.toDataURL("image/png")
    setClientSignature(data)
    setShowSignaturePad(false)
    showToast("Firma registrada (solo visual)", "success")
  }

  const clearSignature = () => {
    signatureCanvasRef.current?.clear()
  }

  // ======== reporte de servicio ========

  const handleReportFieldChange = (
    field: keyof ServiceReportFormState,
    value: string | number,
  ) => {
    setReportForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleToggleFlag = (field: keyof ServiceReportFormState) => {
    setReportForm((prev) => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1,
    }))
  }

  const handleSaveReport = async () => {
    try {
      if (reportForm.id) {
        const { id, ...body } = reportForm
        const updated = await serviceReportsService.update(id, body)
        setServiceReport(updated)
        showToast("Reporte actualizado correctamente", "success")
      } else {
        const { id, ...body } = reportForm
        const created = await serviceReportsService.create(body)
        setServiceReport(created)
        setReportForm((prev) => ({ ...prev, id: created.id }))
        showToast("Reporte creado correctamente", "success")
      }
    } catch (err) {
      console.error(err)
      showToast("No se pudo guardar el reporte", "error")
    }
  }

  // ================== RENDER ==================

  const effectiveStage = mapStatusToStage(editData.status)

  const updatedProcess: ProcessDetail = {
    ...process,
    name: editData.name,
    status: editData.status,
    current_stage: effectiveStage,
    materials,
    notes,
    alerts,
    serviceReport,
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Nombre del Proceso
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Etapa del flujo
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-red-500"
                    >
                      {PROCESS_STAGES.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.id}. {stage.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      ID Usuario Asignado
                    </label>
                    <input
                      type="number"
                      value={editData.assigned_to}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          assigned_to: Number.parseInt(
                            e.target.value || "0",
                          ),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">
                  {process.name}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Etapa actual:{" "}
                  <span className="font-semibold">
                    {PROCESS_STAGES[updatedProcess.current_stage - 1]?.name}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Creado:{" "}
                  {new Date(process.created_at).toLocaleString()} • Actualizado:{" "}
                  {new Date(process.updated_at).toLocaleString()}
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-0 bg-gray-50 overflow-x-auto">
          {(["timeline", "materials", "notes", "alerts", "report"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-red-600 border-red-500"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                {tab === "timeline" && "Flujo"}
                {tab === "materials" && "Materiales"}
                {tab === "notes" && "Notas"}
                {tab === "alerts" && "Alertas"}
                {tab === "report" && "Reporte Servicio Técnico"}
              </button>
            ),
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "timeline" && (
            <ProcessTimeline process={updatedProcess} />
          )}

          {activeTab === "materials" && (
            <div className="space-y-4">
              {materials.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                          Producto
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                          Cantidad
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                          Origen
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-gray-900">
                            {m.catalog_description || m.cable_name}
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            {m.quantity}
                          </td>
                          <td className="py-3 px-4 text-gray-700 text-sm">
                            {m.catalog_id ? "Catálogo" : "Cable/Accesorio"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">
                  No hay materiales asociados al proceso.
                </p>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-900 text-sm">{note.note}</p>
                        <p className="text-xs text-gray-600 mt-2">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteNoteId(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-gray-600 text-sm">
                    No hay notas registradas.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddNote()
                    }
                    placeholder="Agregar una nota..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.status === "open"
                        ? "bg-red-50 border-red-500"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertOctagon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            alert.status === "open"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {alert.alert_type}
                          </p>
                          <p className="text-gray-700 text-sm mt-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          alert.status === "open"
                            ? "bg-red-200 text-red-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {alert.status === "open" ? "Activa" : "Resuelta"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No hay alertas registradas.</p>
              )}
            </div>
          )}

          {activeTab === "report" && (
            <div className="space-y-6">
              {/* Aquí puedes pegar tu contenido completo del formulario de reporte */}
              <p className="text-sm text-gray-600">
                Aquí va el contenido del reporte de servicio técnico.
              </p>
              {/* Ejemplo de uso de handlers para que no se pierdan */}
              {/* 
                - handleReportFieldChange("city", "Bogotá")
                - handleToggleFlag("pending")
                - handleSaveReport()
              */}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50"
          >
            Cerrar
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar proceso
            </button>
          )}
        </div>
      </div>

      {/* Modal eliminar nota */}
      {showDeleteNoteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              Eliminar nota
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar esta nota?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteNoteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteNote(showDeleteNoteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              Firma del cliente / representante
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pida al cliente que firme en el recuadro.
            </p>

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={signatureCanvasRef}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "w-full touch-none",
                }}
              />
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={clearSignature}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar
              </button>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSignature}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Confirmar firma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-medium z-[80] ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

function ProcessCard({
  process,
  onClick,
}: {
  process: ProcessWithStage
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-red-500 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">
            {process.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-gray-600">
              Etapa: {PROCESS_STAGES[process.current_stage - 1]?.name}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            ID: {process.id} •{" "}
            {new Date(process.created_at).toLocaleDateString()}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  )
}

// ================== SECCIÓN PRINCIPAL ==================

export function ProcessesSection() {
  const [processes, setProcesses] = useState<ProcessWithStage[]>([])
  const [selectedProcess, setSelectedProcess] =
    useState<ProcessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastState | null>(null)
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const loadProcesses = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiProcesses = await processesService.getAll()
      const mapped: ProcessWithStage[] = apiProcesses.map((p) => ({
        ...p,
        current_stage: mapStatusToStage(p.status),
        client_signature: null,
      }))
      setProcesses(mapped)
    } catch (err) {
      console.error(err)
      setError("No se pudieron cargar los procesos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProcesses()
  }, [])

  const openProcess = async (p: ProcessWithStage) => {
    try {
      setLoadingDetail(true)
      const [materials, notes, alerts, reports] = await Promise.all([
        processMaterialsService.getAll(p.id),
        processNotesService.getAll(p.id),
        processAlertsService.getAll(p.id),
        serviceReportsService.getByProcess(p.id),
      ])

      const detail: ProcessDetail = {
        ...p,
        materials,
        notes,
        alerts,
        serviceReport: reports[0] ?? null,
      }
      setSelectedProcess(detail)
    } catch (err) {
      console.error(err)
      showToast("No se pudo cargar el detalle del proceso", "error")
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleProcessUpdated = (updated: ProcessDetail) => {
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === updated.id ? { ...p, ...updated } : p,
      ),
    )
    setSelectedProcess(updated)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Procesos
        </h1>
        <p className="text-gray-600">
          Gestiona y supervisa todos los procesos de instalación
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}{" "}
            <button onClick={loadProcesses} className="underline">
              Reintentar
            </button>
          </p>
        )}
      </div>

      {/* Toolbar básica con totales por estado */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 flex-wrap">
          {(["1", "2", "3", "4", "5", "6", "7"] as const).map(
            (statusStr) => {
              const stageId = Number(statusStr)
              const count = processes.filter(
                (p) => mapStatusToStage(p.status) === stageId,
              ).length
              const label =
                PROCESS_STAGES[stageId - 1]?.name ??
                `Etapa ${stageId}`
              return (
                <span
                  key={statusStr}
                  className="px-4 py-2 rounded font-medium text-sm bg-gray-100 text-gray-900"
                >
                  {label} ({count})
                </span>
              )
            },
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Nuevo proceso
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando procesos...</p>
      ) : processes.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            No hay procesos creados. Crea un nuevo proceso para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {processes.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onClick={() => openProcess(process)}
            />
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white px-4 py-3 rounded-lg shadow text-gray-700 text-sm">
            Cargando detalle del proceso...
          </div>
        </div>
      )}

      {selectedProcess && (
        <ProcessDetailModal
          process={selectedProcess}
          onClose={() => setSelectedProcess(null)}
          onUpdated={handleProcessUpdated}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-medium z-[90] ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
