"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BeakerIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface TestMetrics {
  period: string
  total: number
  passed: number
  failed: number
  skipped: number
  passRate: number
  coverage: number
  avgDuration: number
}

interface SuiteMetrics {
  name: string
  tests: number
  passRate: number
  coverage: number
  avgDuration: number
  trend: number
}

interface FailureAnalysis {
  testName: string
  suite: string
  failures: number
  lastFailure: string
  failureRate: number
}

interface CoverageByModule {
  module: string
  coverage: number
  lines: number
  covered: number
  trend: number
}

export default function TestAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [chartView, setChartView] = useState<"passRate" | "coverage">("passRate")

  // Historical test metrics
  const historicalMetrics: TestMetrics[] = [
    { period: "Week 1", total: 1742, passed: 1598, failed: 122, skipped: 22, passRate: 91.7, coverage: 76.2, avgDuration: 145 },
    { period: "Week 2", total: 1789, passed: 1652, failed: 115, skipped: 22, passRate: 92.3, coverage: 77.1, avgDuration: 142 },
    { period: "Week 3", total: 1812, passed: 1681, failed: 109, skipped: 22, passRate: 92.8, coverage: 77.8, avgDuration: 138 },
    { period: "Week 4", total: 1847, passed: 1703, failed: 122, skipped: 22, passRate: 92.2, coverage: 78.5, avgDuration: 135 },
  ]

  // Test suite performance
  const suiteMetrics: SuiteMetrics[] = [
    { name: "Auth Service", tests: 145, passRate: 97.2, coverage: 85.3, avgDuration: 23, trend: 2.1 },
    { name: "API Gateway", tests: 234, passRate: 95.7, coverage: 82.1, avgDuration: 45, trend: 1.5 },
    { name: "User Service", tests: 189, passRate: 93.1, coverage: 79.5, avgDuration: 34, trend: -1.2 },
    { name: "Pipeline Engine", tests: 312, passRate: 89.4, coverage: 76.8, avgDuration: 67, trend: -3.4 },
    { name: "Frontend Components", tests: 567, passRate: 94.5, coverage: 81.2, avgDuration: 89, trend: 0.8 },
    { name: "Integration Tests", tests: 400, passRate: 87.5, coverage: 72.3, avgDuration: 156, trend: -2.1 },
  ]

  // Flaky/failing tests
  const failureAnalysis: FailureAnalysis[] = [
    { testName: "should handle concurrent requests", suite: "API Gateway", failures: 15, lastFailure: "2h ago", failureRate: 12.3 },
    { testName: "should timeout on slow database", suite: "User Service", failures: 12, lastFailure: "5h ago", failureRate: 9.8 },
    { testName: "should deploy to staging", suite: "Pipeline Engine", failures: 10, lastFailure: "1d ago", failureRate: 8.2 },
    { testName: "should render with loading state", suite: "Frontend", failures: 8, lastFailure: "3h ago", failureRate: 6.5 },
    { testName: "should rollback on failure", suite: "Deployment", failures: 7, lastFailure: "12h ago", failureRate: 5.7 },
  ]

  // Coverage by module
  const coverageByModule: CoverageByModule[] = [
    { module: "src/auth/", coverage: 85.3, lines: 1245, covered: 1062, trend: 2.3 },
    { module: "src/api/", coverage: 82.1, lines: 2134, covered: 1752, trend: 1.1 },
    { module: "src/services/", coverage: 79.5, lines: 3456, covered: 2747, trend: -0.5 },
    { module: "src/utils/", coverage: 91.2, lines: 678, covered: 618, trend: 0.8 },
    { module: "src/components/", coverage: 81.2, lines: 4523, covered: 3673, trend: 1.9 },
    { module: "src/pipeline/", coverage: 76.8, lines: 2891, covered: 2220, trend: -2.1 },
  ]

  // Current metrics
  const currentMetrics = {
    total: 1847,
    passed: 1703,
    failed: 122,
    skipped: 22,
    passRate: 92.2,
    coverage: 78.5,
    avgDuration: 135, // seconds
    totalDuration: 249345, // seconds
    suites: 45,
    flakyTests: 23,
    trend: 3.1,
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const TrendIndicator = ({ value }: { value: number }) => {
    const isPositive = value > 0
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-4 w-4" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4" />
        )}
        {Math.abs(value)}%
      </div>
    )
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Exporting test analytics as ${format.toUpperCase()}...`)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/analytics/overview"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Analytics Overview
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BeakerIcon className="h-10 w-10 text-green-600" />
              Test Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test execution metrics, coverage trends, and failure analysis
            </p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Total Tests</div>
            <div className="text-3xl font-bold text-gray-900">{currentMetrics.total.toLocaleString()}</div>
            <div className="mt-2">
              <TrendIndicator value={currentMetrics.trend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Pass Rate</div>
            <div className="text-3xl font-bold text-green-600">{currentMetrics.passRate}%</div>
            <div className="text-xs text-gray-500 mt-2">{currentMetrics.passed} passed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Code Coverage</div>
            <div className="text-3xl font-bold text-blue-600">{currentMetrics.coverage}%</div>
            <div className="text-xs text-gray-500 mt-2">Overall coverage</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Failed Tests</div>
            <div className="text-3xl font-bold text-red-600">{currentMetrics.failed}</div>
            <div className="text-xs text-gray-500 mt-2">{currentMetrics.flakyTests} flaky</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Avg Duration</div>
            <div className="text-3xl font-bold text-purple-600">{formatDuration(currentMetrics.avgDuration)}</div>
            <div className="text-xs text-gray-500 mt-2">Per test run</div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Rate & Coverage Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Quality Trends</CardTitle>
              <CardDescription>Weekly test performance and coverage metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView("passRate")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  chartView === "passRate"
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pass Rate
              </button>
              <button
                onClick={() => setChartView("coverage")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  chartView === "coverage"
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Coverage
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartView === "passRate" ? (
              <div className="space-y-3">
                {historicalMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.period}</span>
                      <span className="text-sm font-medium text-green-600">{metric.passRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${metric.passRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{metric.passed} passed</span>
                      <span>{metric.failed} failed</span>
                      <span>{metric.total} total</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">Test Stability Improving</div>
                      <div className="text-sm text-green-700 mt-1">
                        Pass rate improved by 0.5% over the past 4 weeks, indicating better test quality and stability.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {historicalMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.period}</span>
                      <span className="text-sm font-medium text-blue-600">{metric.coverage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          metric.coverage >= 80 ? 'bg-green-500' :
                          metric.coverage >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${metric.coverage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Coverage Growth Trend</div>
                      <div className="text-sm text-blue-700 mt-1">
                        Code coverage increased by 2.3% over the past 4 weeks. Target: reach 80% coverage by next month.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Suite Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Test Suite Performance</CardTitle>
          <CardDescription>Performance breakdown by test suite</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suiteMetrics.map((suite, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{suite.name}</div>
                    <div className="text-sm text-gray-600">{suite.tests} tests</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Pass Rate</div>
                      <div className="font-medium text-green-600">{suite.passRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Coverage</div>
                      <div className="font-medium text-blue-600">{suite.coverage}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium text-purple-600">{formatDuration(suite.avgDuration)}</div>
                    </div>
                    <TrendIndicator value={suite.trend} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Pass Rate</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${suite.passRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Coverage</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          suite.coverage >= 80 ? 'bg-green-500' :
                          suite.coverage >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${suite.coverage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flaky/Failing Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Analysis</CardTitle>
          <CardDescription>Most frequently failing tests requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {failureAnalysis.map((test, index) => (
              <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{test.testName}</div>
                    <div className="text-sm text-gray-600 mt-1">Suite: {test.suite}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">{test.failures} failures</div>
                    <div className="text-xs text-gray-500 mt-1">Last: {test.lastFailure}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${test.failureRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-red-600">{test.failureRate}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900">Action Required</div>
                <div className="text-sm text-yellow-700 mt-1">
                  {failureAnalysis.length} tests have high failure rates ({">"}5%). Consider debugging these tests or marking them as flaky to prevent CI/CD blocking.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage by Module */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage by Module</CardTitle>
          <CardDescription>Code coverage breakdown across project modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coverageByModule.map((module, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{module.module}</div>
                    <div className="text-sm text-gray-600">{module.covered.toLocaleString()} / {module.lines.toLocaleString()} lines covered</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{module.coverage}%</div>
                    </div>
                    <TrendIndicator value={module.trend} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      module.coverage >= 85 ? 'bg-green-500' :
                      module.coverage >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${module.coverage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Coverage Recommendation</div>
                <div className="text-sm text-blue-700 mt-1">
                  Focus on improving coverage in src/pipeline/ (76.8%) and src/services/ (79.5%) to reach the 80% target.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Analytics</CardTitle>
          <CardDescription>Download test analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export as PDF
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
