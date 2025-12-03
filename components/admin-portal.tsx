// src/components/admin-portal.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { CatalogSection } from "@/components/sections/catalog-section"
import { QuotesSection } from "@/components/sections/quotes-section"
import { ProcessesSection } from "@/components/sections/processes-section"
import { AdminActionsSection } from "@/components/sections/admin-actions-section"
import { useAuth } from "@/context/AuthContext"

export function AdminPortal() {
  const [activeSection, setActiveSection] = useState("catalog")
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  const renderSection = () => {
    switch (activeSection) {
      case "catalog":
        return <CatalogSection />
      case "quotes":
        return <QuotesSection />
      case "processes":
        return <ProcessesSection />
      case "admin":
        return <AdminActionsSection />
      default:
        return <CatalogSection />
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">{renderSection()}</main>
    </div>
  )
}
