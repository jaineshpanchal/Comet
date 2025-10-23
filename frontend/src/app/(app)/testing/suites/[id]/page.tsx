"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BeakerIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline"
import { TestService, type TestSuite, type TestRun } from "@/services/test.service"

export default function TestSuiteDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const suiteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [suite, setSuite] = useState<TestSuite | null>(null)
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [runningTest, setRunningTest] = useState(false)

  useEffect(() => {
    if (suiteId) {
      fetchSuiteDetails()
      fetchTestRuns()
    }
  }, [suiteId])

  const fetchSuiteDetails = async () => {
    try {
      setLoading(true)
      const data = await TestService.getTestSuiteById(suiteId)
      setSuite(data)
    } catch (error) {
      console.error('Error fetching test suite:', error)
      alert('Failed to load test suite details')
    } finally {
      setLoading(false)
    }
  }

  const fetchTestRuns = async () => {
    try {
      const runs = await TestService.getTestRuns(suiteId, 20)
      setTestRuns(runs)
    } catch (error) {
      console.error('Error fetching test runs:', error)
    }
  }

  const handleRunTest = async () => {
    try {
      setRunningTest(true)
      await TestService.runTestSuite(suiteId)
      alert('Test execution started!')
      // Refresh test runs after a short delay
      setTimeout(() => {
        fetchTestRuns()
      }, 1000)
    } catch (error) {
      console.error('Error running test:', error)
      alert('Failed to start test execution')
    } finally {
      setRunningTest(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test suite? This action cannot be undone.')) {
      return
    }

    try {
      await TestService.deleteTestSuite(suiteId)
      alert('Test suite deleted successfully')
      router.push('/testing/suites')
    } catch (error) {
      console.error('Error deleting test suite:', error)
      alert('Failed to delete test suite')
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
        return <CheckCircleIcon className="w-5 h-5" />
      case 'FAILED':
        return <XCircleIcon className="w-5 h-5" />
      case 'RUNNING':
        return <ClockIcon className="w-5 h-5 animate-spin" />
      default:
        return <ClockIcon className="w-5 h-5" />
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading test suite...</p>
        </div>
      </div>
    )
  }

  if (!suite) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BeakerIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Test Suite Not Found</h2>
          <p className="text-gray-600 mb-6">The test suite you're looking for doesn't exist.</p>
          <Link
            href="/testing/suites"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Test Suites
          </Link>
        </div>
      </div>
    )
  }

  const testFiles = suite.testFiles ? (Array.isArray(suite.testFiles) ? suite.testFiles : JSON.parse(suite.testFiles as any)) : []
  const configuration = suite.configuration || {}

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/testing/suites"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">{suite.name}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                suite.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {suite.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-blue-700">
                {suite.type}
              </span>
            </div>
            {suite.description && (
              <p className="text-gray-600 mt-1">{suite.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>Framework: <span className="font-medium text-gray-700">{suite.framework}</span></span>
              <span>"</span>
              <span>Project: <span className="font-medium text-gray-700">{suite.project?.name}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTest}
            disabled={!suite.isActive || runningTest}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              suite.isActive && !runningTest
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PlayIcon className="w-5 h-5" />
            {runningTest ? 'Running...' : 'Run Tests'}
          </button>
          <Link
            href={`/testing/suites/${suite.id}/edit`}
            className="p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Total Runs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{testRuns.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Passed</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {testRuns.filter(r => r.status === 'PASSED').length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircleIcon className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-500">Failed</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {testRuns.filter(r => r.status === 'FAILED').length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Avg Duration</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testRuns.length > 0
              ? formatDuration(
                  Math.round(
                    testRuns.filter(r => r.duration).reduce((acc, r) => acc + (r.duration || 0), 0) / testRuns.filter(r => r.duration).length
                  )
                )
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Configuration & Test Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Files */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Files</h2>
          {testFiles.length > 0 ? (
            <div className="space-y-2">
              {testFiles.map((file: string, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm text-gray-700">{file}</code>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No test files specified</p>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
          {Object.keys(configuration).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(configuration).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{key}</span>
                  <span className="text-sm text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No configuration specified</p>
          )}
        </div>
      </div>

      {/* Test Run History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Test Run History</h2>
        </div>

        {testRuns.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ClockIcon className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">No test runs yet</p>
            <button
              onClick={handleRunTest}
              disabled={!suite.isActive}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                suite.isActive
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PlayIcon className="w-5 h-5" />
              Run First Test
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {testRuns.map((run) => (
              <Link
                key={run.id}
                href={`/testing/runs/${run.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(run.status)}`}>
                      {getStatusIcon(run.status)}
                      {run.status}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          {new Date(run.startedAt).toLocaleString()}
                        </span>
                        <span className="text-gray-400">"</span>
                        <span className="text-gray-700">
                          {run.totalTests} tests
                        </span>
                        {run.status === 'PASSED' || run.status === 'FAILED' ? (
                          <>
                            <span className="text-gray-400">"</span>
                            <span className="text-green-600 font-medium">
                              {run.passedTests} passed
                            </span>
                            {run.failedTests > 0 && (
                              <>
                                <span className="text-gray-400">"</span>
                                <span className="text-red-600 font-medium">
                                  {run.failedTests} failed
                                </span>
                              </>
                            )}
                          </>
                        ) : null}
                        {run.duration && (
                          <>
                            <span className="text-gray-400">"</span>
                            <span className="text-gray-500">
                              {formatDuration(run.duration)}
                            </span>
                          </>
                        )}
                      </div>
                      {run.coverage !== null && run.coverage !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Coverage:</span>
                            <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  run.coverage >= 80 ? 'bg-green-500' : run.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${run.coverage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{run.coverage.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    {run.triggeredByUser && (
                      <span>by {run.triggeredByUser.firstName} {run.triggeredByUser.lastName}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
