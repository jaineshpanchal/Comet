"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  BeakerIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function AnalyticsOverviewPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(false)

  // Mock comprehensive analytics data
  const analytics = {
    pipelines: {
      total: 245,
      success: 198,
      failed: 32,
      running: 5,
      successRate: 80.8,
      avgDuration: 324, // seconds
      trend: 5.2, // percentage
    },
    tests: {
      total: 1847,
      passed: 1703,
      failed: 122,
      skipped: 22,
      passRate: 92.2,
      coverage: 78.5,
      trend: 3.1,
    },
    deployments: {
      total: 156,
      successful: 142,
      failed: 10,
      rolledBack: 4,
      successRate: 91.0,
      avgDuration: 187, // seconds
      trend: -2.3,
    },
    overall: {
      activeProjects: 12,
      totalCommits: 1523,
      totalPRs: 234,
      avgLeadTime: 2.4, // hours
    },
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/analytics"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Analytics
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Analytics Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Unified view of all platform metrics and performance
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

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Projects</span>
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.overall.activeProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Commits</span>
              <CloudArrowUpIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.overall.totalCommits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Pull Requests</span>
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.overall.totalPRs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Lead Time</span>
              <ClockIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.overall.avgLeadTime}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Pipeline Performance</CardTitle>
                <CardDescription>CI/CD pipeline execution metrics</CardDescription>
              </div>
            </div>
            <Link href="/analytics/pipelines" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Runs</span>
                <TrendIndicator value={analytics.pipelines.trend} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.pipelines.total}</div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-green-600">✓ {analytics.pipelines.success} success</span>
                <span className="text-red-600">✗ {analytics.pipelines.failed} failed</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{analytics.pipelines.successRate}%</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analytics.pipelines.successRate}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Avg Duration</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(analytics.pipelines.avgDuration)}
              </div>
              <div className="text-xs text-gray-500 mt-2">Per pipeline execution</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Currently Running</div>
              <div className="text-2xl font-bold text-orange-600">{analytics.pipelines.running}</div>
              <div className="flex items-center gap-1 mt-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </div>
                <span className="text-xs text-orange-600">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Test Performance</CardTitle>
                <CardDescription>Test execution and coverage metrics</CardDescription>
              </div>
            </div>
            <Link href="/analytics/tests" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Tests</span>
                <TrendIndicator value={analytics.tests.trend} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.tests.total.toLocaleString()}</div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-green-600">✓ {analytics.tests.passed} passed</span>
                <span className="text-red-600">✗ {analytics.tests.failed} failed</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Pass Rate</div>
              <div className="text-2xl font-bold text-green-600">{analytics.tests.passRate}%</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analytics.tests.passRate}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Code Coverage</div>
              <div className="text-2xl font-bold text-blue-600">{analytics.tests.coverage}%</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    analytics.tests.coverage >= 80 ? 'bg-green-500' :
                    analytics.tests.coverage >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${analytics.tests.coverage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Skipped</div>
              <div className="text-2xl font-bold text-gray-600">{analytics.tests.skipped}</div>
              <div className="text-xs text-gray-500 mt-2">Tests not executed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CloudArrowUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Deployment Performance</CardTitle>
                <CardDescription>Deployment success and frequency metrics</CardDescription>
              </div>
            </div>
            <Link href="/deployments/analytics" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Deployments</span>
                <TrendIndicator value={analytics.deployments.trend} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.deployments.total}</div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-green-600">✓ {analytics.deployments.successful} success</span>
                <span className="text-red-600">✗ {analytics.deployments.failed} failed</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{analytics.deployments.successRate}%</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analytics.deployments.successRate}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Avg Duration</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatDuration(analytics.deployments.avgDuration)}
              </div>
              <div className="text-xs text-gray-500 mt-2">Per deployment</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Rolled Back</div>
              <div className="text-2xl font-bold text-yellow-600">{analytics.deployments.rolledBack}</div>
              <div className="text-xs text-gray-500 mt-2">Failed deployments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access detailed analytics and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/analytics/pipelines"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <RocketLaunchIcon className="h-6 w-6 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Pipeline Analytics</div>
              <div className="text-xs text-gray-500 mt-1">Detailed pipeline metrics</div>
            </Link>

            <Link
              href="/analytics/tests"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <BeakerIcon className="h-6 w-6 text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Test Analytics</div>
              <div className="text-xs text-gray-500 mt-1">Test coverage and trends</div>
            </Link>

            <Link
              href="/deployments/analytics"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <CloudArrowUpIcon className="h-6 w-6 text-purple-600 mb-2" />
              <div className="font-medium text-gray-900">Deployment Analytics</div>
              <div className="text-xs text-gray-500 mt-1">Deployment frequency</div>
            </Link>

            <Link
              href="/analytics/reports"
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <ChartBarIcon className="h-6 w-6 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">Custom Reports</div>
              <div className="text-xs text-gray-500 mt-1">Build custom views</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
