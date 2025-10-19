"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CodeBracketIcon,
  CalendarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  PencilIcon,
  RocketLaunchIcon,
  BeakerIcon,
  BoltIcon,
} from "@heroicons/react/24/outline"

interface Project {
  id: string
  name: string
  description: string | null
  repositoryUrl: string
  branch: string
  framework: string
  language: string
  ownerId: string
  teamId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner?: {
    firstName: string
    lastName: string
    email: string
  }
  team?: {
    name: string
  }
  _count?: {
    pipelines: number
    testSuites: number
    deployments: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLanguage, setFilterLanguage] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    repositoryUrl: "",
    branch: "main",
    language: "javascript",
    framework: "",
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("comet_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch("http://localhost:8000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setProjects(data.data.projects || [])
      } else {
        setError(data.error || "Failed to fetch projects")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError("")

    try {
      const token = localStorage.getItem("comet_jwt")
      if (!token) {
        setCreateError("Not authenticated")
        return
      }

      const response = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (data.success) {
        // Reset form and close modal
        setCreateForm({
          name: "",
          description: "",
          repositoryUrl: "",
          branch: "main",
          language: "javascript",
          framework: "",
        })
        setShowCreateModal(false)
        // Refresh projects list
        await fetchProjects()
      } else {
        setCreateError(data.error || "Failed to create project")
      }
    } catch (err) {
      setCreateError("Network error. Please try again.")
    } finally {
      setCreateLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLanguage = filterLanguage === "all" || project.language === filterLanguage

    return matchesSearch && matchesLanguage
  })

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return past.toLocaleDateString()
  }

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      javascript: "🟨",
      typescript: "🔷",
      python: "🐍",
      java: "☕",
      go: "🔵",
      ruby: "💎",
      php: "🐘",
      rust: "🦀",
    }
    return icons[language.toLowerCase()] || "📦"
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-100 text-yellow-800 border-yellow-300",
      typescript: "bg-blue-100 text-blue-800 border-blue-300",
      python: "bg-green-100 text-green-800 border-green-300",
      java: "bg-red-100 text-red-800 border-red-300",
      go: "bg-cyan-100 text-cyan-800 border-cyan-300",
      ruby: "bg-pink-100 text-pink-800 border-pink-300",
    }
    return colors[language.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-none mb-4">
              Projects
            </h1>
            <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
              Manage your <span className="text-gray-700 font-medium">repositories</span> and{" "}
              <span className="text-gray-700 font-medium">CI/CD pipelines</span>
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CodeBracketIcon className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Projects</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BoltIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active Pipelines</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {projects.reduce((sum, p) => sum + (p._count?.pipelines || 0), 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Test Suites</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {projects.reduce((sum, p) => sum + (p._count?.testSuites || 0), 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <RocketLaunchIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Deployments</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {projects.reduce((sum, p) => sum + (p._count?.deployments || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FunnelIcon className="w-5 h-5" />
            <span>Filters:</span>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="all">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="ruby">Ruby</option>
          </select>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-purple-100 text-purple-600" : "text-gray-600"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-purple-100 text-purple-600" : "text-gray-600"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CodeBracketIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterLanguage !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first project"}
          </p>
          {!searchTerm && filterLanguage === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Project
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getLanguageIcon(project.language)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {project.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getLanguageColor(project.language)} mt-1`}>
                      {project.language}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description || "No description"}
              </p>

              <div className="space-y-2 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CodeBracketIcon className="w-4 h-4" />
                  <span className="font-mono text-xs truncate">{project.branch}</span>
                </div>
                {project.owner && (
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="truncate">
                      {project.owner.firstName} {project.owner.lastName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatTimeAgo(project.createdAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{project._count?.pipelines || 0}</p>
                  <p className="text-xs text-gray-500">Pipelines</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <p className="text-lg font-bold text-gray-900">{project._count?.testSuites || 0}</p>
                  <p className="text-xs text-gray-500">Tests</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{project._count?.deployments || 0}</p>
                  <p className="text-xs text-gray-500">Deploys</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  View Details
                </Link>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getLanguageIcon(project.language)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getLanguageColor(project.language)}`}>
                      {project.language}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{project._count?.pipelines || 0} pipelines</span>
                      <span>{project._count?.testSuites || 0} tests</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatTimeAgo(project.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Cog6ToothIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                Create New Project
              </h2>
              <p className="text-gray-600 mt-2">Set up a new project to start building and deploying</p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProject} className="p-8 space-y-6">
              {/* Error Message */}
              {createError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}

              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  placeholder="A brief description of your project..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Repository URL */}
              <div>
                <label htmlFor="repositoryUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  Repository URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="repositoryUrl"
                  type="url"
                  value={createForm.repositoryUrl}
                  onChange={(e) => setCreateForm({ ...createForm, repositoryUrl: e.target.value })}
                  required
                  placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">GitHub, GitLab, or Bitbucket URL</p>
              </div>

              {/* Branch and Language Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Branch <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={createForm.branch}
                    onChange={(e) => setCreateForm({ ...createForm, branch: e.target.value })}
                    required
                    placeholder="main"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="language"
                    value={createForm.language}
                    onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                    <option value="ruby">Ruby</option>
                    <option value="php">PHP</option>
                    <option value="rust">Rust</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>
              </div>

              {/* Framework */}
              <div>
                <label htmlFor="framework" className="block text-sm font-semibold text-gray-700 mb-2">
                  Framework
                </label>
                <input
                  id="framework"
                  type="text"
                  value={createForm.framework}
                  onChange={(e) => setCreateForm({ ...createForm, framework: e.target.value })}
                  placeholder="React, Next.js, Django, Spring Boot, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateError("")
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {createLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <PlusIcon className="w-5 h-5" />
                      Create Project
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
