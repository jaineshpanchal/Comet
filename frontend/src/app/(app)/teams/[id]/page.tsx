"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  UserIcon,
  CalendarIcon,
  CodeBracketIcon,
  PlusIcon,
  XCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"

interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: string
  joinedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

interface Team {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  ownerId: string
  owner?: {
    firstName: string
    lastName: string
    email: string
  }
  members?: TeamMember[]
  projects?: Array<{
    id: string
    name: string
    language: string
  }>
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"members" | "projects">("members")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [addMemberForm, setAddMemberForm] = useState({
    email: "",
    role: "MEMBER",
  })
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [addMemberError, setAddMemberError] = useState("")

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch(`http://localhost:8000/api/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setTeam(data.data.team)
      } else {
        setError(data.error || "Failed to fetch team")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setDeleteError("Not authenticated")
        return
      }

      const response = await fetch(`http://localhost:8000/api/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        router.push("/teams")
      } else {
        setDeleteError(data.error || "Failed to delete team")
      }
    } catch (err) {
      setDeleteError("Network error. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddMemberLoading(true)
    setAddMemberError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setAddMemberError("Not authenticated")
        return
      }

      const response = await fetch(`http://localhost:8000/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addMemberForm),
      })

      const data = await response.json()

      if (data.success) {
        setAddMemberForm({ email: "", role: "MEMBER" })
        setShowAddMemberModal(false)
        await fetchTeam()
      } else {
        setAddMemberError(data.error || "Failed to add member")
      }
    } catch (err) {
      setAddMemberError("Network error. Please try again.")
    } finally {
      setAddMemberLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const token = localStorage.getItem("golive_jwt")
      const response = await fetch(`http://localhost:8000/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        await fetchTeam()
      } else {
        setError(data.error || "Failed to remove member")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-800 border-red-300",
      MANAGER: "bg-purple-100 text-purple-800 border-purple-300",
      MEMBER: "bg-blue-100 text-blue-800 border-blue-300",
      VIEWER: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="space-y-8 pb-12">
        <Link href="/teams" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Teams
        </Link>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error || "Team not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Back Button */}
      <Link href="/teams" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Teams
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                {team.name}
              </h1>
            </div>
            {team.description && (
              <p className="text-lg text-gray-600 mb-4">{team.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {team.owner && (
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>
                    Owner: {team.owner.firstName} {team.owner.lastName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Created {formatDate(team.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Team Members</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{team.members?.length || 0}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <CodeBracketIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Team Projects</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{team.projects?.length || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-8">
            {[
              { id: "members", label: "Members", icon: UserIcon },
              { id: "projects", label: "Projects", icon: CodeBracketIcon },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "members" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              {team.members && team.members.length > 0 ? (
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <UserIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <EnvelopeIcon className="w-4 h-4" />
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No members yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Team Projects</h2>

              {team.projects && team.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CodeBracketIcon className="w-5 h-5 text-cyan-600" />
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.language}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CodeBracketIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No projects assigned to this team</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Delete Team</h2>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to delete <strong className="text-gray-900">{team.name}</strong>?
              </p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <XCircleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">This action cannot be undone</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• All team members will be removed</li>
                      <li>• Projects will be unassigned from this team</li>
                    </ul>
                  </div>
                </div>
              </div>

              {deleteError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                  <p className="text-sm text-red-800">{deleteError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteError("")
                  }}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {deleteLoading ? "Deleting..." : "Delete Team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                Add Team Member
              </h2>
              <p className="text-gray-600 mt-2">Invite a user to join this team</p>
            </div>

            <form onSubmit={handleAddMember} className="p-8 space-y-6">
              {addMemberError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-sm text-red-800">{addMemberError}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  value={addMemberForm.role}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false)
                    setAddMemberError("")
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMemberLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {addMemberLoading ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
