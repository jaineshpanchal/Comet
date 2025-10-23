"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CodeBracketIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  CalendarIcon,
  BoltIcon,
  BeakerIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
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
  pipelines?: Array<{
    id: string
    name: string
    status: string
    lastRunAt: string | null
  }>
  testSuites?: Array<{
    id: string
    name: string
    type: string
  }>
  deployments?: Array<{
    id: string
    environment: string
    status: string
    deployedAt: string
  }>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "pipelines" | "tests" | "deployments">("overview")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch(`http://localhost:8000/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setProject(data.data.project)
      } else {
        setError(data.error || "Failed to fetch project")
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

      const response = await fetch(`http://localhost:8000/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        router.push("/projects")
      } else {
        setDeleteError(data.error || "Failed to delete project")
      }
    } catch (err) {
      setDeleteError("Network error. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: "bg-green-100 text-green-800 border-green-300",
      RUNNING: "bg-blue-100 text-blue-800 border-blue-300",
      FAILED: "bg-red-100 text-red-800 border-red-300",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      DEPLOYED: "bg-green-100 text-green-800 border-green-300",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getStatusIcon = (status: string) => {
    if (status === "SUCCESS" || status === "DEPLOYED") return <CheckCircleIcon className="w-4 h-4" />
    if (status === "FAILED") return <XCircleIcon className="w-4 h-4" />
    if (status === "RUNNING" || status === "IN_PROGRESS") return <ClockIcon className="w-4 h-4 animate-spin" />
    return <ClockIcon className="w-4 h-4" />
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  if (error || !project) {
    return (
      <div className="space-y-8 pb-12">
        <Link href="/projects" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error || "Project not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Back Button */}
      <Link href="/projects" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
                {project.name}
              </h1>
              {project.isActive ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-300">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full border border-gray-300">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{project.description || "No description provided"}</p>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CodeBracketIcon className="w-4 h-4" />
                <span className="font-medium">{project.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{project.branch}</span>
              </div>
              {project.owner && (
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>
                    {project.owner.firstName} {project.owner.lastName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BoltIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Pipelines</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{project.pipelines?.length || 0}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Test Suites</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{project.testSuites?.length || 0}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <RocketLaunchIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Deployments</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{project.deployments?.length || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: "overview", label: "Overview", icon: CodeBracketIcon },
            { id: "pipelines", label: "Pipelines", icon: BoltIcon },
            { id: "tests", label: "Tests", icon: BeakerIcon },
            { id: "deployments", label: "Deployments", icon: RocketLaunchIcon },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Repository URL</p>
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 font-mono"
                >
                  {project.repositoryUrl}
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p className="text-sm text-gray-900 font-mono">{project.branch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Framework</p>
                <p className="text-sm text-gray-900">{project.framework}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Language</p>
                <p className="text-sm text-gray-900">{project.language}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team & Access</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="text-sm text-gray-900">
                  {project.owner
                    ? `${project.owner.firstName} ${project.owner.lastName} (${project.owner.email})`
                    : "N/A"}
                </p>
              </div>
              {project.team && (
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="text-sm text-gray-900">{project.team.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pipelines" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {project.pipelines && project.pipelines.length > 0 ? (
            <div className="space-y-4">
              {project.pipelines.map((pipeline) => (
                <div key={pipeline.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <BoltIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{pipeline.name}</p>
                      {pipeline.lastRunAt && (
                        <p className="text-sm text-gray-500">Last run: {formatDate(pipeline.lastRunAt)}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(pipeline.status)}`}>
                    {getStatusIcon(pipeline.status)}
                    {pipeline.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BoltIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No pipelines configured</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "tests" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {project.testSuites && project.testSuites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.testSuites.map((suite) => (
                <div key={suite.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <BeakerIcon className="w-5 h-5 text-cyan-600" />
                    <p className="font-medium text-gray-900">{suite.name}</p>
                  </div>
                  <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-full border border-cyan-300">
                    {suite.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BeakerIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No test suites configured</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "deployments" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {project.deployments && project.deployments.length > 0 ? (
            <div className="space-y-4">
              {project.deployments.map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <RocketLaunchIcon className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">{deployment.environment}</p>
                      <p className="text-sm text-gray-500">Deployed: {formatDate(deployment.deployedAt)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(deployment.status)}`}>
                    {getStatusIcon(deployment.status)}
                    {deployment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <RocketLaunchIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No deployments yet</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>

              {/* Title and Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Delete Project</h2>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to delete <strong className="text-gray-900">{project.name}</strong>?
              </p>

              {/* Warning Box */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <XCircleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">This action cannot be undone</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• All pipelines will be deleted</li>
                      <li>• All test suites will be removed</li>
                      <li>• Deployment history will be lost</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {deleteError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                  <p className="text-sm text-red-800">{deleteError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteError("")
                  }}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {deleteLoading ? (
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
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <TrashIcon className="w-5 h-5" />
                      Delete Project
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <p className="text-gray-600 mb-4">Project edit form coming soon...</p>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
