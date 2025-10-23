"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CodeBracketIcon,
  CalendarIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"

interface DeploymentDetails {
  id: string
  version: string
  environment: string
  status: string
  branch: string
  commitHash: string
  deployedAt: string
  finishedAt: string | null
  duration: number | null
  projectId: string
  deployedByUserId: string
  configuration: any
  project?: {
    id: string
    name: string
    repositoryUrl: string
    branch: string
  }
  deployedByUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
  }
}

export default function DeploymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [deployment, setDeployment] = useState<DeploymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState(false)

  const fetchDeploymentDetails = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const token = localStorage.getItem("golive_jwt")
      const response = await fetch(`http://localhost:8000/api/deployments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setDeployment(data.data)
      } else {
        setError(data.message || "Failed to load deployment details.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDeploymentDetails()
  }, [fetchDeploymentDetails])

  const handleRollback = async () => {
    if (!confirm("Are you sure you want to rollback this deployment?")) return

    setRollingBack(true)
    try {
      const token = localStorage.getItem("golive_jwt")
      const response = await fetch(`http://localhost:8000/api/deployments/${id}/rollback`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        fetchDeploymentDetails()
      } else {
        setError(data.error || "Failed to rollback deployment")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setRollingBack(false)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A"
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DEPLOYED: "bg-green-100 text-green-800 border-green-300",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
      FAILED: "bg-red-100 text-red-800 border-red-300",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      ROLLED_BACK: "bg-orange-100 text-orange-800 border-orange-300",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getStatusIcon = (status: string) => {
    if (status === "DEPLOYED") return <CheckCircleIcon className="w-5 h-5" />
    if (status === "FAILED") return <XCircleIcon className="w-5 h-5" />
    if (status === "IN_PROGRESS") return <ArrowPathIcon className="w-5 h-5 animate-spin" />
    if (status === "ROLLED_BACK") return <ArrowUturnLeftIcon className="w-5 h-5" />
    return <ClockIcon className="w-5 h-5" />
  }

  const getEnvironmentColor = (env: string) => {
    const colors: Record<string, string> = {
      development: "bg-blue-100 text-blue-800 border-blue-300",
      staging: "bg-purple-100 text-purple-800 border-blue-300",
      production: "bg-red-100 text-red-800 border-red-300",
    }
    return colors[env] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !deployment) {
    return (
      <div className="space-y-8 pb-12">
        <Link
          href="/deployments"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Deployments
        </Link>
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
          <p className="text-red-800">{error || "Deployment not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Back Button */}
      <Link
        href="/deployments"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Deployments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">Deployment Details</h1>
          <p className="text-lg text-gray-600">Version {deployment.version}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getEnvironmentColor(
              deployment.environment
            )}`}
          >
            {deployment.environment.toUpperCase()}
          </span>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
              deployment.status
            )}`}
          >
            {getStatusIcon(deployment.status)}
            {deployment.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Info */}
          {deployment.project && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <CodeBracketIcon className="w-4 h-4" />
                <span>Project</span>
              </div>
              <Link
                href={`/projects/${deployment.project.id}`}
                className="text-xl font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {deployment.project.name}
              </Link>
            </div>
          )}

          {/* Deployed By */}
          {deployment.deployedByUser && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <UserCircleIcon className="w-4 h-4" />
                <span>Deployed By</span>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                {deployment.deployedByUser.firstName} {deployment.deployedByUser.lastName}
              </p>
              <p className="text-sm text-gray-500">{deployment.deployedByUser.email}</p>
            </div>
          )}

          {/* Version */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <RocketLaunchIcon className="w-4 h-4" />
              <span>Version</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{deployment.version}</p>
          </div>

          {/* Environment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Environment</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 capitalize">{deployment.environment}</p>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Branch</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{deployment.branch}</p>
          </div>

          {/* Commit Hash */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Commit Hash</span>
            </div>
            <p className="text-xl font-mono text-gray-900">{deployment.commitHash}</p>
          </div>

          {/* Deployed At */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>Deployed At</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {new Date(deployment.deployedAt).toLocaleString()}
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <ClockIcon className="w-4 h-4" />
              <span>Duration</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{formatDuration(deployment.duration)}</p>
          </div>

          {/* Finished At */}
          {deployment.finishedAt && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <CalendarIcon className="w-4 h-4" />
                <span>Finished At</span>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                {new Date(deployment.finishedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Configuration */}
      {deployment.configuration && Object.keys(deployment.configuration).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
          </div>
          <pre className="bg-gray-50 p-6 rounded-lg text-sm overflow-auto border border-gray-200">
            {JSON.stringify(deployment.configuration, null, 2)}
          </pre>
        </div>
      )}

      {/* Repository Info */}
      {deployment.project?.repositoryUrl && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Repository</h2>
          <a
            href={deployment.project.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            {deployment.project.repositoryUrl}
          </a>
        </div>
      )}

      {/* Actions */}
      {deployment.status === "DEPLOYED" && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <button
            onClick={handleRollback}
            disabled={rollingBack}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rollingBack ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Rolling back...
              </>
            ) : (
              <>
                <ArrowUturnLeftIcon className="w-5 h-5" />
                Rollback Deployment
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            This will rollback to the previous deployment version.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
