"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BoltIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CodeBracketIcon,
  CalendarIcon,
  UserIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

interface PipelineStage {
  id: string
  name: string
  type: string
  order: number
  command: string | null
  status: string
}

interface PipelineRun {
  id: string
  pipelineId: string
  status: string
  startedAt: string
  completedAt: string | null
  duration: number | null
  triggeredBy: string
  triggeredByUser?: {
    firstName: string
    lastName: string
    email: string
  }
  stageRuns?: Array<{
    id: string
    stageId: string
    status: string
    startedAt: string
    completedAt: string | null
    duration: number | null
    logs: string | null
    stage: {
      name: string
      type: string
      order: number
    }
  }>
}

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
  stages?: PipelineStage[]
  pipelineRuns?: PipelineRun[]
}

export default function PipelineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pipelineId = params.id as string

  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "runs" | "stages">("overview")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [runningPipeline, setRunningPipeline] = useState(false)

  useEffect(() => {
    fetchPipeline()
  }, [pipelineId])

  const fetchPipeline = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch(`http://localhost:8000/api/pipelines/${pipelineId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // API returns pipeline data directly in data.data, not data.data.pipeline
        setPipeline(data.data)
      } else {
        setError(data.error || "Failed to fetch pipeline")
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

      const response = await fetch(`http://localhost:8000/api/pipelines/${pipelineId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        router.push("/pipelines")
      } else {
        setDeleteError(data.error || "Failed to delete pipeline")
      }
    } catch (err) {
      setDeleteError("Network error. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRunPipeline = async () => {
    setRunningPipeline(true)

    try {
      const token = localStorage.getItem("golive_jwt")
      const response = await fetch(`http://localhost:8000/api/pipelines/${pipelineId}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        await fetchPipeline()
      } else {
        setError(data.error || "Failed to run pipeline")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setRunningPipeline(false)
    }
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
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

  const getStageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      BUILD: "bg-blue-100 text-blue-800 border-blue-300",
      TEST: "bg-cyan-100 text-cyan-800 border-cyan-300",
      SECURITY_SCAN: "bg-purple-100 text-purple-800 border-purple-300",
      DEPLOY: "bg-green-100 text-green-800 border-green-300",
      ROLLBACK: "bg-red-100 text-red-800 border-red-300",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-300"
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

  if (error || !pipeline) {
    return (
      <div className="space-y-8 pb-12">
        <Link href="/pipelines" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Pipelines
        </Link>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error || "Pipeline not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Back Button */}
      <Link href="/pipelines" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Pipelines
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                {pipeline.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  pipeline.status
                )}`}
              >
                {getStatusIcon(pipeline.status)}
                {pipeline.status}
              </span>
            </div>
            {pipeline.description && (
              <p className="text-lg text-gray-600 mb-4">{pipeline.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {pipeline.project && (
                <div className="flex items-center gap-2">
                  <CodeBracketIcon className="w-4 h-4" />
                  <span>{pipeline.project.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Created {formatDate(pipeline.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunPipeline}
              disabled={runningPipeline || pipeline.status === "RUNNING"}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {runningPipeline ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5" />
                  Run Pipeline
                </>
              )}
            </button>
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

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: BoltIcon },
              { id: "stages", label: "Stages", icon: ChevronRightIcon },
              { id: "runs", label: "Run History", icon: ClockIcon },
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
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BoltIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-500">Trigger</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {pipeline.trigger.toLowerCase().replace(/_/g, " ")}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronRightIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">Stages</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{pipeline.stages?.length || 0}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-cyan-600" />
                    <span className="text-sm font-medium text-gray-500">Total Runs</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{pipeline.pipelineRuns?.length || 0}</p>
                </div>
              </div>

              {pipeline.lastRunAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Last Run</span>
                  </div>
                  <p className="text-sm text-blue-800">{formatDate(pipeline.lastRunAt)}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "stages" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Stages</h2>

              {pipeline.stages && pipeline.stages.length > 0 ? (
                <div className="space-y-4">
                  {pipeline.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage, index) => (
                      <div key={stage.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{stage.name}</p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStageTypeColor(
                                  stage.type
                                )}`}
                              >
                                {stage.type}
                              </span>
                            </div>
                          </div>
                          {stage.command && (
                            <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono text-gray-700">
                              {stage.command}
                            </code>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChevronRightIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No stages configured</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "runs" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Run History</h2>

              {pipeline.pipelineRuns && pipeline.pipelineRuns.length > 0 ? (
                <div className="space-y-4">
                  {pipeline.pipelineRuns.map((run) => (
                    <div key={run.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                              run.status
                            )}`}
                          >
                            {getStatusIcon(run.status)}
                            {run.status}
                          </span>
                          <div>
                            <Link
                              href={`/pipelines/runs/${run.id}`}
                              className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                            >
                              Run #{run.id.substring(0, 8)}
                            </Link>
                            <p className="text-sm text-gray-500">
                              Started {formatDate(run.startedAt)}
                              {run.triggeredByUser && (
                                <span className="ml-2">
                                  by {run.triggeredByUser.firstName} {run.triggeredByUser.lastName}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {run.duration !== null && (
                            <div className="text-sm text-gray-600">
                              <ClockIcon className="w-4 h-4 inline mr-1" />
                              {formatDuration(run.duration)}
                            </div>
                          )}
                          <Link
                            href={`/pipelines/runs/${run.id}`}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                          >
                            View Logs
                          </Link>
                        </div>
                      </div>

                      {run.stageRuns && run.stageRuns.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Stage Execution:</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {run.stageRuns
                              .sort((a, b) => a.stage.order - b.stage.order)
                              .map((stageRun) => (
                                <div
                                  key={stageRun.id}
                                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    stageRun.status
                                  )}`}
                                >
                                  {getStatusIcon(stageRun.status)}
                                  {stageRun.stage.name}
                                  {stageRun.duration !== null && (
                                    <span className="ml-1">({formatDuration(stageRun.duration)})</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No runs yet</p>
                  <p className="text-sm text-gray-400 mb-4">This pipeline hasn't been executed</p>
                  <button
                    onClick={handleRunPipeline}
                    disabled={runningPipeline}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center gap-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Run Now
                  </button>
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

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Delete Pipeline</h2>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to delete <strong className="text-gray-900">{pipeline.name}</strong>?
              </p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <XMarkIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">This action cannot be undone</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• All pipeline stages will be deleted</li>
                      <li>• Run history will be lost</li>
                      <li>• Configuration will be removed</li>
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
                  {deleteLoading ? "Deleting..." : "Delete Pipeline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
