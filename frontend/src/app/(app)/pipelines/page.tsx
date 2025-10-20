"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BoltIcon,
  PlayIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CodeBracketIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline"

interface Pipeline {
  id: string
  name: string
  description: string | null
  projectId: string
  trigger: string
  status: string
  isActive: boolean
  lastRunAt: string | null
  createdAt: string
  project?: {
    name: string
    language: string
  }
  _count?: {
    runs: number
    stages: number
  }
}

export default function PipelinesPage() {
  const router = useRouter()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [runningPipeline, setRunningPipeline] = useState<string | null>(null)

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("comet_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch("http://localhost:8000/api/pipelines", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // data.data is already an array of pipelines
        setPipelines(Array.isArray(data.data) ? data.data : [])
      } else {
        setError(data.error || "Failed to fetch pipelines")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRunPipeline = async (pipelineId: string) => {
    setRunningPipeline(pipelineId)

    try {
      const token = localStorage.getItem("comet_jwt")
      const response = await fetch(`http://localhost:8000/api/pipelines/${pipelineId}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        await fetchPipelines()
      } else {
        setError(data.error || "Failed to run pipeline")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setRunningPipeline(null)
    }
  }

  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch =
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pipeline.description && pipeline.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "all" || pipeline.status === filterStatus

    return matchesSearch && matchesStatus
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: "bg-green-100 text-green-800 border-green-300",
      RUNNING: "bg-blue-100 text-blue-800 border-blue-300",
      FAILED: "bg-red-100 text-red-800 border-red-300",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      IDLE: "bg-gray-100 text-gray-800 border-gray-300",
      CANCELLED: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getStatusIcon = (status: string) => {
    if (status === "SUCCESS") return <CheckCircleIcon className="w-4 h-4" />
    if (status === "FAILED") return <XCircleIcon className="w-4 h-4" />
    if (status === "RUNNING") return <ArrowPathIcon className="w-4 h-4 animate-spin" />
    return <ClockIcon className="w-4 h-4" />
  }

  const getTriggerIcon = (trigger: string) => {
    const icons: Record<string, string> = {
      GIT_PUSH: "🔄",
      GIT_PR: "🔀",
      MANUAL: "👆",
      SCHEDULE: "⏰",
      WEBHOOK: "🔗",
    }
    return icons[trigger] || "⚡"
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
              Pipelines
            </h1>
            <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
              Automate your <span className="text-gray-700 font-medium">CI/CD workflows</span> and{" "}
              <span className="text-gray-700 font-medium">deployments</span>
            </p>
          </div>

          <button
            onClick={() => router.push("/pipelines/create")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Pipeline
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BoltIcon className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Pipelines</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pipelines.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowPathIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Running</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {pipelines.filter((p) => p.status === "RUNNING").length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Successful</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {pipelines.filter((p) => p.status === "SUCCESS").length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Failed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {pipelines.filter((p) => p.status === "FAILED").length}
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
                placeholder="Search pipelines..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="IDLE">Idle</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pipelines Display */}
      {filteredPipelines.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BoltIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pipelines Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first pipeline"}
          </p>
          {!searchTerm && filterStatus === "all" && (
            <button
              onClick={() => {}}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Pipeline
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                    <BoltIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {pipeline.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getStatusColor(
                        pipeline.status
                      )}`}
                    >
                      {getStatusIcon(pipeline.status)}
                      {pipeline.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {pipeline.description || "No description"}
              </p>

              <div className="space-y-2 mb-4 text-sm text-gray-500">
                {pipeline.project && (
                  <div className="flex items-center gap-2">
                    <CodeBracketIcon className="w-4 h-4" />
                    <span className="truncate">{pipeline.project.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTriggerIcon(pipeline.trigger)}</span>
                  <span className="capitalize">{pipeline.trigger.toLowerCase().replace(/_/g, " ")}</span>
                </div>
                {pipeline.lastRunAt && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Last run {formatTimeAgo(pipeline.lastRunAt)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 py-3 border-t border-gray-100 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{pipeline._count?.runs || 0}</p>
                  <p className="text-xs text-gray-500">Runs</p>
                </div>
                <div className="text-center border-l border-gray-100">
                  <p className="text-lg font-bold text-gray-900">{pipeline._count?.stages || 0}</p>
                  <p className="text-xs text-gray-500">Stages</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/pipelines/${pipeline.id}`}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleRunPipeline(pipeline.id)}
                  disabled={runningPipeline === pipeline.id || pipeline.status === "RUNNING"}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Run Pipeline"
                >
                  {runningPipeline === pipeline.id ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
