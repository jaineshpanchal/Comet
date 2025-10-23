"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeftIcon, ChartBarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { DeploymentService, type Deployment } from "@/services/deployment.service"

export default function DeploymentAnalyticsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchDeployments()
  }, [])

  const fetchDeployments = async () => {
    try {
      setLoading(true)
      const data = await DeploymentService.getDeployments()
      setDeployments(data)
    } catch (error) {
      console.error('Error fetching deployments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date()
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    const filteredDeployments = deployments.filter(d =>
      new Date(d.deployedAt) >= startDate
    )

    const totalDeployments = filteredDeployments.length
    const successfulDeployments = filteredDeployments.filter(d => d.status === 'DEPLOYED').length
    const failedDeployments = filteredDeployments.filter(d => d.status === 'FAILED').length
    const rolledBackDeployments = filteredDeployments.filter(d => d.status === 'ROLLED_BACK').length

    const successRate = totalDeployments > 0
      ? ((successfulDeployments / totalDeployments) * 100).toFixed(1)
      : '0'

    const deploymentsByEnv = {
      development: filteredDeployments.filter(d => d.environment === 'development').length,
      staging: filteredDeployments.filter(d => d.environment === 'staging').length,
      production: filteredDeployments.filter(d => d.environment === 'production').length,
    }

    const durations = filteredDeployments
      .filter(d => d.duration)
      .map(d => d.duration!)

    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    // Calculate deployments per day
    const deploymentsByDay: { [key: string]: number } = {}
    filteredDeployments.forEach(d => {
      const date = new Date(d.deployedAt).toLocaleDateString()
      deploymentsByDay[date] = (deploymentsByDay[date] || 0) + 1
    })

    const deploymentsPerDay = Object.values(deploymentsByDay).length > 0
      ? (totalDeployments / Object.keys(deploymentsByDay).length).toFixed(1)
      : '0'

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      rolledBackDeployments,
      successRate,
      deploymentsByEnv,
      avgDuration,
      deploymentsPerDay,
      deploymentsByDay
    }
  }

  const metrics = calculateMetrics()

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/deployments"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Deployments
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Deployment Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track deployment trends and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-lg ${timeRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-lg ${timeRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-lg ${timeRange === '90d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Deployments</CardTitle>
            <CardDescription>All deployments in period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="text-4xl font-bold text-blue-600">{metrics.totalDeployments}</div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {metrics.deploymentsPerDay} per day avg
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Success Rate</CardTitle>
            <CardDescription>Successful deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="text-4xl font-bold text-green-600">{metrics.successRate}%</div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {metrics.successfulDeployments} successful
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Failed Deployments</CardTitle>
            <CardDescription>Deployment failures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="text-4xl font-bold text-red-600">{metrics.failedDeployments}</div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {metrics.rolledBackDeployments} rolled back
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avg Duration</CardTitle>
            <CardDescription>Average deployment time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-8 w-8 text-blue-600" />
              <div className="text-4xl font-bold text-blue-600">
                {formatDuration(metrics.avgDuration)}
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Based on {deployments.filter(d => d.duration).length} deployments
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Deployments by Environment</CardTitle>
          <CardDescription>Distribution across environments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.deploymentsByEnv).map(([env, count]) => {
              const percentage = metrics.totalDeployments > 0
                ? ((count / metrics.totalDeployments) * 100).toFixed(1)
                : '0'

              return (
                <div key={env}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{env}</span>
                    <span className="text-sm text-gray-600">{count} deployments ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        env === 'production' ? 'bg-red-500' :
                        env === 'staging' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Timeline</CardTitle>
          <CardDescription>Daily deployment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.deploymentsByDay)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .slice(0, 10)
              .map(([date, count]) => {
                const maxCount = Math.max(...Object.values(metrics.deploymentsByDay))
                const width = maxCount > 0 ? (count / maxCount) * 100 : 0

                return (
                  <div key={date} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600">{date}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${width}%` }}
                          >
                            {width > 20 && (
                              <span className="text-xs text-white font-medium">{count}</span>
                            )}
                          </div>
                        </div>
                        {width <= 20 && (
                          <span className="text-sm font-medium text-gray-700 w-8">{count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Deployments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
          <CardDescription>Last 10 deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deployments.slice(0, 10).map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    deployment.status === 'DEPLOYED' ? 'bg-green-500' :
                    deployment.status === 'FAILED' ? 'bg-red-500' :
                    deployment.status === 'ROLLED_BACK' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">
                      {deployment.project?.name} v{deployment.version}
                    </div>
                    <div className="text-sm text-gray-600">
                      {deployment.environment} • {new Date(deployment.deployedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {deployment.duration ? formatDuration(deployment.duration) : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
