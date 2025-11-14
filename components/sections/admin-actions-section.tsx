"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  role_id: number
}

const INITIAL_USERS: User[] = [
  { id: 1, username: "almacen", email: "almacen@electroalarmas.com", role_id: 2 },
  { id: 2, username: "vendedor", email: "vendedor@electroalarmas.com", role_id: 3 },
  { id: 3, username: "admin", email: "admin@electroalarmas.com", role_id: 1 },
]

const ROLES = [
  { id: 1, name: "Administrador" },
  { id: 2, name: "Almacén" },
  { id: 3, name: "Vendedor" },
]

export function AdminActionsSection() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ username: "", email: "", role_id: 2 })
  const [showForm, setShowForm] = useState(false)

  const handleAddUser = () => {
    if (editingId) {
      setUsers(users.map((u) => (u.id === editingId ? { ...u, ...formData } : u)))
      setEditingId(null)
    } else {
      const newUser: User = { id: Date.now(), ...formData }
      setUsers([...users, newUser])
    }
    setFormData({ username: "", email: "", role_id: 2 })
    setShowForm(false)
  }

  const handleEdit = (user: User) => {
    setFormData({ username: user.username, email: user.email, role_id: user.role_id })
    setEditingId(user.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    setUsers(users.filter((u) => u.id !== id))
  }

  const getRoleName = (roleId: number) => {
    return ROLES.find((r) => r.id === roleId)?.name || "Desconocido"
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acciones Administrativas</h1>
          <p className="text-gray-600">Gestiona usuarios, roles y permisos</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ username: "", email: "", role_id: 2 })
          }}
          className="bg-red-700 hover:bg-red-800 text-white gap-2"
        >
          <Plus size={20} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 mb-8 border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="border-gray-300"
            />
            <Input
              placeholder="Correo electrónico"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border-gray-300"
            />
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: Number.parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddUser} className="bg-red-700 hover:bg-red-800 text-white">
              {editingId ? "Actualizar" : "Crear"}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setFormData({ username: "", email: "", role_id: 2 })
              }}
              variant="outline"
              className="border-gray-300"
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Correo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
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
          </tbody>
        </table>
      </Card>
    </div>
  )
}
