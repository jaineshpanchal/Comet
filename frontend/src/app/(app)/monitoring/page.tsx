"use client"

import { useState } from "react"
import {
  EyeIcon,
  CpuChipIcon,
  ServerIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { useRealTimeMetrics } from "@/hooks/useRealTimeMetrics"
import { RealTimeIndicator } from "@/components/RealTimeIndicator"

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState("24h")
  const { metrics, loading, lastUpdate, isConnected } = useRealTimeMetrics('monitoring')
  const [activeAlerts] = useState(0)

  // Default metrics if not loaded yet
  const displayMetrics = metrics || {
    totalProjects: 0,
    activePipelines: 0,
    pipelineSuccessRate: 0,
    testPassRate: 0,
    deploymentSuccessRate: 0,
    avgPipelineDuration: 0,
    uptime: 0,
    responseTime: 0,
    errorRate: 0,
  }

  const timeRanges = [
    { value: "1h", label: "1h" },
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
  ]

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    unit = "",
    change,
    status = "healthy",
  }: {
    icon: any
    label: string
    value: number | string
    unit?: string
    change?: string
    status?: "healthy" | "warning" | "critical"
  }) => {
    const statusColors = {
      healthy: "bg-green-50 text-green-700 border-green-200",
      warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
      critical: "bg-red-50 text-red-700 border-red-200",
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">{label}</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}
          >
            {status}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">
            {value}
            {unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        {change && (
          <p className="text-sm text-red-600 mt-2">{change}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
            Monitoring
          </h1>
          <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
            Real-time system monitoring and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RealTimeIndicator lastUpdate={lastUpdate} />
          <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2">
            <CpuChipIcon className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Time Range Tabs */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 w-fit">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              timeRange === range.value
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon={ServerIcon}
          label="Total Projects"
          value={displayMetrics.totalProjects}
          change="0% vs last 24h"
          status="healthy"
        />
        <MetricCard
          icon={CpuChipIcon}
          label="Active Pipelines"
          value={displayMetrics.activePipelines}
          change="0% vs last 24h"
          status="healthy"
        />
        <MetricCard
          icon={CheckCircleIcon}
          label="Pipeline Success Rate"
          value={displayMetrics.pipelineSuccessRate}
          unit="%"
          change="0% vs last 24h"
          status="healthy"
        />
        <MetricCard
          icon={CheckCircleIcon}
          label="Test Pass Rate"
          value={displayMetrics.testPassRate}
          unit="%"
          change="0% vs last 24h"
          status="healthy"
        />
        <MetricCard
          icon={CheckCircleIcon}
          label="Deployment Success Rate"
          value={displayMetrics.deploymentSuccessRate}
          unit="%"
          change="0% vs last 24h"
          status="healthy"
        />
        <MetricCard
          icon={ClockIcon}
          label="Avg Pipeline Duration"
          value={displayMetrics.avgPipelineDuration}
          unit="s"
          change="0% vs last 24h"
          status="healthy"
        />
      </div>

      {/* System Health Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          System Health Overview
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Current status of all system components
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ServerIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System</h3>
                <p className="text-sm text-gray-500">
                  {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <div className="text-right">
                <p className="text-gray-500">Uptime</p>
                <p className="font-semibold text-gray-900">{displayMetrics.uptime}%</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Response</p>
                <p className="font-semibold text-gray-900">{displayMetrics.responseTime}ms</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Error Rate</p>
                <p className="font-semibold text-gray-900">{displayMetrics.errorRate}%</p>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                healthy
              </span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <EyeIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
            <p className="text-sm text-gray-500">Recent alerts and notifications</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            {activeAlerts} Active
          </span>
        </div>

        {activeAlerts === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto w-12 h-12 text-green-500 mb-4" />
            <p className="text-gray-600 font-medium">No active alerts</p>
            <p className="text-sm text-gray-500 mt-1">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alert items would go here */}
          </div>
        )}
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 text-center">
        <CpuChipIcon className="mx-auto w-16 h-16 text-blue-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Advanced Monitoring Coming Soon
        </h3>
        <p className="text-gray-600 mb-6">
          Real-time metrics, custom dashboards, and alerting integrations
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/monitoring/metrics"
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all"
          >
            System Metrics
          </a>
          <a
            href="/monitoring/logs"
            className="px-6 py-3 bg-white text-purple-600 border border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all"
          >
            Application Logs
          </a>
          <a
            href="/monitoring/alerts"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Alerts & Incidents
          </a>
        </div>
      </div>
    </div>
  )
}
