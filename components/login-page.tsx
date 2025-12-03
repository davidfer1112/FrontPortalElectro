"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

import { authService } from "@/services/authService"
import { useAuth } from "@/context/AuthContext"
import type { LoginRequest, LoginResponse } from "@/models/auth.model"

// === Toast local ===

type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type?: ToastType
}

function Toast({ message, type = "success" }: ToastProps) {
  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg text-white flex items-center gap-2 animate-fade-in
        ${
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

export default function LoginPage() {
  const router = useRouter()
  const { setSession } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      showToast("Por favor ingresa tu usuario y contraseña.", "error")
      return
    }

    try {
      setLoading(true)

      // Tipamos por si quieres más adelante usar LoginRequest/LoginResponse
      const res: LoginResponse = await authService.login({
        username,
        password,
      } as unknown as LoginRequest)

      // authService.login YA guarda token y user en localStorage.
      // Aquí actualizamos el contexto global para que la app sepa que hay sesión.
      const token = res.token ?? null
      const user = res.user ?? null

      setSession(token, user)

      if (!token || !user) {
        showToast("No se pudo iniciar sesión correctamente.", "error")
        return
      }

      showToast(
        `Bienvenido ${user.username || (user as any).email || username}`,
        "success",
      )

      // Redirige a tu ruta principal protegida
      router.push("/dashboard") // cámbialo por la ruta que uses realmente
    } catch (err: any) {
      console.error("Error en login:", err)

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Usuario o contraseña incorrectos."

      showToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border border-gray-200 shadow-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-full h-40 mb-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Imagen%20de%20WhatsApp%202025-11-11%20a%20las%2011.35.42_df105d22-hh6O0GlZ2YhvIh14ahQMiTo8Tf1wng.jpg"
              alt="Electroalarmas"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Usuario
            </label>
            <Input
              id="username"
              type="text"
              placeholder="electroalarmas2006@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-gray-300 bg-blue-50"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-gray-300 bg-blue-50"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Portal Administrativo Electroalarmas
        </p>
      </Card>

      {/* Toast local */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
