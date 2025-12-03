"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { authService } from "@/services/authService"
import type { AuthUser } from "@/models/auth.model"

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setSession: (token: string | null, user: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehidratar sesión en el cliente al cargar la app
  useEffect(() => {
    if (typeof window === "undefined") return

    const storedToken = authService.getToken()
    const storedUser = authService.getUser()

    if (storedToken) setToken(storedToken)
    if (storedUser) setUser(storedUser)

    setIsLoading(false)
  }, [])

  // Solo actualiza el estado de React (el storage lo maneja authService.login / logout)
  const setSession = (newToken: string | null, newUser: AuthUser | null) => {
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    authService.logout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return ctx
}
