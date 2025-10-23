"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface Alert {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'acknowledged' | 'resolved'
  service: string
  timestamp: Date
  resolvedAt?: Date
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("active")

  useEffect(() => {
    // Generate sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: '1',
        title: 'High CPU Usage Detected',
        description: 'CPU usage exceeded 90% threshold on api-gateway service',
        severity: 'critical',
        status: 'active',
        service: 'api-gateway',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: '2',
        title: 'Database Connection Pool Exhausted',
        description: 'Connection pool reached maximum capacity',
        severity: 'high',
        status: 'acknowledged',
        service: 'database',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: '3',
        title: 'Deployment Failed',
        description: 'Production deployment failed for project: web-app',
        severity: 'high',
        status: 'resolved',
        service: 'deployment-service',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        id: '4',
        title: 'Slow Response Time',
        description: 'API response time increased above 500ms',
        severity: 'medium',
        status: 'active',
        service: 'api-gateway',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: '5',
        title: 'Disk Space Warning',
        description: 'Disk usage reached 85% on /var partition',
        severity: 'medium',
        status: 'acknowledged',
        service: 'system',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
    ]

    setAlerts(sampleAlerts)
  }, [])

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter
    return matchesSeverity && matchesStatus
  })

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
    ))
  }

  const handleResolve = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'resolved' as const, resolvedAt: new Date() } : alert
    ))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800'
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'acknowledged':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
    }
  }

  const stats = {
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/monitoring"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Monitoring
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Alerts & Incidents
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage system alerts and incident responses
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <BellIcon className="h-4 w-4" />
            Configure Alerts
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.active}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acknowledged</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.acknowledged}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('acknowledged')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'acknowledged' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Acknowledged
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'resolved' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Resolved
              </button>
            </div>

            <div className="border-l border-gray-300 h-8 mx-2"></div>

            <div className="flex gap-2">
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  severityFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Severity
              </button>
              <button
                onClick={() => setSeverityFilter('critical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  severityFilter === 'critical' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setSeverityFilter('high')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  severityFilter === 'high' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setSeverityFilter('medium')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  severityFilter === 'medium' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Medium
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-gray-600 font-medium">No alerts found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {statusFilter === 'active' ? 'All systems operating normally' : 'No alerts match your filters'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(alert.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Service: <span className="font-medium text-gray-700">{alert.service}</span></span>
                        <span>•</span>
                        <span>Triggered: {alert.timestamp.toLocaleString()}</span>
                        {alert.resolvedAt && (
                          <>
                            <span>•</span>
                            <span>Resolved: {alert.resolvedAt.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  {alert.status === 'acknowledged' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
