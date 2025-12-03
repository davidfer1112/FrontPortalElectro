"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"
import Image from "next/image"

// Ajusta estas rutas según tu estructura de proyecto
import { catalogService } from "@/services/catalogService"
import type { CatalogProduct } from "@/models/catalog.model"

export function CatalogSection() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await catalogService.getAll()
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar el catálogo. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.toLowerCase().trim()

      const matchesSearch =
        search === "" ||
        product.description.toLowerCase().includes(search) ||
        product.reference.toLowerCase().includes(search)

      const priceNumber = Number.parseFloat(product.price || "0")
      const matchesPrice =
        !Number.isNaN(priceNumber) &&
        priceNumber >= priceRange.min &&
        priceNumber <= priceRange.max

      return matchesSearch && matchesPrice
    })
  }, [products, searchTerm, priceRange])

  const handleClearFilters = () => {
    setSearchTerm("")
    setPriceRange({ min: 0, max: 1000 })
  }

  const hasActiveFilters =
    searchTerm !== "" || priceRange.min !== 0 || priceRange.max !== 1000

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
          <p className="text-gray-600">
            Gestiona y visualiza todos los productos disponibles
          </p>
        </div>

        {/* Estado rápido de carga / error */}
        <div className="text-sm">
          {isLoading && <span className="text-gray-500">Cargando productos...</span>}
          {error && <span className="text-red-600">{error}</span>}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                placeholder="Buscar por descripción o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Mínimo
            </label>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <Input
                type="number"
                placeholder="0"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange({
                    ...priceRange,
                    min: Number.parseFloat(e.target.value) || 0,
                  })
                }
                className="border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Máximo
            </label>
            <Input
              type="number"
              placeholder="1000"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({
                  ...priceRange,
                  max: Number.parseFloat(e.target.value) || 1000,
                })
              }
              className="border-gray-300"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
            >
              <X size={16} />
              Limpiar Filtros
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={loadProducts}
            disabled={isLoading}
            className="ml-auto"
          >
            {isLoading ? "Actualizando..." : "Actualizar catálogo"}
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Cargando productos...</p>
          </div>
        )}

        {!isLoading && error && products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadProducts}>Reintentar</Button>
          </div>
        )}

        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No hay productos que coincidan con tu búsqueda</p>
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-40 bg-gray-100">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.description}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  {product.reference}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {product.description}
                </h3>
                <span className="text-lg font-bold text-red-700">
                  ${product.price}
                </span>
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
}
