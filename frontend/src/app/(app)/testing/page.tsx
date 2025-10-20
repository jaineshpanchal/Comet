"use client"

import { useState, useEffect } from "react"
import { BeakerIcon, CheckCircleIcon, ClockIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { TestService, type TestSuite, type TestRun } from "@/services/test.service"

export default function TestingPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSuites: 0,
    activeSuites: 0,
    totalRuns: 0,
    passedTests: 0,
    failedTests: 0,
    avgCoverage: 0
  })
  const [recentSuites, setRecentSuites] = useState<TestSuite[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const suites = await TestService.getTestSuites()

      // Calculate stats
      const totalSuites = suites.length
      const activeSuites = suites.filter(s => s.isActive).length

      // Get all test runs from recent suites
      let allRuns: TestRun[] = []
      for (const suite of suites.slice(0, 5)) {
        try {
          const runs = await TestService.getTestRuns(suite.id, 5)
          allRuns = [...allRuns, ...runs]
        } catch (error) {
          console.error(`Error fetching runs for suite ${suite.id}:`, error)
        }
      }

      const passedTests = allRuns.filter(r => r.status === 'PASSED').length
      const failedTests = allRuns.filter(r => r.status === 'FAILED').length

      const runsWithCoverage = allRuns.filter(r => r.coverage !== null && r.coverage !== undefined)
      const avgCoverage = runsWithCoverage.length > 0
        ? runsWithCoverage.reduce((sum, r) => sum + (r.coverage || 0), 0) / runsWithCoverage.length
        : 0

      setStats({
        totalSuites,
        activeSuites,
        totalRuns: allRuns.length,
        passedTests,
        failedTests,
        avgCoverage
      })

      setRecentSuites(suites.slice(0, 5))
    } catch (error) {
      console.error('Error fetching testing data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
            Testing
          </h1>
          <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
            Manage <span className="text-gray-700 font-medium">test suites</span>, view{" "}
            <span className="text-gray-700 font-medium">test results</span>, and track{" "}
            <span className="text-gray-700 font-medium">code coverage</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/testing/ai-generate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-sm"
          >
            <SparklesIcon className="w-5 h-5" />
            AI Generate Tests
          </Link>
          <Link
            href="/testing/suites/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Create Test Suite
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          href="/testing/suites"
          className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BeakerIcon className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Test Suites</h3>
              <p className="text-sm text-gray-500">{stats.activeSuites} active</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {loading ? "..." : stats.totalSuites}
          </div>
          <p className="text-xs text-gray-500">Total test suites</p>
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Passed</h3>
              <p className="text-sm text-gray-500">{stats.totalRuns} total runs</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {loading ? "..." : stats.passedTests}
          </div>
          <p className="text-xs text-gray-500">Passing tests</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <CheckCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Failed</h3>
              <p className="text-sm text-gray-500">Need attention</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {loading ? "..." : stats.failedTests}
          </div>
          <p className="text-xs text-gray-500">Failing tests</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <ClockIcon className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Coverage</h3>
              <p className="text-sm text-gray-500">Average</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {loading ? "..." : `${stats.avgCoverage.toFixed(1)}%`}
          </div>
          <p className="text-xs text-gray-500">Code coverage</p>
        </div>
      </div>

      {/* Recent Test Suites */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Test Suites</h2>
          <Link
            href="/testing/suites"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : recentSuites.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BeakerIcon className="mx-auto w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">No test suites yet</p>
              <Link
                href="/testing/suites/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create Your First Test Suite
              </Link>
            </div>
          ) : (
            recentSuites.map((suite) => (
              <Link
                key={suite.id}
                href={`/testing/suites/${suite.id}`}
                className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    suite.type === 'UNIT' ? 'bg-blue-100' :
                    suite.type === 'INTEGRATION' ? 'bg-purple-100' :
                    suite.type === 'E2E' ? 'bg-green-100' :
                    suite.type === 'PERFORMANCE' ? 'bg-orange-100' :
                    'bg-red-100'
                  }`}>
                    <BeakerIcon className={`w-5 h-5 ${
                      suite.type === 'UNIT' ? 'text-blue-600' :
                      suite.type === 'INTEGRATION' ? 'text-purple-600' :
                      suite.type === 'E2E' ? 'text-green-600' :
                      suite.type === 'PERFORMANCE' ? 'text-orange-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{suite.name}</h3>
                    <p className="text-sm text-gray-500">
                      {suite.type} • {suite.framework} • {suite.project?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    suite.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {suite.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/testing/suites"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all"
        >
          <BeakerIcon className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Test Suites</h3>
          <p className="text-sm text-gray-600">Create, edit, and organize your test suites</p>
        </Link>

        <Link
          href="/testing/results"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all"
        >
          <CheckCircleIcon className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Test Results</h3>
          <p className="text-sm text-gray-600">Check test execution history and results</p>
        </Link>

        <Link
          href="/testing/coverage"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all"
        >
          <ClockIcon className="w-8 h-8 text-cyan-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Coverage</h3>
          <p className="text-sm text-gray-600">Track and analyze code coverage metrics</p>
        </Link>
      </div>
    </div>
  )
}
