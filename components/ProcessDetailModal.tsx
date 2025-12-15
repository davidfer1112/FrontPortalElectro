// ProcessDetailModal.tsx
"use client"

import { useState, useRef } from "react"
import {
  X,
  Send,
  AlertOctagon,
  Plus,
  Package,
  CheckSquare,
  AlertCircle,
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
import { serviceReportsService } from "@/services/serviceReportsService"
import { processHistoryService } from "@/services/processHistoryService"

// ================== TIPOS AUXILIARES ==================

export type ProcessWithStage = Process & {
  current_stage: number
  client_signature?: string | null
}

export interface ProcessDetail extends ProcessWithStage {
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

// ================== CONST ETAPAS / HELPERS ==================

export const PROCESS_STAGES = [
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
] as const

export function mapStatusToStage(status: string): number {
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

// ================== TIMELINE ==================

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
        {/* Línea base gris conectando todas las etapas */}
        <div className="absolute top-10 left-6 right-6 h-1 bg-gray-200 rounded-full" />

        {/* Línea de progreso hasta la etapa actual */}
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

// ================== MODAL DETALLE ==================

export function ProcessDetailModal({
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

  // Estados asociados al proceso
  const [materials, setMaterials] = useState<ProcessMaterial[]>(
    process.materials,
  )
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
    assigned_to: process.assigned_to ?? 0,
  })

  // Notas
  const [newNote, setNewNote] = useState("")
  const [showDeleteNoteId, setShowDeleteNoteId] = useState<number | null>(null)

  // CRUD Materiales
  const [isAddingMaterial, setIsAddingMaterial] = useState(false)
  const [newMaterial, setNewMaterial] = useState<{
    catalog_id: number
    cable_accessory_id: number
    quantity: number
  }>({
    catalog_id: 0,
    cable_accessory_id: 0,
    quantity: 1,
  })

  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(
    null,
  )
  const [editingMaterialData, setEditingMaterialData] = useState<{
    catalog_id?: number
    cable_accessory_id?: number
    quantity?: number
  }>({})

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

      const statusByStage: Record<number, string> = {
        1: "pending",
        7: "done",
      }
      const newStatus = statusByStage[newStage] ?? "in_progress"

      const payload = {
        name: editData.name.trim(),
        created_by: process.created_by ?? 0,
        assigned_to:
          editData.assigned_to !== undefined && editData.assigned_to !== null
            ? editData.assigned_to
            : process.assigned_to ?? 0,
        status: newStatus,
        quote_id: process.quote_id ?? 0,
      }

      console.log("PUT /processes payload:", payload)

      const apiProcess = await processesService.update(process.id, payload)

      await processHistoryService.create({
        process_id: process.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: process.assigned_to,
        note: "Actualización de etapa desde panel de procesos",
      })

      const updated: ProcessDetail = {
        ...process,
        ...apiProcess,
        current_stage: newStage,
        materials,
        notes,
        alerts,
        serviceReport,
      }

      onUpdated(updated)
      setIsEditing(false)
      showToast("Proceso actualizado correctamente", "success")
    } catch (err: any) {
      console.error("Error al actualizar proceso:", err)
      console.error("Respuesta backend:", err?.response?.data)
      showToast("No se pudo actualizar el proceso", "error")
    }
  }

  // ======== CRUD MATERIALES ========

  const handleStartAddMaterial = () => {
    setIsAddingMaterial(true)
    setNewMaterial({
      catalog_id: 0,
      cable_accessory_id: 0,
      quantity: 1,
    })
  }

  const handleCancelAddMaterial = () => {
    setIsAddingMaterial(false)
  }

  const handleCreateMaterial = async () => {
    try {
      if (!newMaterial.quantity || newMaterial.quantity <= 0) {
        showToast("La cantidad debe ser mayor a 0", "error")
        return
      }

      if (!newMaterial.catalog_id && !newMaterial.cable_accessory_id) {
        showToast(
          "Debes indicar al menos catalog_id o cable_accessory_id",
          "error",
        )
        return
      }

      const body = {
        process_id: process.id,
        catalog_id: newMaterial.catalog_id,
        cable_accessory_id: newMaterial.cable_accessory_id,
        quantity: newMaterial.quantity,
      }

      const created = await processMaterialsService.create(body)
      setMaterials((prev) => [...prev, created])
      setIsAddingMaterial(false)
      showToast("Material agregado correctamente", "success")
    } catch (err: any) {
      console.error("Error al crear material:", err)
      console.error("Respuesta backend:", err?.response?.data)
      showToast("No se pudo agregar el material", "error")
    }
  }

  const handleStartEditMaterial = (material: ProcessMaterial) => {
    setEditingMaterialId(material.id)
    setEditingMaterialData({
      catalog_id: material.catalog_id,
      cable_accessory_id: material.cable_accessory_id,
      quantity: material.quantity,
    })
  }

  const handleCancelEditMaterial = () => {
    setEditingMaterialId(null)
    setEditingMaterialData({})
  }

  const handleSaveEditMaterial = async (material: ProcessMaterial) => {
    try {
      const body = {
        process_id: process.id,
        catalog_id: editingMaterialData.catalog_id ?? material.catalog_id,
        cable_accessory_id:
          editingMaterialData.cable_accessory_id ?? material.cable_accessory_id,
        quantity: editingMaterialData.quantity ?? material.quantity,
      }

      const updated = await processMaterialsService.update(material.id, body)

      setMaterials((prev) =>
        prev.map((m) => (m.id === material.id ? updated : m)),
      )

      setEditingMaterialId(null)
      setEditingMaterialData({})
      showToast("Material actualizado correctamente", "success")
    } catch (err: any) {
      console.error("Error al actualizar material:", err)
      console.error("Respuesta backend:", err?.response?.data)
      showToast("No se pudo actualizar el material", "error")
    }
  }

  const handleDeleteMaterial = async (material: ProcessMaterial) => {
    const confirmar = window.confirm(
      `¿Eliminar el material "${material.catalog_description || material.cable_name}"?`,
    )
    if (!confirmar) return

    try {
      await processMaterialsService.remove(material.id)
      setMaterials((prev) => prev.filter((m) => m.id !== material.id))
      showToast("Material eliminado correctamente", "success")
    } catch (err: any) {
      console.error("Error al eliminar material:", err)
      console.error("Respuesta backend:", err?.response?.data)
      showToast("No se pudo eliminar el material", "error")
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
                      onChange={(e) => {
                        const v = e.target.value
                        setEditData((prev) => ({
                          ...prev,
                          assigned_to: v === "" ? 0 : Number(v),
                        }))
                      }}
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
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Producto / Cable
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Cantidad
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Catalog ID
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Cable/Accesorio ID
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => {
                        const isRowEditing = editingMaterialId === m.id
                        return (
                          <tr
                            key={m.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-900">
                              {m.catalog_description || m.cable_name || "-"}
                            </td>

                            {/* Cantidad */}
                            <td className="py-3 px-4 text-gray-900">
                              {isRowEditing ? (
                                <input
                                  type="number"
                                  min={1}
                                  value={
                                    editingMaterialData.quantity ?? m.quantity
                                  }
                                  onChange={(e) =>
                                    setEditingMaterialData((prev) => ({
                                      ...prev,
                                      quantity: Number(e.target.value || 0),
                                    }))
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                                />
                              ) : (
                                m.quantity
                              )}
                            </td>

                            {/* Catalog ID */}
                            <td className="py-3 px-4 text-gray-900">
                              {isRowEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    editingMaterialData.catalog_id ??
                                    m.catalog_id
                                  }
                                  onChange={(e) =>
                                    setEditingMaterialData((prev) => ({
                                      ...prev,
                                      catalog_id: Number(e.target.value || 0),
                                    }))
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                                />
                              ) : (
                                m.catalog_id || "-"
                              )}
                            </td>

                            {/* Cable accessory ID */}
                            <td className="py-3 px-4 text-gray-900">
                              {isRowEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    editingMaterialData.cable_accessory_id ??
                                    m.cable_accessory_id
                                  }
                                  onChange={(e) =>
                                    setEditingMaterialData((prev) => ({
                                      ...prev,
                                      cable_accessory_id: Number(
                                        e.target.value || 0,
                                      ),
                                    }))
                                  }
                                  className="w-28 px-2 py-1 border border-gray-300 rounded"
                                />
                              ) : (
                                m.cable_accessory_id || "-"
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4 text-right">
                              {isRowEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      handleSaveEditMaterial(m)
                                    }
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={handleCancelEditMaterial}
                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      handleStartEditMaterial(m)
                                    }
                                    className="p-2 rounded hover:bg-gray-100"
                                  >
                                    <Edit2 className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMaterial(m)}
                                    className="p-2 rounded hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}

                      {/* Fila para AGREGAR material */}
                      {isAddingMaterial && (
                        <tr className="bg-gray-50">
                          <td className="py-3 px-4 text-gray-500 text-sm">
                            Nuevo material para el proceso
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={1}
                              value={newMaterial.quantity}
                              onChange={(e) =>
                                setNewMaterial((prev) => ({
                                  ...prev,
                                  quantity: Number(e.target.value || 0),
                                }))
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={0}
                              value={newMaterial.catalog_id}
                              onChange={(e) =>
                                setNewMaterial((prev) => ({
                                  ...prev,
                                  catalog_id: Number(e.target.value || 0),
                                }))
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={0}
                              value={newMaterial.cable_accessory_id}
                              onChange={(e) =>
                                setNewMaterial((prev) => ({
                                  ...prev,
                                  cable_accessory_id: Number(
                                    e.target.value || 0,
                                  ),
                                }))
                              }
                              className="w-28 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={handleCreateMaterial}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={handleCancelAddMaterial}
                                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <p className="text-gray-600">
                    No hay materiales asociados al proceso.
                  </p>
                  {!isAddingMaterial && (
                    <button
                      onClick={handleStartAddMaterial}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar material
                    </button>
                  )}
                </>
              )}

              {!isAddingMaterial && materials.length > 0 && (
                <button
                  onClick={handleStartAddMaterial}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  <Plus className="w-4 h-4" />
                  Agregar material
                </button>
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
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
              {/* Aquí iría tu formulario completo de reporte de servicio técnico.
                  Lo dejo resumido para no alargar más el ejemplo, pero puedes
                  reutilizar el que ya tenías y usar handleReportFieldChange /
                  handleToggleFlag / handleSaveReport. */}
              <p className="text-sm text-gray-600">
                Aquí va el contenido del reporte de servicio técnico.
              </p>
              <button
                onClick={handleSaveReport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Guardar reporte
              </button>
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
