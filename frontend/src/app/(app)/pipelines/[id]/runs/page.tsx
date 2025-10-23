"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  PlayIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline"
import { PipelineService, type PipelineRun, type Pipeline } from "@/services/pipeline.service"

export default function PipelineRunsPage() {
  const params = useParams()
  const router = useRouter()
  const pipelineId = params.id as string

  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [actioningRunId, setActioningRunId] = useState<string | null>(null)

  useEffect(() => {
    fetchPipelineAndRuns()
  }, [pipelineId, filterStatus])

  const fetchPipelineAndRuns = async () => {
    setLoading(true)
    setError("")

    try {
      // Fetch pipeline details
      const pipelineData = await PipelineService.getPipelineById(pipelineId)
      setPipeline(pipelineData)

      // Fetch runs
      const runsData = await PipelineService.getPipelineRuns(
        pipelineId,
        50,
        filterStatus === "all" ? undefined : filterStatus
      )
      // Handle both array response and object with runs property
      if (Array.isArray(runsData)) {
        setRuns(runsData)
      } else if (runsData && typeof runsData === 'object' && 'runs' in runsData) {
        setRuns((runsData as any).runs || [])
      } else {
        setRuns([])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load pipeline runs")
    } finally {
      setLoading(false)
    }
  }

  const handleRunPipeline = async () => {
    try {
      setActioningRunId("new")
      await PipelineService.runPipeline(pipelineId)
      await fetchPipelineAndRuns()
    } catch (err: any) {
      alert(`Failed to run pipeline: ${err.message}`)
    } finally {
      setActioningRunId(null)
    }
  }

  const handleCancelRun = async (runId: string) => {
    if (!confirm("Are you sure you want to cancel this pipeline run?")) return

    try {
      setActioningRunId(runId)
      await PipelineService.cancelPipelineRun(runId)
      await fetchPipelineAndRuns()
    } catch (err: any) {
      alert(`Failed to cancel run: ${err.message}`)
    } finally {
      setActioningRunId(null)
    }
  }

  const handleRetryRun = async (runId: string) => {
    try {
      setActioningRunId(runId)
      const result = await PipelineService.retryPipelineRun(runId)
      await fetchPipelineAndRuns()
      router.push(`/pipelines/runs/${result.newRunId}`)
    } catch (err: any) {
      alert(`Failed to retry run: ${err.message}`)
    } finally {
      setActioningRunId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "FAILED":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case "RUNNING":
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "PENDING":
        return <ClockIcon className="h-5 w-5 text-gray-400" />
      case "CANCELLED":
        return <XMarkIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      case "RUNNING":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
        return "bg-gray-100 text-gray-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-600"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return ""
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading && !pipeline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/pipelines" className="hover:text-gray-700">
              Pipelines
            </Link>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{pipeline?.name || "..."}</span>
          </div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
            Pipeline Runs
          </h1>
          <p className="text-gray-600">
            View and manage all runs for <span className="font-medium text-gray-900">{pipeline?.name}</span>
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={actioningRunId === "new"}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actioningRunId === "new" ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <PlayIcon className="h-4 w-4 mr-2" />
          )}
          Run Pipeline
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900">{runs.length}</p>
            </div>
            <PlayIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {runs.filter((r) => r.status === "SUCCESS").length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {runs.filter((r) => r.status === "FAILED").length}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-blue-600">
                {runs.filter((r) => r.status === "RUNNING" || r.status === "PENDING").length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-2">
            {["all", "SUCCESS", "FAILED", "RUNNING", "PENDING"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Runs List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : runs.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No pipeline runs yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Click "Run Pipeline" to start your first pipeline execution.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run.id}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">{getStatusIcon(run.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/pipelines/runs/${run.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          Run #{run.id.slice(0, 8)}
                        </Link>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            run.status
                          )}`}
                        >
                          {run.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatTimestamp(run.startedAt)}
                        </div>

                        {run.duration && (
                          <div className="flex items-center">
                            <span className="mr-1">�</span>
                            {formatDuration(run.duration)}
                          </div>
                        )}

                        {run.triggeredByUser && (
                          <div className="flex items-center">
                            <span className="mr-1">=d</span>
                            {run.triggeredByUser.firstName} {run.triggeredByUser.lastName}
                          </div>
                        )}

                        {run.stages && run.stages.length > 0 && (
                          <div className="flex items-center">
                            <span className="mr-1">=�</span>
                            {run.stages.filter((s) => s.status === "SUCCESS").length}/{run.stages.length} stages
                          </div>
                        )}
                      </div>

                      {/* Stage Progress Bar */}
                      {run.stages && run.stages.length > 0 && (
                        <div className="mt-3">
                          <div className="flex space-x-1">
                            {run.stages.map((stage, idx) => (
                              <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full ${
                                  stage.status === "SUCCESS"
                                    ? "bg-green-500"
                                    : stage.status === "FAILED"
                                    ? "bg-red-500"
                                    : stage.status === "RUNNING"
                                    ? "bg-blue-500 animate-pulse"
                                    : "bg-gray-200"
                                }`}
                                title={`${stage.stageName}: ${stage.status}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/pipelines/runs/${run.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </Link>

                    {(run.status === "RUNNING" || run.status === "PENDING") && (
                      <button
                        onClick={() => handleCancelRun(run.id)}
                        disabled={actioningRunId === run.id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {actioningRunId === run.id ? (
                          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </button>
                    )}

                    {run.status === "FAILED" && (
                      <button
                        onClick={() => handleRetryRun(run.id)}
                        disabled={actioningRunId === run.id}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {actioningRunId === run.id ? (
                          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Retry
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
