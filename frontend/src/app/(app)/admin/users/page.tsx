"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "@/lib/useAuthGuard"
import {
  UserGroupIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: "ADMIN" | "MANAGER" | "DEVELOPER" | "TESTER" | "VIEWER"
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface Permission {
  permission: string
  name: string
  description: string
}

export default function AdminUsersPage() {
  useAuthGuard()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [customPermissions, setCustomPermissions] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
    fetchAllPermissions()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("comet_jwt")
      const res = await fetch("http://localhost:8000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setCurrentUser(data.data?.user || data.user || data)
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("comet_jwt")
      const res = await fetch("http://localhost:8000/api/users?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPermissions = async () => {
    try {
      const token = localStorage.getItem("comet_jwt")
      const res = await fetch("http://localhost:8000/api/users/permissions/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setPermissions(data.data.permissions)
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("comet_jwt")
      const res = await fetch(`http://localhost:8000/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Role updated successfully!" })
        fetchUsers()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update role" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update role" })
    }
  }

  const openPermissionsModal = async (user: User) => {
    setSelectedUser(user)
    setShowPermissionsModal(true)

    try {
      const token = localStorage.getItem("comet_jwt")
      const res = await fetch(`http://localhost:8000/api/users/${user.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setCustomPermissions(data.data.customPermissions)
        setRolePermissions(data.data.rolePermissions)
      }
    } catch (error) {
      console.error("Failed to fetch user permissions:", error)
    }
  }

  const togglePermission = async (permission: string) => {
    if (!selectedUser) return

    const token = localStorage.getItem("comet_jwt")
    const isCustom = customPermissions.includes(permission)

    try {
      if (isCustom) {
        await fetch(`http://localhost:8000/api/users/${selectedUser.id}/permissions/${permission}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        setCustomPermissions(prev => prev.filter(p => p !== permission))
      } else {
        await fetch(`http://localhost:8000/api/users/${selectedUser.id}/permissions/${permission}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        setCustomPermissions(prev => [...prev, permission])
      }
      setMessage({ type: "success", text: "Permission updated!" })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update permission" })
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      ADMIN: { color: "bg-purple-600", label: "Administrator" },
      MANAGER: { color: "bg-blue-600", label: "Manager" },
      DEVELOPER: { color: "bg-cyan-600", label: "Developer" },
      TESTER: { color: "bg-indigo-600", label: "Tester" },
      VIEWER: { color: "bg-gray-600", label: "Viewer" },
    }
    return badges[role] || badges.VIEWER
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Add current user to the list if not already present
  const allUsers = currentUser && !users.find(u => u.id === currentUser.id)
    ? [currentUser, ...filteredUsers]
    : filteredUsers

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-10 p-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-none mb-4">
            User Management
          </h1>
          <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
            Manage roles and permissions across your team
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <XCircleIcon className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="DEVELOPER">Developer</option>
            <option value="TESTER">Tester</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {allUsers.map((user) => {
          const badge = getRoleBadge(user.role)
          const isCurrentUser = currentUser?.id === user.id

          return (
            <div
              key={user.id}
              className={`bg-white rounded-lg border p-6 transition-all hover:shadow-md ${
                isCurrentUser ? "border-purple-300 ring-2 ring-purple-100" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.firstName}
                    className="h-16 w-16 rounded-full"
                  />
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    user.isActive ? "bg-green-500" : "bg-gray-400"
                  }`}></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      {user.lastLoginAt
                        ? `Last login ${new Date(user.lastLoginAt).toLocaleDateString()}`
                        : "Never logged in"}
                    </span>
                  </div>
                </div>

                {/* Role Badge */}
                <div>
                  <span className={`px-4 py-2 rounded-full text-white text-sm font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={isCurrentUser}
                    className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none ${
                      isCurrentUser ? "cursor-not-allowed opacity-50 bg-gray-50" : "cursor-pointer hover:border-purple-300 bg-white"
                    }`}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="TESTER">Tester</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button
                    onClick={() => openPermissionsModal(user)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    Permissions
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* No Results */}
      {allUsers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Permissions</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedUser.firstName} {selectedUser.lastName} · {getRoleBadge(selectedUser.role).label}
                  </p>
                </div>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <XCircleIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Permission Legend */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-purple-600"></div>
                  <span className="font-medium text-gray-700">Role Permissions (Cannot remove)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-cyan-600"></div>
                  <span className="font-medium text-gray-700">Custom Permissions (Toggleable)</span>
                </div>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {Object.entries(permissions).map(([category, perms]) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((perm) => {
                      const isRole = rolePermissions.includes(perm.permission)
                      const isCustom = customPermissions.includes(perm.permission)
                      const hasPermission = isRole || isCustom

                      return (
                        <div
                          key={perm.permission}
                          onClick={() => !isRole && togglePermission(perm.permission)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            hasPermission
                              ? isRole
                                ? "border-purple-300 bg-purple-50"
                                : "border-cyan-300 bg-cyan-50 hover:border-cyan-400 cursor-pointer"
                              : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                          } ${isRole ? "cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                              hasPermission
                                ? isRole
                                  ? "bg-purple-600 border-purple-600"
                                  : "bg-cyan-600 border-cyan-600"
                                : "border-gray-300"
                            }`}>
                              {hasPermission && <CheckCircleIcon className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 text-sm">{perm.name}</h4>
                                {isRole && (
                                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                    Role
                                  </span>
                                )}
                                {isCustom && (
                                  <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded-full">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{perm.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
