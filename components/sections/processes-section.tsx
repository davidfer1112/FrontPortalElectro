"use client"

import { useState, useRef } from "react"
import { ChevronRight, AlertCircle, Plus, CheckCircle, X, Send, AlertOctagon, Package, CheckSquare, Truck, Zap, FileSignature, Edit2, Trash2, RotateCcw } from 'lucide-react'
import SignatureCanvas from "react-signature-canvas"

interface Process {
  id: number
  name: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  assigned_to: number
  created_by: number
  quote_id: number | null
  created_at: string
  updated_at: string
  current_stage: number
  client_signature: string | null
}

interface ProcessDetail extends Process {
  materials: Array<{
    id: number
    name: string
    quantity: number
  }>
  notes: Array<{
    id: number
    note: string
    created_by: string
    created_at: string
  }>
  alerts: Array<{
    id: number
    alert_type: string
    message: string
    status: "active" | "resolved"
    created_at: string
    resolved_at: string | null
  }>
  stage_progress: Array<{
    stage: number
    status: "pending" | "in_progress" | "completed"
    completed_at: string | null
  }>
}

const PROCESS_STAGES = [
  {
    id: 1,
    name: "Creación",
    description: "Administrador crea el proceso",
    icon: Plus,
    color: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    id: 2,
    name: "Alistamiento",
    description: "Almacén alista materiales",
    icon: Package,
    color: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
  },
  {
    id: 3,
    name: "Validación",
    description: "Coordinador de Tecnología revisa",
    icon: CheckSquare,
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    id: 4,
    name: "Verificación",
    description: "Técnico verifica completitud",
    icon: AlertCircle,
    color: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  {
    id: 5,
    name: "Transporte",
    description: "Traslado al sitio",
    icon: Truck,
    color: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
  },
  {
    id: 6,
    name: "Ejecución",
    description: "Instalación",
    icon: Zap,
    color: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  {
    id: 7,
    name: "Finalización",
    description: "Requiere firma del cliente",
    icon: FileSignature,
    color: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
]

const mockProcesses: Process[] = [
  {
    id: 1,
    name: "Instalación Sistema Alarma - Edificio A",
    status: "in_progress",
    assigned_to: 2,
    created_by: 1,
    quote_id: 1,
    created_at: "2025-11-10T08:00:00",
    updated_at: "2025-11-12T14:30:00",
    current_stage: 3,
    client_signature: null,
  },
  {
    id: 2,
    name: "Mantenimiento Preventivo - Sucursal B",
    status: "pending",
    assigned_to: 3,
    created_by: 1,
    quote_id: 2,
    created_at: "2025-11-11T10:00:00",
    updated_at: "2025-11-11T10:00:00",
    current_stage: 1,
    client_signature: null,
  },
  {
    id: 3,
    name: "Actualización Cámaras - Centro Comercial",
    status: "completed",
    assigned_to: 2,
    created_by: 1,
    quote_id: 3,
    created_at: "2025-11-05T09:00:00",
    updated_at: "2025-11-09T17:00:00",
    current_stage: 7,
    client_signature: "data:image/png;base64,iVBORw0KGgo...",
  },
]

const mockProcessDetails: Record<number, ProcessDetail> = {
  1: {
    ...mockProcesses[0],
    materials: [
      { id: 1, name: "Cámaras 1080p", quantity: 4 },
      { id: 2, name: "Cable Cat6 50m", quantity: 2 },
      { id: 3, name: "Conectores RJ45", quantity: 20 },
    ],
    notes: [
      {
        id: 1,
        note: "Instalación iniciada en sector norte del edificio",
        created_by: "Juan García",
        created_at: "2025-11-10T08:30:00",
      },
      {
        id: 2,
        note: "Se completó la instalación de sensores. Falta calibración.",
        created_by: "María López",
        created_at: "2025-11-11T16:45:00",
      },
      {
        id: 3,
        note: "Cliente solicita agregar 2 cámaras adicionales en entrada principal",
        created_by: "Carlos Rodríguez",
        created_at: "2025-11-12T10:15:00",
      },
    ],
    alerts: [
      {
        id: 1,
        alert_type: "warning",
        message: "Material faltante: Necesita 2 más de cable Cat6",
        status: "active",
        created_at: "2025-11-11T14:00:00",
        resolved_at: null,
      },
      {
        id: 2,
        alert_type: "info",
        message: "Cliente no estará disponible después de las 18:00",
        status: "active",
        created_at: "2025-11-12T09:30:00",
        resolved_at: null,
      },
    ],
    stage_progress: [
      { stage: 1, status: "completed", completed_at: "2025-11-10T08:00:00" },
      { stage: 2, status: "completed", completed_at: "2025-11-10T14:30:00" },
      { stage: 3, status: "in_progress", completed_at: null },
      { stage: 4, status: "pending", completed_at: null },
      { stage: 5, status: "pending", completed_at: null },
      { stage: 6, status: "pending", completed_at: null },
      { stage: 7, status: "pending", completed_at: null },
    ],
  },
}

function ProcessTimeline({ process }: { process: ProcessDetail }) {
  return (
    <div className="mb-8">
      <h3 className="font-semibold text-gray-900 mb-6">Flujo del Proceso</h3>
      <div className="relative">
        <div className="flex items-center justify-between">
          {PROCESS_STAGES.map((stage, index) => {
            const progress = process.stage_progress.find((p) => p.stage === stage.id)
            const isCompleted = progress?.status === "completed"
            const isActive = progress?.status === "in_progress"
            const StageIcon = stage.icon

            return (
              <div key={stage.id} className="flex flex-col items-center flex-1">
                {/* Línea conectora */}
                {index < PROCESS_STAGES.length - 1 && (
                  <div
                    className={`absolute top-10 left-[50%] w-[calc(100%-theme(spacing.10))] h-1 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                    style={{
                      left: `calc(50% + theme(spacing.5))`,
                      width: `calc(100% - theme(spacing.10))`,
                    }}
                  />
                )}

                {/* Círculo del estado */}
                <div
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-green-100 border-green-500"
                      : isActive
                        ? `${stage.color} border-2 border-red-500 animate-pulse`
                        : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <StageIcon
                    className={`w-8 h-8 ${
                      isCompleted ? "text-green-600" : isActive ? "text-red-600" : "text-gray-600"
                    }`}
                  />
                </div>

                {/* Información de etapa */}
                <div className="mt-4 text-center">
                  <p className="font-semibold text-gray-900 text-sm">{stage.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
                  {isCompleted && progress.completed_at && (
                    <p className="text-xs text-green-600 mt-2">
                      Completado: {new Date(progress.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProcessDetailModal({ process, onClose }: { process: ProcessDetail; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"timeline" | "materials" | "notes" | "alerts" | "firma">("timeline")
  const [newNote, setNewNote] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: process.name,
    status: process.status,
    assigned_to: process.assigned_to,
  })
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)
  const [clientSignature, setClientSignature] = useState<string | null>(process.client_signature)

  const handleAddNote = () => {
    if (newNote.trim()) {
      setToast({ message: "Nota agregada exitosamente", type: "success" })
      setNewNote("")
      setTimeout(() => setToast(null), 2000)
    }
  }

  const handleDeleteNote = (id: number) => {
    setToast({ message: "Nota eliminada", type: "success" })
    setShowDeleteConfirm(null)
    setTimeout(() => setToast(null), 2000)
  }

  const handleSignature = () => {
    if (signatureCanvasRef.current) {
      const signatureData = signatureCanvasRef.current.toDataURL("image/png")
      setClientSignature(signatureData)
      setToast({ message: "Firma del cliente registrada exitosamente", type: "success" })
      setShowSignaturePad(false)
      setTimeout(() => setToast(null), 2000)
    }
  }

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear()
    }
  }

  const handleSaveEdit = () => {
    console.log("[v0] Proceso editado:", editData)
    setToast({ message: "Proceso actualizado exitosamente", type: "success" })
    setIsEditing(false)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del Proceso</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Asignado a</label>
                    <input
                      type="number"
                      value={editData.assigned_to}
                      onChange={(e) => setEditData({ ...editData, assigned_to: Number.parseInt(e.target.value) })}
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
                  Etapa: <span className="font-semibold">{PROCESS_STAGES[process.current_stage - 1]?.name}</span>
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
          {["timeline", "materials", "notes", "alerts", "firma"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
              {tab === "firma" && "Firma Cliente"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "timeline" && <ProcessTimeline process={process} />}

          {activeTab === "materials" && (
            <div className="space-y-4">
              {process.materials.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Material</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {process.materials.map((material) => (
                        <tr key={material.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4 text-gray-900 font-medium">{material.name}</td>
                          <td className="py-4 px-4 text-gray-900">{material.quantity}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Disponible
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No hay materiales asignados</p>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {process.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{note.note}</p>
                        <p className="text-xs text-gray-600 mt-2">
                          {note.created_by} • {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddNote()}
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
              {process.alerts.length > 0 ? (
                process.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.status === "active" ? "bg-red-50 border-red-500" : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertOctagon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            alert.status === "active" ? "text-red-600" : "text-gray-600"
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{alert.alert_type}</p>
                          <p className="text-gray-700 text-sm mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-600 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          alert.status === "active" ? "bg-red-200 text-red-800" : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {alert.status === "active" ? "Activa" : "Resuelta"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No hay alertas</p>
              )}
            </div>
          )}

          {activeTab === "firma" && (
            <div className="space-y-6">
              {clientSignature ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <p className="font-semibold text-green-900">Firma del Cliente Registrada</p>
                    <p className="text-sm text-green-700 mt-2">{new Date(process.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                    <img src={clientSignature || "/placeholder.svg"} alt="Firma del cliente" className="max-h-48 mx-auto" />
                  </div>
                  <button
                    onClick={() => setClientSignature(null)}
                    className="w-full px-4 py-2 border border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50"
                  >
                    Reemplazar Firma
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="font-semibold text-yellow-900 mb-4">Requiere firma del cliente para finalizar</p>
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Agregar Firma
                  </button>
                </div>
              )}
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
              Editar Proceso
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Eliminar nota</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro que deseas eliminar esta nota?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteNote(showDeleteConfirm)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Firma del Cliente</h3>
            <p className="text-sm text-gray-600 mb-4">Firmar en el recuadro debajo</p>
            
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
                Confirmar Firma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-medium z-[70] animate-fade-in ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

function ProcessCard({ process, onClick }: { process: Process; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-red-500 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{process.name}</h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-gray-600">
              Etapa: {PROCESS_STAGES[process.current_stage - 1]?.name}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            ID: {process.id} • {new Date(process.created_at).toLocaleDateString()}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  )
}

export function ProcessesSection() {
  const [selectedProcess, setSelectedProcess] = useState<ProcessDetail | null>(null)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Procesos</h1>
        <p className="text-gray-600">Gestiona y supervisa todos los procesos de instalación</p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {["pending", "in_progress", "completed", "cancelled"].map((status) => {
            const count = mockProcesses.filter((p) => p.status === status).length
            const labels: Record<string, string> = {
              pending: "Pendientes",
              in_progress: "En Progreso",
              completed: "Completados",
              cancelled: "Cancelados",
            }
            return (
              <button
                key={status}
                className="px-4 py-2 rounded font-medium text-sm bg-gray-100 text-gray-900 hover:bg-gray-200"
              >
                {labels[status]} ({count})
              </button>
            )
          })}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Nuevo Proceso
        </button>
      </div>

      {/* Processes List */}
      <div className="grid gap-3">
        {mockProcesses.map((process) => (
          <ProcessCard
            key={process.id}
            process={process}
            onClick={() => {
              const details = mockProcessDetails[process.id]
              if (details) {
                setSelectedProcess(details)
              }
            }}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedProcess && <ProcessDetailModal process={selectedProcess} onClose={() => setSelectedProcess(null)} />}
    </div>
  )
}
