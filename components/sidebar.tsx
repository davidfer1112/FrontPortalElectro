"use client"

import Image from "next/image"
import { Package, FileText, Settings, Zap, LogOut } from 'lucide-react'
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout?: () => void
}

export function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const menuItems = [
    { id: "catalog", label: "Catálogo", icon: Package },
    { id: "quotes", label: "Cotizaciones", icon: FileText },
    { id: "processes", label: "Procesos", icon: Zap },
    { id: "admin", label: "Acciones Admin", icon: Settings },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative h-28">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Imagen%20de%20WhatsApp%202025-11-11%20a%20las%2011.35.42_df105d22-hh6O0GlZ2YhvIh14ahQMiTo8Tf1wng.jpg"
              alt="Electroalarmas Icon"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-xs text-gray-600 text-center mt-3 font-medium">Portal Administrativo</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                  isActive ? "bg-red-700 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="text-sm flex-1">
              <p className="font-medium text-gray-900">Administrador</p>
              <p className="text-xs text-gray-500">admin@electroalarmas.com</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Logout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">¿Estás seguro de que deseas cerrar sesión?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
