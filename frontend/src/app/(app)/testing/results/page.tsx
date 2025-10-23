"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline"

interface TestRun {
  id: string
  testSuiteId: string
  status: string
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  duration: number | null
  startedAt: string
  completedAt: string | null
  testSuite?: {
    name: string
    type: string
  }
}

export default function TestResultsPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchTestRuns = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      // Fetch all test runs across all suites
      const response = await fetch("http://localhost:8000/api/tests/runs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setTestRuns(data.data || [])
      } else {
        setError(data.error || "Failed to fetch test runs")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTestRuns()
  }, [fetchTestRuns])

  const filteredTestRuns = testRuns.filter((run) => {
    const matchesSearch =
      run.testSuite?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || run.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A"
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

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
      PASSED: "bg-green-100 text-green-800 border-green-300",
      RUNNING: "bg-blue-100 text-blue-800 border-blue-300",
      FAILED: "bg-red-100 text-red-800 border-red-300",
      SKIPPED: "bg-yellow-100 text-yellow-800 border-yellow-300",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getStatusIcon = (status: string) => {
    if (status === "PASSED") return <CheckCircleIcon className="w-4 h-4" />
    if (status === "FAILED") return <XCircleIcon className="w-4 h-4" />
    if (status === "RUNNING") return <ArrowPathIcon className="w-4 h-4 animate-spin" />
    return <ClockIcon className="w-4 h-4" />
  }

  const totalRuns = testRuns.length
  const passedRuns = testRuns.filter((r) => r.status === "PASSED").length
  const failedRuns = testRuns.filter((r) => r.status === "FAILED").length

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
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Test Results
            </h1>
            <p className="text-sm font-normal text-gray-500 tracking-wide">
              View all <span className="text-gray-700 font-medium">test run results</span> and{" "}
              <span className="text-gray-700 font-medium">execution history</span>
            </p>
          </div>

          <button
            onClick={fetchTestRuns}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold  focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Runs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalRuns}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Passed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{passedRuns}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Failed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{failedRuns}</p>
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
                placeholder="Search test runs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="RUNNING">Running</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Test Runs Display */}
      {filteredTestRuns.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BeakerIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Test Runs Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No test runs have been executed yet"}
          </p>
          <Link
            href="/testing"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold  transition-all inline-flex items-center gap-2"
          >
            Go to Test Suites
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTestRuns.map((run) => (
            <div
              key={run.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        run.status
                      )}`}
                    >
                      {getStatusIcon(run.status)}
                      {run.status}
                    </span>
                    <span className="text-sm text-gray-500">{formatTimeAgo(run.startedAt)}</span>
                  </div>

                  {run.testSuite && (
                    <div className="flex items-center gap-2">
                      <BeakerIcon className="w-4 h-4 text-gray-500" />
                      <Link
                        href={`/testing/${run.testSuiteId}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {run.testSuite.name}
                      </Link>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {run.testSuite.type}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Tests</p>
                      <p className="font-medium text-gray-900">{run.totalTests}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Passed</p>
                      <p className="font-medium text-green-600">{run.passedTests}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Failed</p>
                      <p className="font-medium text-red-600">{run.failedTests}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">{formatDuration(run.duration)}</p>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/testing/${run.testSuiteId}`}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors ml-4"
                >
                  View Suite
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
