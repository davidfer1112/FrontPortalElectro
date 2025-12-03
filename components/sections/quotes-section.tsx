"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Folder,
  File,
  Plus,
  ArrowLeft,
  Trash2,
  FolderPlus,
  Search,
  Grid3x3,
  List,
  AlertCircle,
  Download,
} from "lucide-react"

import { foldersService } from "@/services/foldersService"
import { quotesService } from "@/services/quotesService"
import { installationPointsService } from "@/services/installationPointsService"
import { quoteCatalogItemsService } from "@/services/quoteCatalogItemsService"
import { cablesAndAccessoriesService } from "@/services/cablesAndAccessoriesService"
import { catalogService } from "@/services/catalogService"
// Ajusta el nombre/ruta si tu servicio se llama distinto:
import { quoteCablesService } from "@/services/quoteCablesService"

import type { Folder as FolderModel } from "@/models/folder.model"
import type { Quote as QuoteModel } from "@/models/quote.model"
import type { InstallationPoint } from "@/models/installation-point.model"
import type { QuoteCable } from "@/models/quote-cable.model"
import type { QuoteCatalogItem } from "@/models/quote-catalog-item.model"
import type { CableOrAccessory } from "@/models/cables"
import type { CatalogProduct } from "@/models/catalog.model"

type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type?: ToastType
}

function Toast({ message, type = "success" }: ToastProps) {
  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg text-white flex items-center gap-2 animate-fade-in ${
        type === "success"
          ? "bg-green-500"
          : type === "error"
          ? "bg-red-600"
          : "bg-blue-500"
      }`}
    >
      {type === "success" && <span>✓</span>}
      {type === "error" && <AlertCircle size={18} />}
      <span className="text-sm">{message}</span>
    </div>
  )
}

type DeleteConfirm =
  | {
      id: number
      name: string
      type: "quote" | "cable" | "catalog" | "installation"
    }
  | null

export function QuotesSection() {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [openedQuoteId, setOpenedQuoteId] = useState<number | null>(null)

  // Carpetas
  const [allFolders, setAllFolders] = useState<FolderModel[]>([])
  const [folders, setFolders] = useState<FolderModel[]>([])
  const [quotes, setQuotes] = useState<QuoteModel[]>([])
  const [breadcrumb, setBreadcrumb] = useState<FolderModel[]>([])

  // Detalle de cotización (líneas reales)
  const [installationPoints, setInstallationPoints] = useState<InstallationPoint[]>([])
  const [quoteCables, setQuoteCables] = useState<QuoteCable[]>([])
  const [quoteCatalogItems, setQuoteCatalogItems] = useState<QuoteCatalogItem[]>([])

  // Catálogos auxiliares
  const [availableCables, setAvailableCables] = useState<CableOrAccessory[]>([])
  const [availableCatalogProducts, setAvailableCatalogProducts] = useState<CatalogProduct[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [newQuoteName, setNewQuoteName] = useState("")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [showNewQuoteDialog, setShowNewQuoteDialog] = useState(false)

  // Dialog agregar ítem
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [itemType, setItemType] = useState<"cable" | "catalog" | "installation">("cable")
  const [newItemName, setNewItemName] = useState("") // usado para instalación (type)
  const [newItemQuantity, setNewItemQuantity] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [selectedCableId, setSelectedCableId] = useState<string>("")
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("")

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ==========================================================
  // CARGA DE CARPETAS + COTIZACIONES DEL NIVEL
  // ==========================================================

  const loadLevel = useCallback(
    async (folderId: number | null) => {
      try {
        setLoading(true)
        setError(null)

        // 1) Obtener todas las carpetas
        const foldersRes = await foldersService.getAll()
        setAllFolders(foldersRes)

        // 2) Filtrar solo las hijas del nivel actual
        const levelFolders = foldersRes.filter((f) =>
          folderId === null ? f.parent_id === null : f.parent_id === folderId,
        )
        setFolders(levelFolders)

        // 3) Cotizaciones del nivel actual
        if (folderId !== null) {
          const quotesRes = await quotesService.getAll(folderId)
          setQuotes(quotesRes)
        } else {
          setQuotes([])
        }

        // 4) Breadcrumb
        const path: FolderModel[] = []
        let current = folderId
        while (current !== null) {
          const f = foldersRes.find((x) => x.id === current)
          if (!f) break
          path.unshift(f)
          current = f.parent_id
        }
        setBreadcrumb(path)
      } catch (err) {
        console.error("Error cargando nivel de carpetas/cotizaciones:", err)
        setError("No se pudo cargar la información. Intenta nuevamente.")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadLevel(currentFolderId)
  }, [currentFolderId, loadLevel])

  // ==========================================================
  // CARGA DE CATÁLOGOS (cables y productos) UNA VEZ
  // ==========================================================
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [cables, catalogProducts] = await Promise.all([
          cablesAndAccessoriesService.getAll(),
          catalogService.getAll(),
        ])
        setAvailableCables(cables)
        setAvailableCatalogProducts(catalogProducts)
      } catch (err) {
        console.error("Error cargando catálogos auxiliares:", err)
      }
    }

    loadCatalogs()
  }, [])

  // ==========================================================
  // CARGAR DETALLE DE UNA COTIZACIÓN
  // ==========================================================
  const loadQuoteDetails = useCallback(async (quoteId: number) => {
    try {
      const [points, cables, catalogItems] = await Promise.all([
        installationPointsService.getAll(quoteId),
        quoteCablesService.getAll(quoteId),
        quoteCatalogItemsService.getAll(quoteId),
      ])

      setInstallationPoints(points)
      setQuoteCables(cables)
      setQuoteCatalogItems(catalogItems)
    } catch (err) {
      console.error("Error cargando detalle de la cotización:", err)
      showToast("No se pudo cargar el detalle de la cotización", "error")
    }
  }, [])

  useEffect(() => {
    if (openedQuoteId) {
      loadQuoteDetails(openedQuoteId)
    } else {
      // si cerramos la cotización, limpiamos detalles
      setInstallationPoints([])
      setQuoteCables([])
      setQuoteCatalogItems([])
    }
  }, [openedQuoteId, loadQuoteDetails])

  // ==========================================================
  // CREAR CARPETA
  // ==========================================================
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const created = await foldersService.create({
        name: newFolderName.trim(),
        parent_id: currentFolderId ?? null,
      })

      const updatedAll = [...allFolders, created]
      setAllFolders(updatedAll)

      const levelFolders = updatedAll.filter((f) =>
        currentFolderId === null ? f.parent_id === null : f.parent_id === currentFolderId,
      )
      setFolders(levelFolders)

      showToast("Carpeta creada exitosamente", "success")
      setNewFolderName("")
      setShowNewFolderDialog(false)
    } catch (err) {
      console.error("Error creando carpeta:", err)
      showToast("No se pudo crear la carpeta", "error")
    }
  }

  // ==========================================================
  // CREAR COTIZACIÓN
  // ==========================================================
  const handleCreateQuote = async () => {
    if (!newQuoteName.trim()) return

    if (currentFolderId === null) {
      showToast("Debes estar dentro de una carpeta para crear una cotización.", "error")
      return
    }

    try {
      const created = await quotesService.create({
        name: newQuoteName.trim(),
        folder_id: currentFolderId,
      })
      setQuotes((prev) => [...prev, created])
      showToast("Cotización creada exitosamente", "success")
      setNewQuoteName("")
      setShowNewQuoteDialog(false)
    } catch (err) {
      console.error("Error creando cotización:", err)
      showToast("No se pudo crear la cotización", "error")
    }
  }

  // ==========================================================
  // FILTROS BUSCADOR
  // ==========================================================
  const filteredFolders = folders.filter(
    (f) => searchQuery === "" || f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredQuotes = quotes.filter(
    (q) => searchQuery === "" || q.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // ==========================================================
  // HELPERS DETALLE COTIZACIÓN
  // ==========================================================
  const selectedQuote = quotes.find((q) => q.id === openedQuoteId) || null

  const calculateSectionTotal = (numbers: number[]) =>
    numbers.reduce((sum, value) => sum + value, 0)

  const cableTotal = calculateSectionTotal(
    quoteCables.map((item) => item.quantity * Number(item.unit_price)),
  )

  const catalogTotal = calculateSectionTotal(
    quoteCatalogItems.map((item) => item.quantity * Number(item.catalog_price)),
  )

  const installationTotal = calculateSectionTotal(
    installationPoints.map((item) => item.quantity * Number(item.unit_price)),
  )

  const grandTotal = cableTotal + catalogTotal + installationTotal

  const getCableName = (line: QuoteCable) => {
    const cable = availableCables.find((c) => c.id === line.cable_accessory_id)
    return cable ? cable.name : `Cable #${line.cable_accessory_id}`
  }

  const handleExportToExcel = () => {
    console.log("[mock] Exportando a Excel...")
    showToast("Funcionalidad de exportar a Excel en desarrollo", "info")
  }

  // ==========================================================
  // AGREGAR ÍTEM (instalación, cable, catálogo)
  // ==========================================================
  const resetItemDialogState = () => {
    setNewItemName("")
    setNewItemQuantity("")
    setNewItemPrice("")
    setSelectedCableId("")
    setSelectedCatalogId("")
  }

  const handleAddItem = async () => {
    if (!openedQuoteId) return

    try {
      if (!newItemQuantity) {
        showToast("Debes ingresar una cantidad", "error")
        return
      }

      const quantity = Number(newItemQuantity)
      if (Number.isNaN(quantity) || quantity <= 0) {
        showToast("Cantidad inválida", "error")
        return
      }

      if (itemType === "installation") {
        if (!newItemName.trim() || !newItemPrice) {
          showToast("Completa tipo y precio", "error")
          return
        }

        const created = await installationPointsService.create({
          quote_id: openedQuoteId,
          type: newItemName.trim(),
          quantity,
          unit_price: newItemPrice,
        })

        setInstallationPoints((prev) => [...prev, created])
        showToast("Punto de instalación agregado", "success")
      } else if (itemType === "cable") {
        if (!selectedCableId) {
          showToast("Selecciona un cable/accesorio", "error")
          return
        }

        const cable = availableCables.find((c) => c.id === Number(selectedCableId))
        const unitPrice = newItemPrice || cable?.price || "0"

        const created = await quoteCablesService.create({
          quote_id: openedQuoteId,
          cable_accessory_id: Number(selectedCableId),
          quantity,
          unit_price: unitPrice,
        })

        setQuoteCables((prev) => [...prev, created])
        showToast("Cable/Accesorio agregado a la cotización", "success")
      } else if (itemType === "catalog") {
        if (!selectedCatalogId) {
          showToast("Selecciona un producto del catálogo", "error")
          return
        }

        const created = await quoteCatalogItemsService.create({
          quote_id: openedQuoteId,
          catalog_id: Number(selectedCatalogId),
          quantity,
        })

        setQuoteCatalogItems((prev) => [...prev, created])
        showToast("Item de catálogo agregado a la cotización", "success")
      }

      resetItemDialogState()
      setShowAddItemDialog(false)
    } catch (err) {
      console.error("Error agregando ítem:", err)
      showToast("No se pudo agregar el ítem", "error")
    }
  }

  // precio por defecto al seleccionar cable
  useEffect(() => {
    if (itemType === "cable" && selectedCableId) {
      const cable = availableCables.find((c) => c.id === Number(selectedCableId))
      if (cable) {
        setNewItemPrice(cable.price)
      }
    }
  }, [itemType, selectedCableId, availableCables])

  // ==========================================================
  // ELIMINAR (cotización o línea)
  // ==========================================================
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      if (deleteConfirm.type === "quote") {
        await quotesService.remove(deleteConfirm.id)
        setQuotes((prev) => prev.filter((q) => q.id !== deleteConfirm.id))
        if (openedQuoteId === deleteConfirm.id) setOpenedQuoteId(null)
      } else if (deleteConfirm.type === "cable") {
        await quoteCablesService.remove(deleteConfirm.id)
        setQuoteCables((prev) => prev.filter((c) => c.id !== deleteConfirm.id))
      } else if (deleteConfirm.type === "catalog") {
        await quoteCatalogItemsService.remove(deleteConfirm.id)
        setQuoteCatalogItems((prev) => prev.filter((c) => c.id !== deleteConfirm.id))
      } else if (deleteConfirm.type === "installation") {
        await installationPointsService.remove(deleteConfirm.id)
        setInstallationPoints((prev) => prev.filter((p) => p.id !== deleteConfirm.id))
      }

      const label =
        deleteConfirm.type === "quote"
          ? "Cotización"
          : deleteConfirm.type === "cable"
          ? "Cable/Accesorio"
          : deleteConfirm.type === "catalog"
          ? "Item de Catálogo"
          : "Punto de Instalación"

      showToast(`${label} eliminado exitosamente`, "success")
    } catch (err) {
      console.error("Error eliminando:", err)
      showToast("No se pudo eliminar el elemento", "error")
    } finally {
      setDeleteConfirm(null)
    }
  }

  // ==========================================================
  // VISTA DETALLE COTIZACIÓN
  // ==========================================================
  if (openedQuoteId && selectedQuote) {
    return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenedQuoteId(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Volver</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedQuote.name}</h1>
          </div>
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            <Download size={18} />
            Exportar Excel
          </button>
        </div>

        {/* Info */}
        <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <p>
            Creado: {selectedQuote.created_at} | Actualizado: {selectedQuote.updated_at}
          </p>
        </div>

        {/* Cables y Accesorios */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cables y Accesorios</h3>
            <Button
              onClick={() => {
                setItemType("cable")
                resetItemDialogState()
                setShowAddItemDialog(true)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Agregar Item
            </Button>
          </div>

          {quoteCables.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Producto
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Cantidad
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Precio Unit.
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Subtotal
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quoteCables.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4 text-gray-900">{getCableName(item)}</td>
                      <td className="py-3 px-4 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {(item.quantity * Number(item.unit_price)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: item.id,
                              name: getCableName(item),
                              type: "cable",
                            })
                          }
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Subtotal:{" "}
                  <span className="text-gray-900 font-bold">
                    ${cableTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              Sin items agregados
            </p>
          )}
        </div>

        {/* Items de catálogo */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items de Catálogo</h3>
            <Button
              onClick={() => {
                setItemType("catalog")
                resetItemDialogState()
                setShowAddItemDialog(true)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Agregar Item
            </Button>
          </div>

          {quoteCatalogItems.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Referencia
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Descripción
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Cantidad
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Precio Unit. cat.
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Subtotal
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quoteCatalogItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4 text-gray-900">{item.reference}</td>
                      <td className="py-3 px-4 text-gray-700">{item.description}</td>
                      <td className="py-3 px-4 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${Number(item.catalog_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {(item.quantity * Number(item.catalog_price)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: item.id,
                              name: item.reference,
                              type: "catalog",
                            })
                          }
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Subtotal:{" "}
                  <span className="text-gray-900 font-bold">
                    ${catalogTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              Sin items agregados
            </p>
          )}
        </div>

        {/* Puntos de instalación */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Puntos de Instalación</h3>
            <Button
              onClick={() => {
                setItemType("installation")
                resetItemDialogState()
                setShowAddItemDialog(true)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Agregar Punto
            </Button>
          </div>

          {installationPoints.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tipo</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Cantidad
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Precio Unit.
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Subtotal
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {installationPoints.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4 text-gray-900">{item.type}</td>
                      <td className="py-3 px-4 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {(item.quantity * Number(item.unit_price)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: item.id,
                              name: item.type,
                              type: "installation",
                            })
                          }
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Subtotal:{" "}
                  <span className="text-gray-900 font-bold">
                    ${installationTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              Sin puntos de instalación
            </p>
          )}
        </div>

        {/* Totales */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky bottom-0">
          <div className="flex justify-end max-w-md ml-auto">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Cables y Accesorios:</span>
                <span>${cableTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Items de Catálogo:</span>
                <span>${catalogTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 border-b border-gray-300 pb-3">
                <span>Puntos de Instalación:</span>
                <span>${installationTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total General:</span>
                <span className="text-red-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog delete detalle */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                Confirmar eliminación
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">
                ¿Estás seguro que deseas eliminar{" "}
                <span className="font-semibold">"{deleteConfirm?.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog agregar ítem */}
        <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Agregar{" "}
                {itemType === "cable"
                  ? "Cable/Accesorio"
                  : itemType === "catalog"
                  ? "Item de Catálogo"
                  : "Punto de Instalación"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {itemType === "installation" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tipo / Descripción
                  </label>
                  <Input
                    placeholder="Ej: Punto de vigilancia exterior"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {itemType === "cable" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Cable / Accesorio
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={selectedCableId}
                    onChange={(e) => setSelectedCableId(e.target.value)}
                  >
                    <option value="">Selecciona un cable o accesorio</option>
                    {availableCables.map((cable) => (
                      <option key={cable.id} value={cable.id}>
                        {cable.name} — ${Number(cable.price).toFixed(2)} / {cable.measurement_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {itemType === "catalog" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Producto de catálogo
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={selectedCatalogId}
                    onChange={(e) => setSelectedCatalogId(e.target.value)}
                  >
                    <option value="">Selecciona un producto</option>
                    {availableCatalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.reference} — {p.description} — $
                        {Number(p.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Cantidad
                </label>
                <Input
                  type="number"
                  placeholder="Ej: 5"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                />
              </div>

              {(itemType === "installation" || itemType === "cable") && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Precio Unitario
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 25000"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddItemDialog(false)
                  resetItemDialogState()
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddItem} className="bg-red-600 hover:bg-red-700">
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    )
  }

  // ==========================================================
  // VISTA CARPETAS + COTIZACIONES
  // ==========================================================
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cotizaciones</h1>
        <p className="text-gray-600">Gestiona y visualiza todas tus cotizaciones</p>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}{" "}
            <button onClick={() => loadLevel(currentFolderId)} className="underline">
              Reintentar
            </button>
          </p>
        )}
      </div>

      {/* Breadcrumb */}
      {currentFolderId && breadcrumb.length > 0 && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 hover:text-gray-900 transition"
          >
            <ArrowLeft size={16} />
            Raíz
          </button>
          {breadcrumb.map((folder) => (
            <div key={folder.id} className="flex items-center gap-2">
              <span>/</span>
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className="hover:text-gray-900 transition"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="mb-8 flex gap-3">
        <Button
          onClick={() => setShowNewFolderDialog(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <FolderPlus size={18} className="mr-2" />
          Nueva Carpeta
        </Button>
        <Button
          onClick={() => setShowNewQuoteDialog(true)}
          className="bg-red-600 hover:bg-red-700"
          disabled={currentFolderId === null}
          title={
            currentFolderId === null
              ? "Debes entrar a una carpeta para crear cotizaciones"
              : ""
          }
        >
          <Plus size={18} className="mr-2" />
          Nueva Cotización
        </Button>

        <div className="ml-auto flex gap-2 border-l border-gray-200 pl-4">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded transition ${
              viewMode === "grid"
                ? "bg-red-100 text-red-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition ${
              viewMode === "list"
                ? "bg-red-100 text-red-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-8 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <Input
          placeholder="Buscar carpetas o cotizaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          {/* Carpetas */}
          {filteredFolders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Carpetas</h2>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 hover:shadow-md transition text-left group"
                    >
                      <Folder
                        size={32}
                        className="text-amber-500 mb-3 group-hover:scale-110 transition"
                      />
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {folder.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition text-left flex items-center gap-3"
                    >
                      <Folder size={20} className="text-amber-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cotizaciones */}
          {filteredQuotes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotizaciones</h2>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="p-6 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition group cursor-pointer"
                    >
                      <div onClick={() => setOpenedQuoteId(quote.id)} className="mb-4">
                        <File
                          size={32}
                          className="text-blue-500 mb-3 group-hover:scale-110 transition"
                        />
                        <p className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition">
                          {quote.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {quote.created_at}
                        </p>
                      </div>
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: quote.id,
                              name: quote.name,
                              type: "quote",
                            })
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition group"
                    >
                      <button
                        onClick={() => setOpenedQuoteId(quote.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <File size={20} className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-red-600 transition truncate">
                            {quote.name}
                          </p>
                          <p className="text-xs text-gray-500">{quote.created_at}</p>
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            id: quote.id,
                            name: quote.name,
                            type: "quote",
                          })
                        }
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredFolders.length === 0 && filteredQuotes.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Folder size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchQuery ? "No se encontraron resultados" : "Esta carpeta está vacía"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery
                  ? "Intenta con otros términos de búsqueda"
                  : "Crea una nueva carpeta o cotización para comenzar"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Dialog Nueva Carpeta */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Carpeta</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre de la carpeta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} className="bg-red-600 hover:bg-red-700">
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Cotización */}
      <Dialog open={showNewQuoteDialog} onOpenChange={setShowNewQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Cotización</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre de la cotización"
            value={newQuoteName}
            onChange={(e) => setNewQuoteName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateQuote()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewQuoteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateQuote} className="bg-red-600 hover:bg-red-700">
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog delete lista */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              ¿Estás seguro que deseas eliminar{" "}
              <span className="font-semibold">"{deleteConfirm?.name}"</span>?
            </p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
