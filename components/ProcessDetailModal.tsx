// ProcessDetailModal.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  Search,
} from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

import type { Process } from "@/models/process.model"
import type { ProcessMaterial } from "@/models/process-material.model"
import type { ProcessNote } from "@/models/process-note.model"
import type { ProcessAlert } from "@/models/process-alert.model"
import type { ServiceReport } from "@/models/service-report.model"
import type { CatalogProduct } from "@/models/catalog.model"
import type { CableOrAccessory } from "@/models/cables"

import { processesService } from "@/services/processesService"
import { processMaterialsService } from "@/services/processMaterialsService"
import { processNotesService } from "@/services/processNotesService"
import { serviceReportsService } from "@/services/serviceReportsService"
import { processHistoryService } from "@/services/processHistoryService"
import { catalogService } from "@/services/catalogService"
import { cablesAndAccessoriesService } from "@/services/cablesAndAccessoriesService"
import { processAlertsService } from "@/services/processAlertsService"


import Image from "next/image"

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
        <div className="absolute top-10 left-6 right-6 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-10 left-6 h-1 bg-green-500 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />

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

  // Cargas iniciales
  const [loadingInit, setLoadingInit] = useState(true)

  // Estados asociados al proceso
  const [materials, setMaterials] = useState<ProcessMaterial[]>(
    process.materials ?? [],
  )
  const [notes, setNotes] = useState<ProcessNote[]>(process.notes ?? [])
  const [alerts, setAlerts] = useState<ProcessAlert[]>(process.alerts ?? [])
  const [serviceReport, setServiceReport] = useState<ServiceReport | null>(
    process.serviceReport ?? null,
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

// Alertas (crear)
const [newAlertType, setNewAlertType] = useState("general")
const [newAlertMessage, setNewAlertMessage] = useState("")
const [creatingAlert, setCreatingAlert] = useState(false)

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

  // ===== Selector unificado: Catálogo + Cables/Accesorios =====

type SelectedMaterial =
  | { kind: "catalog"; item: CatalogProduct }
  | { kind: "cable"; item: CableOrAccessory }

const [showMaterialPicker, setShowMaterialPicker] = useState(false)

const [catalog, setCatalog] = useState<CatalogProduct[]>([])
const [catalogLoading, setCatalogLoading] = useState(false)

const [cables, setCables] = useState<CableOrAccessory[]>([])
const [cablesLoading, setCablesLoading] = useState(false)

const [materialSearch, setMaterialSearch] = useState("")
const [selectedMaterial, setSelectedMaterial] = useState<SelectedMaterial | null>(null)

  // Reporte de servicio (form)
  const buildDefaultReportForm = (sr: ServiceReport | null): ServiceReportFormState => {
    if (sr) {
      return {
        id: sr.id,
        process_id: sr.process_id,
        city: sr.city,
        service_date: sr.service_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        address: sr.address,
        requested_by: sr.requested_by,
        email: sr.email,
        phone: sr.phone,
        nit_document: sr.nit_document,
        company: sr.company,
        service_value: sr.service_value,
        service_value_note: sr.service_value_note,
        service_description: sr.service_description,
        pending: sr.pending,
        pending_description: sr.pending_description,
        previous_service_charged: sr.previous_service_charged,
        warranty: sr.warranty,
        solved: sr.solved,
        training_given: sr.training_given,
        ads_installed: sr.ads_installed,
        equipment_tests: sr.equipment_tests,
        work_area_clean: sr.work_area_clean,
        entry_time: sr.entry_time,
        exit_time: sr.exit_time,
        representative_name: sr.representative_name,
      }
    }

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
  }

  const [reportForm, setReportForm] = useState<ServiceReportFormState>(() =>
    buildDefaultReportForm(process.serviceReport ?? null),
  )

  // Firma (solo frontend)
  const [clientSignature, setClientSignature] = useState<string | null>(null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)

  const [toast, setToast] = useState<ToastState | null>(null)
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ================== CARGA REAL DEL BACKEND (FIX DE TU PROBLEMA) ==================
  // Esto asegura que aunque "process" llegue sin materials/serviceReport, el modal los trae.
  useEffect(() => {
    let mounted = true

    const loadAll = async () => {
  try {
    setLoadingInit(true)

    const [mats, nts, alts, reports] = await Promise.all([
  processMaterialsService.getAll(process.id),
  processNotesService.getAll?.(process.id) ?? Promise.resolve(process.notes ?? []),
  processAlertsService.getAll(process.id),
  serviceReportsService.getByProcess(process.id),
])

const rep = reports?.[0] ?? null

setMaterials(mats ?? [])
setNotes((nts as any) ?? [])
setAlerts((alts as any) ?? [])
setServiceReport(rep)
setReportForm(buildDefaultReportForm(rep))
  } catch (err: any) {
    console.error("Error cargando detalle del proceso:", err)
    console.error("Respuesta backend:", err?.response?.data)
    showToast("No se pudo cargar el detalle del proceso", "error")
  } finally {
    setLoadingInit(false)
  }
}


    loadAll()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.id])


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



  const handleCreateAlert = async () => {
  try {
    if (!newAlertMessage.trim()) {
      showToast("Escribe el mensaje de la alerta", "error")
      return
    }

    setCreatingAlert(true)

    const created = await processAlertsService.create({
      process_id: process.id,
      reported_by: Number(process.assigned_to ?? process.created_by ?? 0), // AJUSTA si tienes userId real
      alert_type: newAlertType,
      message: newAlertMessage.trim(),
      status: "open",
    })

    setAlerts((prev) => [created, ...prev])
    setNewAlertMessage("")
    setNewAlertType("general")
    showToast("Alerta creada", "success")
  } catch (err: any) {
    console.error("Error creando alerta:", err)
    console.error("Respuesta backend:", err?.response?.data)
    showToast("No se pudo crear la alerta", "error")
  } finally {
    setCreatingAlert(false)
  }
}

const handleResolveAlert = async (alert: ProcessAlert) => {
  try {
    const updated = await processAlertsService.update(alert.id, {
      status: "closed",
      resolved_at: new Date().toISOString(),
    })

    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? updated : a)))
    showToast("Alerta marcada como resuelta", "success")
  } catch (err: any) {
    console.error("Error resolviendo alerta:", err)
    console.error("Respuesta backend:", err?.response?.data)
    showToast("No se pudo resolver la alerta", "error")
  }
}

const handleDeleteAlert = async (alertId: number) => {
  const ok = window.confirm("¿Eliminar esta alerta?")
  if (!ok) return

  try {
    await processAlertsService.remove(alertId)
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    showToast("Alerta eliminada", "success")
  } catch (err: any) {
    console.error("Error eliminando alerta:", err)
    console.error("Respuesta backend:", err?.response?.data)
    showToast("No se pudo eliminar la alerta", "error")
  }
}


  // ======== CRUD MATERIALES (CATÁLOGO) ========

  const handleStartAddMaterial = () => {
  setIsAddingMaterial(true)
  setNewMaterial({
    catalog_id: 0,
    cable_accessory_id: 0,
    quantity: 1,
  })
  setSelectedMaterial(null)
}

 const handleCancelAddMaterial = () => {
  setIsAddingMaterial(false)
  setSelectedMaterial(null)
  setNewMaterial({ catalog_id: 0, cable_accessory_id: 0, quantity: 1 })
}

  const handleOpenMaterialPicker = async () => {
  try {
    setShowMaterialPicker(true)
    setMaterialSearch("")

    // carga ambas fuentes si están vacías
    if (catalog.length === 0) {
      setCatalogLoading(true)
      const data = await catalogService.getAll()
      setCatalog(data ?? [])
    }

    if (cables.length === 0) {
      setCablesLoading(true)
      const data = await cablesAndAccessoriesService.getAll()
      setCables(data ?? [])
    }
  } catch (err: any) {
    console.error("Error cargando materiales:", err)
    showToast("No se pudo cargar el listado de materiales", "error")
    setShowMaterialPicker(false)
  } finally {
    setCatalogLoading(false)
    setCablesLoading(false)
  }
}

const handleSelectCatalogItem = (product: CatalogProduct) => {
  setSelectedMaterial({ kind: "catalog", item: product })
  setNewMaterial((prev) => ({
    ...prev,
    catalog_id: product.id,
    cable_accessory_id: 0, // importante: anula el otro
  }))
  setShowMaterialPicker(false)
}

const handleSelectCableItem = (c: CableOrAccessory) => {
  setSelectedMaterial({ kind: "cable", item: c })
  setNewMaterial((prev) => ({
    ...prev,
    catalog_id: 0, // importante: anula el otro
    cable_accessory_id: c.id,
  }))
  setShowMaterialPicker(false)
}


  const handleCreateMaterial = async () => {
  try {
    if (!newMaterial.quantity || newMaterial.quantity <= 0) {
      showToast("La cantidad debe ser mayor a 0", "error")
      return
    }

    // debe seleccionar UNA fuente
    const hasCatalog = newMaterial.catalog_id && newMaterial.catalog_id > 0
    const hasCable = newMaterial.cable_accessory_id && newMaterial.cable_accessory_id > 0

    if (!hasCatalog && !hasCable) {
      showToast("Debes seleccionar un material (catálogo o cable/accesorio)", "error")
      return
    }

    if (hasCatalog && hasCable) {
      showToast("Selecciona solo uno: catálogo o cable/accesorio", "error")
      return
    }

    const body = {
      process_id: process.id,
      catalog_id: hasCatalog ? newMaterial.catalog_id : 0,
      cable_accessory_id: hasCable ? newMaterial.cable_accessory_id : 0,
      quantity: newMaterial.quantity,
    }

    const created = await processMaterialsService.create(body)

    setMaterials((prev) => [...prev, created])
    setIsAddingMaterial(false)
    setSelectedMaterial(null)
    setNewMaterial({ catalog_id: 0, cable_accessory_id: 0, quantity: 1 })

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
      `¿Eliminar el material "${
        material.catalog_description || material.cable_name || "Material"
      }"?`,
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
        setReportForm(buildDefaultReportForm(updated))
        showToast("Reporte actualizado correctamente", "success")
      } else {
        const { id, ...body } = reportForm
        const created = await serviceReportsService.create(body)
        setServiceReport(created)
        setReportForm(buildDefaultReportForm(created))
        showToast("Reporte creado correctamente", "success")
      }
    } catch (err: any) {
      console.error(err)
      console.error("Respuesta backend:", err?.response?.data)
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

  const filteredCatalog = useMemo(() => {
  const term = materialSearch.trim().toLowerCase()
  if (!term) return catalog
  return catalog.filter((p) => {
    return (
      p.reference?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    )
  })
}, [catalog, materialSearch])

const filteredCables = useMemo(() => {
  const term = materialSearch.trim().toLowerCase()
  if (!term) return cables
  return cables.filter((c) => {
    return (
      c.name?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.measurement_type?.toLowerCase().includes(term)
    )
  })
}, [cables, materialSearch])


  const Field = ({
    label,
    children,
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">
        {label}
      </label>
      {children}
    </div>
  )

  const Toggle = ({
    label,
    value,
    onClick,
  }: {
    label: string
    value: number
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition ${
        value === 1
          ? "border-green-600 bg-green-50 text-green-800"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="ml-2 text-xs opacity-80">
        ({value === 1 ? "Sí" : "No"})
      </span>
    </button>
  )

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
              <h2 className="text-2xl font-bold text-gray-900">{process.name}</h2>
              <p className="text-sm text-gray-600 mt-2">
                Etapa actual:{" "}
                <span className="font-semibold">
                  {PROCESS_STAGES[updatedProcess.current_stage - 1]?.name}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Creado: {new Date(process.created_at).toLocaleString()} • Actualizado:{" "}
                {new Date(process.updated_at).toLocaleString()}
              </p>
            </>
          )}
        </div>

        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0 bg-gray-50 overflow-x-auto">
        {(["timeline", "materials", "notes", "alerts", "report"] as const).map((tab) => (
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
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loadingInit ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            Cargando información del proceso...
          </div>
        ) : (
          <>
            {activeTab === "timeline" && <ProcessTimeline process={updatedProcess} />}

            {activeTab === "materials" && (
              <div className="space-y-4">
                {/* Renderiza tabla si hay materiales O si estás agregando */}
                {materials.length > 0 || isAddingMaterial ? (
                  <>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Producto
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Cantidad
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900">
                              Acciones
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {/* Filas existentes */}
                          {materials.map((m) => {
                            const isRowEditing = editingMaterialId === m.id
                            return (
                              <tr key={m.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900">
                                  <div className="flex items-center gap-3">
                                    {m.catalog_image_url ? (
                                      <img
                                        src={m.catalog_image_url}
                                        alt={m.catalog_reference}
                                        className="w-10 h-10 rounded object-cover border"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-gray-100 border flex items-center justify-center text-[10px] text-gray-600">
                                        {m.cable_name ? "CAB" : ""}
                                      </div>
                                    )}

                                    <div>
                                      <p className="font-medium">
                                        {m.catalog_reference || m.cable_name || "-"}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {m.catalog_description || m.cable_description || ""}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-gray-900">
                                  {isRowEditing ? (
                                    <input
                                      type="number"
                                      min={1}
                                      value={editingMaterialData.quantity ?? m.quantity}
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

                                <td className="py-3 px-4 text-right">
                                  {isRowEditing ? (
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => handleSaveEditMaterial(m)}
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
                                        onClick={() => handleStartEditMaterial(m)}
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

                          {/* Fila para AGREGAR material (sirve aun con materials vacío) */}
                          {isAddingMaterial && (
                            <tr className="bg-gray-50">
                              <td className="py-3 px-4 text-gray-900">
                                {selectedMaterial ? (
                                  <div className="flex items-center gap-3">
                                    {selectedMaterial.kind === "catalog" ? (
                                      selectedMaterial.item.image_url ? (
                                        <img
                                          src={selectedMaterial.item.image_url}
                                          alt={selectedMaterial.item.reference}
                                          className="w-10 h-10 rounded object-cover border"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-gray-100 border" />
                                      )
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-gray-100 border flex items-center justify-center text-[10px] text-gray-700">
                                        CAB
                                      </div>
                                    )}

                                    <div>
                                      {selectedMaterial.kind === "catalog" ? (
                                        <>
                                          <p className="font-medium">
                                            {selectedMaterial.item.reference}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {selectedMaterial.item.description}
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <p className="font-medium">{selectedMaterial.item.name}</p>
                                          <p className="text-xs text-gray-600">
                                            {selectedMaterial.item.description} •{" "}
                                            {selectedMaterial.item.measurement_type}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">Sin material seleccionado</span>
                                )}

                                <button
                                  type="button"
                                  onClick={handleOpenMaterialPicker}
                                  className="mt-2 text-xs text-red-600 underline inline-flex items-center gap-1"
                                >
                                  <Search className="w-3 h-3" />
                                  Buscar material (catálogo / cables)
                                </button>
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
                ) : (
                  <>
                    <p className="text-gray-600">No hay materiales asociados al proceso.</p>
                    <button
                      onClick={handleStartAddMaterial}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar material
                    </button>
                  </>
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
                    <p className="text-gray-600 text-sm">No hay notas registradas.</p>
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
  <div className="space-y-5">
    {/* Crear alerta */}
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-900 mb-3">Crear alerta</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Tipo
          </label>
          <select
            value={newAlertType}
            onChange={(e) => setNewAlertType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 bg-white"
          >
            <option value="general">General</option>
            <option value="materiales">Materiales</option>
            <option value="instalacion">Instalación</option>
            <option value="transporte">Transporte</option>
            <option value="seguridad">Seguridad</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Mensaje
          </label>
          <div className="flex gap-2">
            <input
              value={newAlertMessage}
              onChange={(e) => setNewAlertMessage(e.target.value)}
              placeholder="Describe la alerta..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 bg-white"
              onKeyDown={(e) => e.key === "Enter" && handleCreateAlert()}
            />
            <button
              onClick={handleCreateAlert}
              disabled={creatingAlert}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {creatingAlert ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Listado */}
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertOctagon
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    alert.status === "open" ? "text-red-600" : "text-gray-600"
                  }`}
                />
                <div>
                  <p className="font-semibold text-gray-900 capitalize">
                    {alert.alert_type}
                  </p>
                  <p className="text-gray-700 text-sm mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                    {alert.resolved_at ? (
                      <>
                        {" "}
                        • Resuelta:{" "}
                        {new Date(alert.resolved_at).toLocaleString()}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    alert.status === "open"
                      ? "bg-red-200 text-red-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {alert.status === "open" ? "Activa" : "Resuelta"}
                </span>

                {alert.status === "open" && (
                  <button
                    onClick={() => handleResolveAlert(alert)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    title="Marcar como resuelta"
                  >
                    Resolver
                  </button>
                )}

                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="p-2 rounded hover:bg-red-50"
                  title="Eliminar alerta"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No hay alertas registradas.</p>
      )}
    </div>
  </div>
)}


            {activeTab === "report" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Reporte de Servicio Técnico</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {serviceReport
                        ? `Reporte #${serviceReport.id} cargado`
                        : "No existe reporte aún. Puedes crearlo y guardarlo."}
                    </p>
                  </div>

                  <button
                    onClick={handleSaveReport}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Guardar reporte
                  </button>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
                  <Field label="Ciudad">
                    <input
                      value={reportForm.city}
                      onChange={(e) => handleReportFieldChange("city", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Fecha de servicio">
                    <input
                      type="date"
                      value={reportForm.service_date}
                      onChange={(e) =>
                        handleReportFieldChange("service_date", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Dirección">
                    <input
                      value={reportForm.address}
                      onChange={(e) => handleReportFieldChange("address", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Solicitado por">
                    <input
                      value={reportForm.requested_by}
                      onChange={(e) =>
                        handleReportFieldChange("requested_by", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      value={reportForm.email}
                      onChange={(e) => handleReportFieldChange("email", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Teléfono">
                    <input
                      value={reportForm.phone}
                      onChange={(e) => handleReportFieldChange("phone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="NIT / Documento">
                    <input
                      value={reportForm.nit_document}
                      onChange={(e) =>
                        handleReportFieldChange("nit_document", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Empresa">
                    <input
                      value={reportForm.company}
                      onChange={(e) => handleReportFieldChange("company", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Hora de entrada">
                    <input
                      type="time"
                      value={reportForm.entry_time?.slice(0, 5)}
                      onChange={(e) =>
                        handleReportFieldChange(
                          "entry_time",
                          e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Hora de salida">
                    <input
                      type="time"
                      value={reportForm.exit_time?.slice(0, 5)}
                      onChange={(e) =>
                        handleReportFieldChange(
                          "exit_time",
                          e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Valor del servicio">
                    <input
                      value={reportForm.service_value}
                      onChange={(e) =>
                        handleReportFieldChange("service_value", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Nota valor">
                    <input
                      value={reportForm.service_value_note}
                      onChange={(e) =>
                        handleReportFieldChange("service_value_note", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Descripción del servicio">
                      <textarea
                        value={reportForm.service_description}
                        onChange={(e) =>
                          handleReportFieldChange("service_description", e.target.value)
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                      />
                    </Field>
                  </div>
                </div>

                {/* TOGGLES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Toggle
                    label="Solucionado"
                    value={reportForm.solved}
                    onClick={() => handleToggleFlag("solved")}
                  />
                  <Toggle
                    label="Capacitación brindada"
                    value={reportForm.training_given}
                    onClick={() => handleToggleFlag("training_given")}
                  />
                  <Toggle
                    label="Instaló ADS"
                    value={reportForm.ads_installed}
                    onClick={() => handleToggleFlag("ads_installed")}
                  />
                  <Toggle
                    label="Pruebas de equipo"
                    value={reportForm.equipment_tests}
                    onClick={() => handleToggleFlag("equipment_tests")}
                  />
                  <Toggle
                    label="Área limpia"
                    value={reportForm.work_area_clean}
                    onClick={() => handleToggleFlag("work_area_clean")}
                  />
                  <Toggle
                    label="En garantía"
                    value={reportForm.warranty}
                    onClick={() => handleToggleFlag("warranty")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
                  <Field label="Pendiente (Sí/No)">
                    <Toggle
                      label="Pendiente"
                      value={reportForm.pending}
                      onClick={() => handleToggleFlag("pending")}
                    />
                  </Field>

                  <Field label="Descripción pendiente">
                    <input
                      value={reportForm.pending_description}
                      onChange={(e) =>
                        handleReportFieldChange("pending_description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>

                  <Field label="Servicio previo cobrado (Sí/No)">
                    <Toggle
                      label="Servicio previo cobrado"
                      value={reportForm.previous_service_charged}
                      onClick={() => handleToggleFlag("previous_service_charged")}
                    />
                  </Field>

                  <Field label="Nombre representante">
                    <input
                      value={reportForm.representative_name}
                      onChange={(e) =>
                        handleReportFieldChange("representative_name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    />
                  </Field>
                </div>
              </div>
            )}
          </>
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
          <h3 className="font-bold text-lg text-gray-900 mb-2">Eliminar nota</h3>
          <p className="text-gray-600 mb-6">¿Estás seguro que deseas eliminar esta nota?</p>
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
          <p className="text-sm text-gray-600 mb-4">Pida al cliente que firme en el recuadro.</p>

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

    {/* Modal selector de materiales (Catálogo + Cables/Accesorios) */}
    {showMaterialPicker && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[65] p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold text-lg text-gray-900">Seleccionar material</h3>
            <button
              onClick={() => setShowMaterialPicker(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Buscar por referencia/nombre/descripción..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Catálogo */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Catálogo</h4>
              {catalogLoading ? (
                <p className="text-sm text-gray-500">Cargando catálogo...</p>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-sm text-gray-500">Sin resultados en catálogo.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCatalog.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectCatalogItem(p)}
                      className="border rounded-lg p-3 text-left hover:bg-gray-50 transition"
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.reference}
                            className="w-12 h-12 rounded object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 border" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{p.reference}</p>
                          <p className="text-xs text-gray-600 mt-1">{p.description}</p>
                        </div>
                        <div className="text-xs px-2 py-1 rounded bg-red-600 text-white">
                          Seleccionar
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cables y Accesorios */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Cables y Accesorios</h4>
              {cablesLoading ? (
                <p className="text-sm text-gray-500">Cargando cables/accesorios...</p>
              ) : filteredCables.length === 0 ? (
                <p className="text-sm text-gray-500">Sin resultados en cables/accesorios.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCables.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCableItem(c)}
                      className="border rounded-lg p-3 text-left hover:bg-gray-50 transition"
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-gray-100 border flex items-center justify-center text-[10px] text-gray-700">
                          CAB
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{c.description}</p>
                          <p className="text-xs text-gray-700 mt-2">
                            Medida: <span className="font-medium">{c.measurement_type}</span>
                          </p>
                        </div>
                        <div className="text-xs px-2 py-1 rounded bg-red-600 text-white">
                          Seleccionar
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
