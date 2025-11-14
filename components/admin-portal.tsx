"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { CatalogSection } from "@/components/sections/catalog-section"
import { QuotesSection } from "@/components/sections/quotes-section"
import { ProcessesSection } from "@/components/sections/processes-section"
import { AdminActionsSection } from "@/components/sections/admin-actions-section"
import { LoginPage } from "@/components/login-page"

export function AdminPortal() {
  const [activeSection, setActiveSection] = useState("catalog")
  const [isAuthenticated, setIsAuthenticated] = useState(true)

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

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={() => setIsAuthenticated(false)} />
      <main className="flex-1 overflow-auto">{renderSection()}</main>
    </div>
  )
}
