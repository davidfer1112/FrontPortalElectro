// ProcessesSection.tsx
"use client"

import { useEffect, useState } from "react"
import { ChevronRight, AlertCircle, Plus } from "lucide-react"

import type { Process } from "@/models/process.model"
import {
  ProcessDetailModal,
  PROCESS_STAGES,
  mapStatusToStage,
  type ProcessWithStage,
  type ProcessDetail,
} from "../ProcessDetailModal"

import { processesService } from "@/services/processesService"
import { processMaterialsService } from "@/services/processMaterialsService"
import { processNotesService } from "@/services/processNotesService"
import { processAlertsService } from "@/services/processAlertsService"
import { serviceReportsService } from "@/services/serviceReportsService"

// Toast local para la sección
type ToastType = "success" | "error" | "info"
interface ToastState {
  message: string
  type: ToastType
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
      const mapped: ProcessWithStage[] = apiProcesses.map((p: Process) => ({
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
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
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

      {/* Toolbar totales por etapa */}
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
