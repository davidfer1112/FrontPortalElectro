"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Folder, File, Plus, ArrowLeft, Trash2, FolderPlus, Search, Grid3x3, List, AlertCircle, Download } from 'lucide-react'

function Toast({ message, type = "success" }) {
  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg text-white flex items-center gap-2 animate-fade-in ${
        type === "success" ? "bg-green-500" : type === "error" ? "bg-red-600" : "bg-blue-500"
      }`}
    >
      {type === "success" && <span>✓</span>}
      {type === "error" && <AlertCircle size={18} />}
      {message}
    </div>
  )
}

// Mock data - en producción vendría de una API
const initialFolders = [
  { id: 1, name: "Cotizaciones 2025", parent_id: null },
  { id: 2, name: "Clientes", parent_id: null },
]

const initialQuotes = [
  {
    id: 1,
    folder_id: 1,
    name: "Cotización #001 - Cliente ABC",
    created_at: "2025-11-07",
    updated_at: "2025-11-07",
  },
  {
    id: 2,
    folder_id: 1,
    name: "Cotización #002 - Empresa XYZ",
    created_at: "2025-11-06",
    updated_at: "2025-11-07",
  },
]

const quoteDetails = {
  1: {
    cables_accessories: [
      { id: 1, name: "Cable Ethernet Cat6 - 10m", quantity: 2, unit_price: 25.5 },
      { id: 2, name: "Conector RJ45", quantity: 10, unit_price: 2.0 },
    ],
    catalog_items: [{ id: 3, name: "Cámara IP 1080p", quantity: 2, unit_price: 159.99 }],
    installation_points: [
      { id: 4, type: "Punto de Vigilancia Interior", quantity: 2, unit_price: 50.0 },
      { id: 5, type: "Punto de Vigilancia Exterior", quantity: 1, unit_price: 75.0 },
    ],
  },
  2: {
    cables_accessories: [{ id: 6, name: "Cable Coaxial - 50m", quantity: 1, unit_price: 45.0 }],
    catalog_items: [
      { id: 7, name: "NVR Grabador 8 canales", quantity: 1, unit_price: 799.99 },
      { id: 8, name: "Disco Duro 2TB", quantity: 2, unit_price: 85.0 },
    ],
    installation_points: [{ id: 9, type: "Punto de Vigilancia Interior", quantity: 8, unit_price: 50.0 }],
  },
}

export function QuotesSection() {
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [openedQuoteId, setOpenedQuoteId] = useState(null) // Renamed from selectedQuoteId
  const [folders] = useState(initialFolders)
  const [quotes] = useState(initialQuotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [newQuoteName, setNewQuoteName] = useState("")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [showNewQuoteDialog, setShowNewQuoteDialog] = useState(false)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [itemType, setItemType] = useState("cable")
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [viewMode, setViewMode] = useState("grid") // grid o list
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Obtener carpetas y cotizaciones del nivel actual
  const currentLevelFolders = folders.filter((f) => f.parent_id === currentFolderId)
  const currentLevelQuotes = quotes.filter((q) => q.folder_id === currentFolderId)

  // Obtener ruta de navegación (breadcrumb)
  const getBreadcrumb = () => {
    const path = []
    let current = currentFolderId
    while (current !== null) {
      const folder = folders.find((f) => f.id === current)
      if (folder) {
        path.unshift(folder)
        current = folder.parent_id
      } else {
        break
      }
    }
    return path
  }

  const breadcrumb = getBreadcrumb()

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // En producción: hacer POST a API
      console.log("[v0] Nueva carpeta:", { name: newFolderName, parent_id: currentFolderId })
      showToast("Carpeta creada exitosamente", "success") //
      setNewFolderName("")
      setShowNewFolderDialog(false)
    }
  }

  const handleCreateQuote = () => {
    if (newQuoteName.trim()) {
      // En producción: hacer POST a API
      console.log("[v0] Nueva cotización:", { name: newQuoteName, folder_id: currentFolderId })
      showToast("Cotización creada exitosamente", "success") //
      setNewQuoteName("")
      setShowNewQuoteDialog(false)
    }
  }

  const filteredQuotes = quotes.filter(
    (q) =>
      q.folder_id === currentFolderId &&
      (q.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === ""),
  )

  // Filtrar carpetas por búsqueda
  const filteredFolders = currentLevelFolders.filter(
    (f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "",
  )

  const selectedQuote = quotes.find((q) => q.id === openedQuoteId) // Renamed from selectedQuoteId
  const quoteItemsData = openedQuoteId // Renamed from selectedQuoteId
    ? quoteDetails[openedQuoteId] || { cables_accessories: [], catalog_items: [], installation_points: [] }
    : { cables_accessories: [], catalog_items: [], installation_points: [] }

  const handleAddItem = () => {
    if (newItemName.trim() && newItemQuantity && newItemPrice) {
      console.log("[v0] Nuevo item:", {
        type: itemType,
        name: newItemName,
        quantity: Number.parseInt(newItemQuantity),
        unit_price: Number.parseFloat(newItemPrice),
      })
      showToast("Item agregado exitosamente", "success") //
      setNewItemName("")
      setNewItemQuantity("")
      setNewItemPrice("")
      setShowAddItemDialog(false)
    }
  }

  const calculateSectionTotal = (items) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const cableTotal = calculateSectionTotal(quoteItemsData.cables_accessories)
  const catalogTotal = calculateSectionTotal(quoteItemsData.catalog_items)
  const installationTotal = calculateSectionTotal(quoteItemsData.installation_points)
  const grandTotal = cableTotal + catalogTotal + installationTotal

  const handleExportToExcel = () => {
    console.log("[v0] Exportando a Excel...")
    showToast("Funcionalidad de exportar a Excel en desarrollo", "success")
  }

  if (openedQuoteId) {
    return (
      <div className="p-8">
        {/* Header con botón atrás y exportar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenedQuoteId(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Volver</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedQuote?.name}</h1>
          </div>
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            <Download size={18} />
            Exportar Excel
          </button>
        </div>

        {/* Información de la cotización */}
        <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <p>
            Creado: {selectedQuote?.created_at} | Actualizado: {selectedQuote?.updated_at}
          </p>
        </div>

        {/*Tabla de Cables y Accesorios */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cables y Accesorios</h3>
            <Button
              onClick={() => {
                setItemType("cable")
                setShowAddItemDialog(true)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Agregar Item
            </Button>
          </div>
          {quoteItemsData.cables_accessories.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Producto</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Precio Unit.</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Subtotal</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItemsData.cables_accessories.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: item.id,
                              name: item.name,
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
                  Subtotal: <span className="text-gray-900 font-bold">${cableTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Sin items agregados</p>
          )}
        </div>

        {/*Tabla de Items de Catálogo */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items de Catálogo</h3>
            <Button
              onClick={() => {
                setItemType("catalog")
                setShowAddItemDialog(true)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Agregar Item
            </Button>
          </div>
          {quoteItemsData.catalog_items.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Producto</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Precio Unit.</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Subtotal</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItemsData.catalog_items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: item.id,
                              name: item.name,
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
                  Subtotal: <span className="text-gray-900 font-bold">${catalogTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Sin items agregados</p>
          )}
        </div>

        {/*Tabla de Puntos de Instalación */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Puntos de Instalación</h3>
            <Button
              onClick={() => {
                setItemType("installation")
                setShowAddItemDialog(true)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Agregar Item
            </Button>
          </div>
          {quoteItemsData.installation_points.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tipo</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Precio Unit.</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Subtotal</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItemsData.installation_points.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-900">{item.type}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ${(item.quantity * item.unit_price).toFixed(2)}
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
                  Subtotal: <span className="text-gray-900 font-bold">${installationTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Sin items agregados</p>
          )}
        </div>

        {/* Resumen de Totales */}
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
                ¿Estás seguro que deseas eliminar <span className="font-semibold">"{deleteConfirm?.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  console.log("[v0] Eliminar:", deleteConfirm)
                  showToast(
                    `${deleteConfirm?.type === "quote" ? "Cotización" : deleteConfirm?.type === "cable" ? "Cable/Accesorio" : deleteConfirm?.type === "catalog" ? "Item de Catálogo" : "Punto de Instalación"} eliminado exitosamente`,
                    "success",
                  )
                  setDeleteConfirm(null)
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Agregar Item */}
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
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre/Descripción</label>
                <Input
                  placeholder="Ej: Cable Ethernet 10m"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cantidad</label>
                <Input
                  type="number"
                  placeholder="Ej: 5"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Precio Unitario</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 25.50"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddItem} className="bg-red-600 hover:bg-red-700">
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cotizaciones</h1>
        <p className="text-gray-600">Gestiona y visualiza todas tus cotizaciones</p>
      </div>

      {/* Breadcrumb */}
      {currentFolderId && (
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
              <button onClick={() => setCurrentFolderId(folder.id)} className="hover:text-gray-900 transition">
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8 flex gap-3">
        <Button onClick={() => setShowNewFolderDialog(true)} className="bg-red-600 hover:bg-red-700">
          <FolderPlus size={18} className="mr-2" />
          Nueva Carpeta
        </Button>
        <Button onClick={() => setShowNewQuoteDialog(true)} className="bg-red-600 hover:bg-red-700">
          <Plus size={18} className="mr-2" />
          Nueva Cotización
        </Button>

        <div className="ml-auto flex gap-2 border-l border-gray-200 pl-4">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded transition ${viewMode === "grid" ? "bg-red-100 text-red-600" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition ${viewMode === "list" ? "bg-red-100 text-red-600" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Buscador Global */}
      <div className="mb-8 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Buscar carpetas o cotizaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contenido - Carpetas */}
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
                  <Folder size={32} className="text-amber-500 mb-3 group-hover:scale-110 transition" />
                  <p className="font-medium text-gray-900 line-clamp-2">{folder.name}</p>
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

      {/* Contenido - Cotizaciones */}
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
                    <File size={32} className="text-blue-500 mb-3 group-hover:scale-110 transition" />
                    <p className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition">
                      {quote.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{quote.created_at}</p>
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

      {/* Empty State */}
      {filteredFolders.length === 0 && filteredQuotes.length === 0 && (
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

      {/* Dialog: Nueva Carpeta */}
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

      {/* Dialog: Nueva Cotización */}
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

      {/* Dialog: Agregar Item */}
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
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre/Descripción</label>
              <Input
                placeholder="Ej: Cable Ethernet 10m"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Cantidad</label>
              <Input
                type="number"
                placeholder="Ej: 5"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Precio Unitario</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 25.50"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} className="bg-red-600 hover:bg-red-700">
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              ¿Estás seguro que deseas eliminar <span className="font-semibold">"{deleteConfirm?.name}"</span>?
            </p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] Eliminar:", deleteConfirm)
                showToast(
                  `${deleteConfirm?.type === "quote" ? "Cotización" : deleteConfirm?.type === "cable" ? "Cable/Accesorio" : deleteConfirm?.type === "catalog" ? "Item de Catálogo" : "Punto de Instalación"} eliminado exitosamente`,
                  "success",
                )
                setDeleteConfirm(null)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
