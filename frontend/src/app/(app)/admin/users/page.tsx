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
  SparklesIcon,
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
    const badges: Record<string, { gradient: string; label: string; icon: string }> = {
      ADMIN: { gradient: "from-red-500 via-pink-500 to-rose-500", label: "Administrator", icon: "👑" },
      MANAGER: { gradient: "from-purple-500 via-indigo-500 to-blue-500", label: "Manager", icon: "📊" },
      DEVELOPER: { gradient: "from-blue-500 via-cyan-500 to-teal-500", label: "Developer", icon: "💻" },
      TESTER: { gradient: "from-green-500 via-emerald-500 to-lime-500", label: "Tester", icon: "🧪" },
      VIEWER: { gradient: "from-gray-500 via-slate-500 to-zinc-500", label: "Viewer", icon: "👁️" },
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <UserGroupIcon className="h-9 w-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage roles and permissions across your team</p>
              </div>
            </div>
            <div className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-3xl font-bold text-gray-900">{users.length}</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border-2 flex items-center gap-3 animate-in slide-in-from-top ${
              message.type === "success"
                ? "bg-green-50/80 border-green-200 text-green-800"
                : "bg-red-50/80 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="h-6 w-6" />
            ) : (
              <XCircleIcon className="h-6 w-6" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-lg"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-12 pr-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-lg appearance-none cursor-pointer"
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

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsers.map((user) => {
            const badge = getRoleBadge(user.role)
            const isCurrentUser = currentUser?.id === user.id

            return (
              <div
                key={user.id}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden ${
                  isCurrentUser ? "border-blue-400 ring-4 ring-blue-100" : "border-gray-200"
                }`}
              >
                {/* Gradient Header */}
                <div className={`h-24 bg-gradient-to-r ${badge.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  {isCurrentUser && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-blue-600 flex items-center gap-1 shadow-lg">
                      <SparklesIcon className="h-4 w-4" />
                      You
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative px-6 -mt-12">
                  <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-xl">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.firstName}
                      className="h-full w-full rounded-xl"
                    />
                  </div>
                  <div className={`absolute bottom-0 right-6 h-6 w-6 rounded-full border-4 border-white ${
                    user.isActive ? "bg-green-500" : "bg-gray-400"
                  } shadow-lg`}></div>
                </div>

                {/* Content */}
                <div className="p-6 pt-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">@{user.username}</p>
                  <p className="text-gray-500 text-sm mt-1">{user.email}</p>

                  {/* Role Badge */}
                  <div className="mt-4">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${badge.gradient} text-white font-semibold text-sm shadow-lg`}>
                      <span>{badge.icon}</span>
                      {badge.label}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      {user.lastLoginAt
                        ? `Last login ${new Date(user.lastLoginAt).toLocaleDateString()}`
                        : "Never logged in"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isCurrentUser}
                      className={`flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        isCurrentUser ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-blue-300"
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
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
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
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <UserGroupIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className={`p-8 bg-gradient-to-r ${getRoleBadge(selectedUser.role).gradient} text-white`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Manage Permissions</h2>
                    <p className="text-white/90 text-lg">
                      {selectedUser.firstName} {selectedUser.lastName} · {getRoleBadge(selectedUser.role).label}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Permission Legend */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-500"></div>
                    <span className="text-sm font-semibold text-gray-700">Role Permissions (Cannot remove)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-green-500"></div>
                    <span className="text-sm font-semibold text-gray-700">Custom Permissions (Toggleable)</span>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="flex-1 overflow-y-auto p-8">
                {Object.entries(permissions).map(([category, perms]) => (
                  <div key={category} className="mb-8 last:mb-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <h3 className="text-xl font-bold text-gray-900">{category}</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {perms.map((perm) => {
                        const isRole = rolePermissions.includes(perm.permission)
                        const isCustom = customPermissions.includes(perm.permission)
                        const hasPermission = isRole || isCustom

                        return (
                          <div
                            key={perm.permission}
                            onClick={() => !isRole && togglePermission(perm.permission)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                              hasPermission
                                ? isRole
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-green-300 bg-green-50 hover:border-green-400"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            } ${isRole ? "cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                hasPermission
                                  ? isRole
                                    ? "bg-blue-500 border-blue-500"
                                    : "bg-green-500 border-green-500"
                                  : "border-gray-300"
                              }`}>
                                {hasPermission && <CheckCircleIcon className="h-4 w-4 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm">{perm.name}</h4>
                                  {isRole && (
                                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                      Role
                                    </span>
                                  )}
                                  {isCustom && (
                                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
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
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
