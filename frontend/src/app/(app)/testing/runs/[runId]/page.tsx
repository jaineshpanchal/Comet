"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BeakerIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline"
import { TestService, type TestRun } from "@/services/test.service"

export default function TestRunDetailsPage() {
  const params = useParams()
  const runId = params.runId as string

  const [loading, setLoading] = useState(true)
  const [testRun, setTestRun] = useState<TestRun | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (runId) {
      fetchTestRun()
    }
  }, [runId])

  // Auto-refresh for running tests
  useEffect(() => {
    if (!autoRefresh || !testRun) return

    if (testRun.status === 'RUNNING' || testRun.status === 'PENDING') {
      const interval = setInterval(() => {
        fetchTestRun()
      }, 3000) // Refresh every 3 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, testRun])

  const fetchTestRun = async () => {
    try {
      setLoading(false) // Only show loading on first fetch
      const data = await TestService.getTestRunById(runId)
      setTestRun(data)

      // Stop auto-refresh if test is complete
      if (data.status !== 'RUNNING' && data.status !== 'PENDING') {
        setAutoRefresh(false)
      }
    } catch (error) {
      console.error('Error fetching test run:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return <CheckCircleIcon className="w-6 h-6" />
      case 'FAILED':
        return <XCircleIcon className="w-6 h-6" />
      case 'RUNNING':
        return <ClockIcon className="w-6 h-6 animate-spin" />
      default:
        return <ClockIcon className="w-6 h-6" />
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading test run...</p>
        </div>
      </div>
    )
  }

  if (!testRun) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BeakerIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Test Run Not Found</h2>
          <p className="text-gray-600 mb-6">The test run you're looking for doesn't exist.</p>
          <Link
            href="/testing/suites"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Test Suites
          </Link>
        </div>
      </div>
    )
  }

  const results = testRun.results ? (typeof testRun.results === 'string' ? JSON.parse(testRun.results) : testRun.results) : {}
  const metadata = testRun.metadata ? (typeof testRun.metadata === 'string' ? JSON.parse(testRun.metadata) : testRun.metadata) : {}

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={`/testing/suites/${testRun.testSuiteId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900">Test Run Details</h1>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(testRun.status)}`}>
                {getStatusIcon(testRun.status)}
                {testRun.status}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Suite: <Link href={`/testing/suites/${testRun.testSuiteId}`} className="font-medium text-purple-600 hover:text-purple-700">{testRun.testSuite?.name}</Link></span>
              <span>"</span>
              <span>Started: <span className="font-medium text-gray-700">{new Date(testRun.startedAt).toLocaleString()}</span></span>
              {testRun.finishedAt && (
                <>
                  <span>"</span>
                  <span>Duration: <span className="font-medium text-gray-700">{formatDuration(testRun.duration)}</span></span>
                </>
              )}
            </div>
            {testRun.triggeredByUser && (
              <p className="text-sm text-gray-500 mt-1">
                Triggered by {testRun.triggeredByUser.firstName} {testRun.triggeredByUser.lastName}
              </p>
            )}
          </div>
        </div>

        {(testRun.status === 'RUNNING' || testRun.status === 'PENDING') && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">Auto-refreshing...</span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BeakerIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-500">Total Tests</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{testRun.totalTests}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Passed</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{testRun.passedTests}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircleIcon className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-500">Failed</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{testRun.failedTests}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-500">Skipped</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{testRun.skippedTests}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ChartBarIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500">Coverage</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {testRun.coverage !== null && testRun.coverage !== undefined ? `${testRun.coverage.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      {testRun.coverage !== null && testRun.coverage !== undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Code Coverage</h2>
            <span className="text-2xl font-bold text-gray-900">{testRun.coverage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                testRun.coverage >= 80 ? 'bg-green-500' : testRun.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${testRun.coverage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Test Results / Logs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
        </div>

        {testRun.status === 'RUNNING' || testRun.status === 'PENDING' ? (
          <div className="px-6 py-12 text-center">
            <ClockIcon className="mx-auto w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {testRun.status === 'PENDING' ? 'Test Queued' : 'Tests Running...'}
            </h3>
            <p className="text-gray-600">
              {testRun.status === 'PENDING'
                ? 'Your tests are queued and will start shortly'
                : 'Please wait while your tests are being executed'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Success/Error Summary */}
            {testRun.status === 'FAILED' && testRun.errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-semibold text-red-900 mb-2">Error Message</h3>
                <p className="text-sm text-red-700 font-mono">{testRun.errorMessage}</p>
                {testRun.errorStack && (
                  <details className="mt-3">
                    <summary className="text-sm text-red-600 cursor-pointer hover:text-red-700">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-900 overflow-x-auto">
                      {testRun.errorStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Test Results Details */}
            {Object.keys(results).length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
                <pre className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 overflow-x-auto font-mono">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No detailed results available</p>
              </div>
            )}

            {/* Metadata */}
            {Object.keys(metadata).length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">{key}</span>
                      <p className="mt-1 text-sm text-gray-900">{JSON.stringify(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Environment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Environment:</span>
              <span className="text-sm font-medium text-gray-900">{testRun.environment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Branch:</span>
              <span className="text-sm font-medium text-gray-900">{testRun.branch}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timing</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Started At:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(testRun.startedAt).toLocaleString()}
              </span>
            </div>
            {testRun.finishedAt && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Finished At:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(testRun.finishedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Duration:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(testRun.duration)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
