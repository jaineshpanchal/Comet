"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BeakerIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"
import { TestService, type TestSuite } from "@/services/test.service"

export default function TestSuitesPage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchTestSuites()
  }, [])

  const fetchTestSuites = async () => {
    try {
      setLoading(true)
      const suites = await TestService.getTestSuites()
      setTestSuites(suites)
    } catch (error) {
      console.error('Error fetching test suites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRunTest = async (suiteId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await TestService.runTestSuite(suiteId)
      alert('Test suite execution started!')
      await fetchTestSuites() // Refresh the list
    } catch (error) {
      console.error('Error running test suite:', error)
      alert('Failed to start test execution')
    }
  }

  const filteredSuites = testSuites.filter((suite) => {
    const matchesSearch = suite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suite.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || suite.type.toLowerCase() === filterType.toLowerCase()
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && suite.isActive) ||
                         (statusFilter === "inactive" && !suite.isActive)
    return matchesSearch && matchesType && matchesStatus
  })



  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/testing"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Testing
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Test Suites
            </h1>
            <p className="text-sm font-normal text-gray-500 tracking-wide">
              Create and manage <span className="text-gray-700 font-medium">test collections</span> for your projects
            </p>
          </div>
          <Link
            href="/testing/suites/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold  focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Test Suite
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Suites</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{testSuites.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testSuites.filter(s => s.isActive).length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Inactive</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testSuites.filter(s => !s.isActive).length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Runs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testSuites.reduce((acc, s) => acc + (s._count?.testRuns || 0), 0)}
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
                placeholder="Search test suites..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="UNIT">Unit Tests</option>
            <option value="INTEGRATION">Integration Tests</option>
            <option value="E2E">E2E Tests</option>
            <option value="PERFORMANCE">Performance Tests</option>
            <option value="SECURITY">Security Tests</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Test Suites List */}
      {filteredSuites.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BeakerIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Test Suites Yet</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first test suite"}
          </p>
          <button
            onClick={() => alert('Create Test Suite functionality coming soon!')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold  transition-all inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Your First Test Suite
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuites.map((suite) => (
            <div
              key={suite.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/testing/suites/${suite.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {suite.name}
                    </Link>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-blue-700 rounded-full font-medium">
                      {suite.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      suite.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {suite.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {suite.description && (
                    <p className="text-gray-600">{suite.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <BeakerIcon className="w-4 h-4" />
                      <span>Framework: <span className="font-medium text-gray-700">{suite.framework}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Project: <span className="font-medium text-gray-700">{suite.project?.name}</span></span>
                    </div>
                    {suite._count && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span><span className="font-medium text-gray-700">{suite._count.testRuns}</span> runs</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={(e) => handleRunTest(suite.id, e)}
                    disabled={!suite.isActive}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      suite.isActive
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={suite.isActive ? 'Run tests' : 'Test suite is inactive'}
                  >
                    <PlayIcon className="w-4 h-4" />
                    Run
                  </button>
                  <Link
                    href={`/testing/suites/${suite.id}`}
                    className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
