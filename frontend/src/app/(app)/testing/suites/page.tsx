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
} from "@heroicons/react/24/outline"

interface TestSuite {
  id: string
  name: string
  description: string
  type: string
  totalTests: number
  lastRun?: Date
  status?: 'passed' | 'failed' | 'running' | 'pending'
  passRate?: number
}

export default function TestSuitesPage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    // Simulate loading - in real app, fetch from API
    const timer = setTimeout(() => {
      setTestSuites([])
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const filteredSuites = testSuites.filter((suite) => {
    const matchesSearch = suite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suite.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || suite.type === filterType
    return matchesSearch && matchesType
  })

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon className="w-4 h-4" />
      case 'failed': return <XCircleIcon className="w-4 h-4" />
      case 'running': return <ClockIcon className="w-4 h-4 animate-spin" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

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
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
              Test Suites
            </h1>
            <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
              Create and manage <span className="text-gray-700 font-medium">test collections</span> for your projects
            </p>
          </div>
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2"
            onClick={() => alert('Create Test Suite functionality coming soon!')}
          >
            <PlusIcon className="w-5 h-5" />
            Create Test Suite
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-purple-600" />
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
            <span className="text-sm font-medium text-gray-500">Passing</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testSuites.filter(s => s.status === 'passed').length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Failing</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testSuites.filter(s => s.status === 'failed').length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Running</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {testSuites.filter(s => s.status === 'running').length}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="unit">Unit Tests</option>
            <option value="integration">Integration Tests</option>
            <option value="e2e">E2E Tests</option>
            <option value="performance">Performance Tests</option>
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
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
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
                      href={`/testing/${suite.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                    >
                      {suite.name}
                    </Link>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {suite.type}
                    </span>
                    {suite.status && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          suite.status
                        )}`}
                      >
                        {getStatusIcon(suite.status)}
                        {suite.status}
                      </span>
                    )}
                  </div>

                  {suite.description && (
                    <p className="text-gray-600">{suite.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <BeakerIcon className="w-4 h-4" />
                      <span>{suite.totalTests} tests</span>
                    </div>
                    {suite.passRate !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Pass Rate:</span>
                        <span className={suite.passRate >= 80 ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                          {suite.passRate}%
                        </span>
                      </div>
                    )}
                    {suite.lastRun && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>Last run: {suite.lastRun.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/testing/${suite.id}`}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors ml-4"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
