"use client"

import { useState } from "react"
import { LoginPage } from "@/components/login-page"
import { AdminPortal } from "@/components/admin-portal"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <AdminPortal />
}
