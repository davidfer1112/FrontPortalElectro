"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Edit2, Trash2 } from "lucide-react"

import { usersService } from "@/services/usersService"
import { rolesService } from "@/services/rolesService"
import type { User as UserModel, CreateUserDTO, UpdateUserDTO } from "@/models/user.model"
import type { Role } from "@/models/role.model"

type UserFormData = {
  username: string
  email: string
  role_id: number
  password: string
}

export function AdminActionsSection() {
  const [users, setUsers] = useState<UserModel[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    role_id: 0,
    password: "",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // ---------- Cargar usuarios y roles del backend ----------

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [rolesRes, usersRes] = await Promise.all([
        rolesService.getAll(),
        usersService.getAll(),
      ])

      setRoles(rolesRes)
      setUsers(usersRes)

      // Si no hay rol seleccionado, dejar el primero de la lista
      const defaultRoleId = rolesRes[0]?.id ?? 0
      setFormData((prev) => ({
        ...prev,
        role_id: defaultRoleId,
      }))
    } catch (err) {
      console.error("Error cargando usuarios/roles:", err)
      setError("No se pudieron cargar usuarios y roles. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------- Helpers ----------

  const resetForm = () => {
    const defaultRoleId = roles[0]?.id ?? 0
    setFormData({
      username: "",
      email: "",
      role_id: defaultRoleId,
      password: "",
    })
    setEditingId(null)
    setShowForm(false)
    setFormError(null)
  }

  const getRoleName = (roleId: number) =>
    roles.find((r) => r.id === roleId)?.name || "Desconocido"

  // ---------- Crear / actualizar usuario ----------

  const handleSaveUser = async () => {
    setFormError(null)

    if (!formData.username.trim() || !formData.email.trim()) {
      setFormError("Usuario y correo son obligatorios.")
      return
    }

    // Al crear, la contraseña es obligatoria
    if (!editingId && !formData.password.trim()) {
      setFormError("La contraseña es obligatoria al crear un usuario.")
      return
    }

    try {
      setSaving(true)

      if (editingId) {
        // UPDATE
        const payload: UpdateUserDTO = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          role_id: formData.role_id,
        }

        // Solo mandamos password si el admin escribió una nueva
        if (formData.password.trim()) {
          payload.password = formData.password.trim()
        }

        const updated = await usersService.update(editingId, payload)

        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u)),
        )
      } else {
        // CREATE
        const payload: CreateUserDTO = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          role_id: formData.role_id,
          password: formData.password.trim(),
        }

        const created = await usersService.create(payload)
        setUsers((prev) => [...prev, created])
      }

      resetForm()
    } catch (err) {
      console.error("Error guardando usuario:", err)
      setFormError("Ocurrió un error al guardar el usuario.")
    } finally {
      setSaving(false)
    }
  }

  // ---------- Editar / eliminar ----------

  const handleEdit = (user: UserModel) => {
    setFormData({
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      password: "", // no rellenamos contraseña por seguridad
    })
    setEditingId(user.id)
    setShowForm(true)
    setFormError(null)
  }

  const handleDelete = async (id: number) => {
    try {
      await usersService.remove(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error("Error eliminando usuario:", err)
      setError("No se pudo eliminar el usuario.")
    }
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Acciones Administrativas
        </h1>
        <p className="text-gray-600 mb-4">
          Cargando usuarios y roles...
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Acciones Administrativas
          </h1>
          <p className="text-gray-600">
            Gestiona usuarios, roles y permisos
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}{" "}
              <button
                onClick={loadData}
                className="underline text-red-700"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setShowForm((prev) => !prev)
            setEditingId(null)
            setFormData((prev) => ({
              username: "",
              email: "",
              role_id: roles[0]?.id ?? 0,
              password: "",
            }))
            setFormError(null)
          }}
          className="bg-red-700 hover:bg-red-800 text-white gap-2"
        >
          <Plus size={20} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="p-6 mb-8 border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="border-gray-300"
            />
            <Input
              placeholder="Correo electrónico"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="border-gray-300"
            />
            <select
              value={formData.role_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role_id: Number.parseInt(e.target.value),
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-1">
              <Input
                placeholder={
                  editingId
                    ? "Nueva contraseña (opcional)"
                    : "Contraseña"
                }
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="border-gray-300"
              />
              <span className="text-[11px] text-gray-500">
                {editingId
                  ? "Déjala en blanco si no deseas cambiar la contraseña."
                  : "La contraseña es obligatoria al crear un usuario."}
              </span>
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-sm text-red-600">{formError}</p>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSaveUser}
              className="bg-red-700 hover:bg-red-800 text-white"
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : editingId
                  ? "Actualizar"
                  : "Crear"}
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="border-gray-300"
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Tabla de usuarios */}
      <Card className="border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {getRoleName(user.role_id)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                    >
                      <Edit2 size={16} />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="bg-gray-400 hover:bg-gray-500 text-white gap-1"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-sm text-gray-500"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
