"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, Filter, X } from 'lucide-react'
import Image from "next/image"

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    reference: "VZ - S6/ ID",
    description: "Cámara interior 1080p",
    image_url: "/camera-1080p.jpg",
    price: "159.99",
  },
  {
    id: 2,
    reference: "VZ - S8/ HD",
    description: "Cámara exterior 2MP",
    image_url: "/camera-2mp.jpg",
    price: "249.99",
  },
  {
    id: 3,
    reference: "VZ - NVR4",
    description: "Grabador NVR 4 canales",
    image_url: "/nvr-recorder.jpg",
    price: "399.99",
  },
  {
    id: 4,
    reference: "VZ - ALARM",
    description: "Sistema alarma inalámbrico",
    image_url: "/wireless-alarm.jpg",
    price: "189.99",
  },
  {
    id: 5,
    reference: "VZ - SENSOR",
    description: "Sensor de movimiento PIR",
    image_url: "/motion-sensor.jpg",
    price: "79.99",
  },
  {
    id: 6,
    reference: "VZ - CTRL",
    description: "Panel de control remoto",
    image_url: "/control-panel.jpg",
    price: "129.99",
  },
]

export function CatalogSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })

  const filteredProducts = useMemo(() => {
    return SAMPLE_PRODUCTS.filter((product) => {
      const matchesSearch =
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.reference.toLowerCase().includes(searchTerm.toLowerCase())

      const price = Number.parseFloat(product.price)
      const matchesPrice = price >= priceRange.min && price <= priceRange.max

      return matchesSearch && matchesPrice
    })
  }, [searchTerm, priceRange])

  const handleClearFilters = () => {
    setSearchTerm("")
    setPriceRange({ min: 0, max: 1000 })
  }

  const hasActiveFilters = searchTerm !== "" || priceRange.min !== 0 || priceRange.max !== 1000

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
        <p className="text-gray-600">Gestiona y visualiza todos los productos disponibles</p>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Precio Mínimo</label>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <Input
                type="number"
                placeholder="0"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number.parseFloat(e.target.value) || 0 })}
                className="border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Precio Máximo</label>
            <Input
              type="number"
              placeholder="1000"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: Number.parseFloat(e.target.value) || 1000 })}
              className="border-gray-300"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
            >
              <X size={16} />
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
              <div className="relative w-full h-40 bg-gray-100">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.description}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">{product.reference}</p>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{product.description}</h3>
                <span className="text-lg font-bold text-red-700">${product.price}</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No hay productos que coincidan con tu búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}
