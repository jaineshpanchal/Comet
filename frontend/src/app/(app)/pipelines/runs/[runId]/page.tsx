"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
  PlayIcon,
} from "@heroicons/react/24/outline"
import { PipelineService, type PipelineRun, type StageRun } from "@/services/pipeline.service"

export default function PipelineRunDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.runId as string
  const logsEndRef = useRef<HTMLDivElement>(null)

  const [run, setRun] = useState<PipelineRun | null>(null)
  const [logs, setLogs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [actioningRunId, setActioningRunId] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchRunDetails()

    // Auto-refresh every 3 seconds if pipeline is running
    const interval = setInterval(() => {
      if (run && (run.status === "RUNNING" || run.status === "PENDING")) {
        fetchRunDetails(true)
      }
    }, 3000)

    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [runId])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, autoScroll])

  const fetchRunDetails = async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError("")
    }

    try {
      const [runData, logsData] = await Promise.all([
        PipelineService.getPipelineRunById(runId),
        PipelineService.getPipelineRunLogs(runId),
      ])

      setRun(runData)
      setLogs(logsData)

      // Stop auto-refresh if pipeline is no longer running
      if (runData.status !== "RUNNING" && runData.status !== "PENDING" && refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load pipeline run details")
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handleCancelRun = async () => {
    if (!confirm("Are you sure you want to cancel this pipeline run?")) return

    try {
      setActioningRunId(runId)
      await PipelineService.cancelPipelineRun(runId)
      await fetchRunDetails()
    } catch (err: any) {
      alert(`Failed to cancel run: ${err.message}`)
    } finally {
      setActioningRunId(null)
    }
  }

  const handleRetryRun = async () => {
    try {
      setActioningRunId(runId)
      const result = await PipelineService.retryPipelineRun(runId)
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
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case "FAILED":
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      case "RUNNING":
        return <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "PENDING":
        return <ClockIcon className="h-6 w-6 text-gray-400" />
      case "CANCELLED":
        return <XMarkIcon className="h-6 w-6 text-gray-500" />
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-gray-400" />
    }
  }

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500"
      case "FAILED":
        return "bg-red-500"
      case "RUNNING":
        return "bg-blue-500 animate-pulse"
      case "PENDING":
        return "bg-gray-300"
      case "CANCELLED":
        return "bg-gray-400"
      case "SKIPPED":
        return "bg-yellow-400"
      default:
        return "bg-gray-200"
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || "Pipeline run not found"}</p>
          <Link href="/pipelines" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Back to Pipelines
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      {run.pipeline && (
        <Link
          href={`/pipelines/${run.pipeline.id}`}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {run.pipeline.name}
        </Link>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/pipelines" className="hover:text-gray-700">
              Pipelines
            </Link>
            <ChevronRightIcon className="h-4 w-4" />
            {run.pipeline && (
              <>
                <Link
                  href={`/pipelines/${run.pipeline.id}`}
                  className="hover:text-gray-700"
                >
                  {run.pipeline.name}
                </Link>
                <ChevronRightIcon className="h-4 w-4" />
              </>
            )}
            <span className="text-gray-900 font-medium">Run #{runId.slice(0, 8)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              Pipeline Run Details
            </h1>
            {getStatusIcon(run.status)}
          </div>
          <p className="text-gray-600">
            Triggered {formatTimestamp(run.startedAt)} {run.triggeredByUser && `by ${run.triggeredByUser.firstName} ${run.triggeredByUser.lastName}`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {(run.status === "RUNNING" || run.status === "PENDING") && (
            <button
              onClick={handleCancelRun}
              disabled={actioningRunId === runId}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {actioningRunId === runId ? (
                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <XMarkIcon className="h-4 w-4 mr-2" />
              )}
              Cancel Run
            </button>
          )}

          {run.status === "FAILED" && (
            <button
              onClick={handleRetryRun}
              disabled={actioningRunId === runId}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {actioningRunId === runId ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <ArrowPathIcon className="h-4 w-4 mr-2" />
              )}
              Retry Pipeline
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-600">Status</p>
          <div className="flex items-center mt-2">
            {getStatusIcon(run.status)}
            <span className="ml-2 text-lg font-semibold text-gray-900">{run.status}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-600">Duration</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatDuration(run.duration)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-600">Stages</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {run.stages ? `${run.stages.filter((s) => s.status === "SUCCESS").length}/${run.stages.length}` : "0"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-600">Started At</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {new Date(run.startedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Stage Progress */}
      {run.stages && run.stages.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Pipeline Stages</h2>
          </div>
          <div className="p-6 space-y-3">
            {run.stages.map((stage, index) => (
              <div key={stage.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedStage(selectedStage === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${getStageStatusColor(stage.status)}`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{stage.stageName}</span>
                        <span className="text-xs text-gray-500 uppercase">{stage.stageType}</span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Status: {stage.status}</span>
                        {stage.duration && <span>Duration: {formatDuration(stage.duration)}</span>}
                        {stage.startedAt && <span>Started: {new Date(stage.startedAt).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      selectedStage === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {selectedStage === index && stage.logs && (
                  <div className="bg-gray-900 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Stage Logs</span>
                    </div>
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
                      {stage.logs}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Logs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Pipeline Logs</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Auto-scroll</span>
            </label>
            {(run.status === "RUNNING" || run.status === "PENDING") && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                <span>Live</span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-900 p-6 max-h-[600px] overflow-y-auto">
          {logs && logs.stages && logs.stages.length > 0 ? (
            <div className="space-y-6">
              {logs.stages.map((stage: any, idx: number) => (
                <div key={idx}>
                  <div className="text-yellow-400 font-semibold mb-2">
                    === {stage.stageName} ({stage.stageType}) ===
                  </div>
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {stage.logs || "No logs available"}
                  </pre>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No logs available yet...</p>
          )}
        </div>
      </div>
    </div>
  )
}
