"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface PipelineMetrics {
  period: string
  total: number
  success: number
  failed: number
  successRate: number
  avgDuration: number
}

interface StageMetrics {
  name: string
  avgDuration: number
  successRate: number
  failures: number
}

interface FailurePattern {
  error: string
  count: number
  percentage: number
  trend: number
}

export default function PipelineAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(false)
  const [chartView, setChartView] = useState<"success" | "duration">("success")

  // Mock historical data for trends
  const historicalMetrics: PipelineMetrics[] = [
    { period: "Week 1", total: 58, success: 45, failed: 13, successRate: 77.6, avgDuration: 342 },
    { period: "Week 2", total: 62, success: 51, failed: 11, successRate: 82.3, avgDuration: 328 },
    { period: "Week 3", total: 59, success: 48, failed: 11, successRate: 81.4, avgDuration: 315 },
    { period: "Week 4", total: 66, success: 54, failed: 12, successRate: 81.8, avgDuration: 309 },
  ]

  // Stage performance breakdown
  const stageMetrics: StageMetrics[] = [
    { name: "Build", avgDuration: 45, successRate: 95.2, failures: 12 },
    { name: "Unit Tests", avgDuration: 32, successRate: 93.8, failures: 15 },
    { name: "Integration Tests", avgDuration: 78, successRate: 88.5, failures: 28 },
    { name: "Security Scan", avgDuration: 54, successRate: 91.2, failures: 21 },
    { name: "Deploy", avgDuration: 115, successRate: 96.7, failures: 8 },
  ]

  // Common failure patterns
  const failurePatterns: FailurePattern[] = [
    { error: "Dependency installation failed", count: 18, percentage: 28.1, trend: -5.2 },
    { error: "Test timeout exceeded", count: 12, percentage: 18.8, trend: 3.4 },
    { error: "Build compilation error", count: 10, percentage: 15.6, trend: -2.1 },
    { error: "Deployment connection failed", count: 8, percentage: 12.5, trend: 1.2 },
    { error: "Memory limit exceeded", count: 6, percentage: 9.4, trend: -8.3 },
    { error: "Other errors", count: 10, percentage: 15.6, trend: 0.0 },
  ]

  // Current period summary
  const currentMetrics = {
    total: 245,
    success: 198,
    failed: 32,
    running: 5,
    pending: 10,
    successRate: 80.8,
    avgDuration: 324,
    medianDuration: 298,
    p95Duration: 542,
    totalDuration: 79380, // seconds
    trend: 5.2,
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
    alert(`Exporting pipeline analytics as ${format.toUpperCase()}...`)
    // In production, this would generate and download the file
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
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Pipeline Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Detailed insights into pipeline performance and trends
            </p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
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
            <div className="text-sm text-gray-600 mb-2">Total Runs</div>
            <div className="text-3xl font-bold text-gray-900">{currentMetrics.total}</div>
            <div className="mt-2">
              <TrendIndicator value={currentMetrics.trend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Success Rate</div>
            <div className="text-3xl font-bold text-green-600">{currentMetrics.successRate}%</div>
            <div className="text-xs text-gray-500 mt-2">{currentMetrics.success} successful</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Avg Duration</div>
            <div className="text-3xl font-bold text-blue-600">{formatDuration(currentMetrics.avgDuration)}</div>
            <div className="text-xs text-gray-500 mt-2">Median: {formatDuration(currentMetrics.medianDuration)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Failed Runs</div>
            <div className="text-3xl font-bold text-red-600">{currentMetrics.failed}</div>
            <div className="text-xs text-gray-500 mt-2">{((currentMetrics.failed / currentMetrics.total) * 100).toFixed(1)}% failure rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-2">Total Time</div>
            <div className="text-3xl font-bold text-blue-600">{formatTotalTime(currentMetrics.totalDuration)}</div>
            <div className="text-xs text-gray-500 mt-2">Compute hours used</div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate & Duration Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Weekly pipeline performance over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView("success")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  chartView === "success"
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Success Rate
              </button>
              <button
                onClick={() => setChartView("duration")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  chartView === "duration"
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Duration
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartView === "success" ? (
              <div className="space-y-3">
                {historicalMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.period}</span>
                      <span className="text-sm font-medium text-green-600">{metric.successRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${metric.successRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{metric.success} success</span>
                      <span>{metric.failed} failed</span>
                      <span>{metric.total} total</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {historicalMetrics.map((metric, index) => {
                  const maxDuration = Math.max(...historicalMetrics.map(m => m.avgDuration))
                  const percentage = (metric.avgDuration / maxDuration) * 100
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{metric.period}</span>
                        <span className="text-sm font-medium text-blue-600">{formatDuration(metric.avgDuration)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ArrowTrendingDownIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Duration Improvement Detected</div>
                      <div className="text-sm text-blue-700 mt-1">
                        Average pipeline duration decreased by 9.6% over the past 4 weeks.
                        Consider applying similar optimizations to other projects.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Performance Breakdown</CardTitle>
          <CardDescription>Performance metrics for each pipeline stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageMetrics.map((stage, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-gray-900">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Avg Duration</div>
                      <div className="font-medium text-blue-600">{formatDuration(stage.avgDuration)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="font-medium text-green-600">{stage.successRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Failures</div>
                      <div className="font-medium text-red-600">{stage.failures}</div>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stage.successRate >= 95 ? 'bg-green-500' :
                      stage.successRate >= 90 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${stage.successRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failure Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Failure Pattern Analysis</CardTitle>
              <CardDescription>Most common pipeline failure reasons</CardDescription>
            </div>
            <FunnelIcon className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {failurePatterns.map((pattern, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{pattern.error}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {pattern.count} occurrences ({pattern.percentage}% of failures)
                    </div>
                  </div>
                  <TrendIndicator value={pattern.trend} />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${pattern.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900">Optimization Recommendation</div>
                <div className="text-sm text-yellow-700 mt-1">
                  The top 3 failure patterns account for 62.5% of all failures.
                  Consider adding retry logic for dependency installation and increasing timeout limits for tests.
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
          <CardDescription>Download pipeline analytics data</CardDescription>
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
