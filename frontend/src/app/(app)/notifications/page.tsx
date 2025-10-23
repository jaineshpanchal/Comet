"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BellIcon,
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  FunnelIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface Notification {
  id: string
  type: 'PIPELINE' | 'TEST' | 'DEPLOYMENT' | 'SECURITY' | 'ALERT' | 'SYSTEM'
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  metadata?: {
    projectName?: string
    pipelineId?: string
    testSuiteId?: string
    deploymentId?: string
    [key: string]: any
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "PIPELINE",
      severity: "ERROR",
      title: "Pipeline Failed",
      message: "Pipeline 'Production Deploy' failed at Build stage",
      timestamp: "2 minutes ago",
      read: false,
      actionUrl: "/pipelines/run-123",
      metadata: { projectName: "API Gateway", pipelineId: "run-123" }
    },
    {
      id: "2",
      type: "SECURITY",
      severity: "CRITICAL",
      title: "Critical Security Vulnerability Detected",
      message: "SQL Injection vulnerability found in user authentication module",
      timestamp: "15 minutes ago",
      read: false,
      actionUrl: "/security",
      metadata: { projectName: "Backend Services" }
    },
    {
      id: "3",
      type: "TEST",
      severity: "WARNING",
      title: "Test Suite Has Flaky Tests",
      message: "5 tests in 'API Integration Tests' are showing inconsistent results",
      timestamp: "1 hour ago",
      read: false,
      actionUrl: "/testing/suites/suite-456",
      metadata: { projectName: "API Gateway", testSuiteId: "suite-456" }
    },
    {
      id: "4",
      type: "DEPLOYMENT",
      severity: "SUCCESS",
      title: "Deployment Completed Successfully",
      message: "v2.5.0 deployed to production environment",
      timestamp: "2 hours ago",
      read: true,
      actionUrl: "/deployments/dep-789",
      metadata: { projectName: "Frontend", deploymentId: "dep-789" }
    },
    {
      id: "5",
      type: "ALERT",
      severity: "WARNING",
      title: "Code Coverage Below Threshold",
      message: "Code coverage dropped to 72% (threshold: 75%)",
      timestamp: "3 hours ago",
      read: true,
      actionUrl: "/analytics/tests",
      metadata: { projectName: "User Service" }
    },
    {
      id: "6",
      type: "PIPELINE",
      severity: "SUCCESS",
      title: "Pipeline Completed",
      message: "Pipeline 'Staging Deploy' completed successfully",
      timestamp: "4 hours ago",
      read: true,
      actionUrl: "/pipelines/run-124",
      metadata: { projectName: "Pipeline Service", pipelineId: "run-124" }
    },
    {
      id: "7",
      type: "SECURITY",
      severity: "WARNING",
      title: "Dependency Vulnerability Found",
      message: "Express.js has a known vulnerability (CVE-2024-1234)",
      timestamp: "5 hours ago",
      read: true,
      actionUrl: "/security/dependencies",
      metadata: { projectName: "Multiple Projects" }
    },
    {
      id: "8",
      type: "TEST",
      severity: "ERROR",
      title: "Test Run Failed",
      message: "12 tests failed in 'E2E Test Suite'",
      timestamp: "6 hours ago",
      read: true,
      actionUrl: "/testing/runs/run-567",
      metadata: { projectName: "Frontend", testSuiteId: "suite-789" }
    },
    {
      id: "9",
      type: "SYSTEM",
      severity: "INFO",
      title: "System Maintenance Scheduled",
      message: "Scheduled maintenance on Sunday 2 AM - 4 AM EST",
      timestamp: "1 day ago",
      read: true,
      actionUrl: undefined
    },
    {
      id: "10",
      type: "ALERT",
      severity: "ERROR",
      title: "High Memory Usage Detected",
      message: "API Gateway service using 92% memory",
      timestamp: "1 day ago",
      read: true,
      actionUrl: "/monitoring/metrics",
      metadata: { projectName: "API Gateway" }
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setNotifications(mockNotifications)
      setFilteredNotifications(mockNotifications)
      setLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    let filtered = notifications

    if (filterType !== "all") {
      filtered = filtered.filter(n => n.type === filterType.toUpperCase())
    }

    if (filterStatus === "unread") {
      filtered = filtered.filter(n => !n.read)
    } else if (filterStatus === "read") {
      filtered = filtered.filter(n => n.read)
    }

    setFilteredNotifications(filtered)
  }, [filterType, filterStatus, notifications])

  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.severity === 'CRITICAL' && !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-purple-50 border-blue-200'
      case 'ERROR': return 'bg-red-50 border-red-200'
      case 'WARNING': return 'bg-orange-50 border-orange-200'
      case 'SUCCESS': return 'bg-green-50 border-green-200'
      case 'INFO': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <BellAlertIcon className="h-5 w-5 text-blue-600" />
      case 'ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'WARNING':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
      case 'SUCCESS':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'INFO':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PIPELINE': return 'text-blue-700 bg-blue-100'
      case 'TEST': return 'text-green-700 bg-green-100'
      case 'DEPLOYMENT': return 'text-blue-700 bg-purple-100'
      case 'SECURITY': return 'text-red-700 bg-red-100'
      case 'ALERT': return 'text-orange-700 bg-orange-100'
      case 'SYSTEM': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stay updated with real-time alerts and notifications
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/notifications/preferences"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Preferences
          </Link>
          <Link
            href="/notifications/alerts"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200"
          >
            Alert Rules
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Unread Notifications</div>
                <div className="text-3xl font-bold text-blue-600">{unreadCount}</div>
              </div>
              <BellIcon className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Critical Alerts</div>
                <div className="text-3xl font-bold text-blue-600">{criticalCount}</div>
              </div>
              <BellAlertIcon className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Total Notifications</div>
                <div className="text-3xl font-bold text-gray-900">{notifications.length}</div>
              </div>
              <InformationCircleIcon className="h-12 w-12 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="test">Test</option>
                  <option value="deployment">Deployment</option>
                  <option value="security">Security</option>
                  <option value="alert">Alert</option>
                  <option value="system">System</option>
                </select>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
                Mark All as Read
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
          <CardDescription>Recent notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>No notifications found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-all ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  } ${getSeverityColor(notification.severity)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {notification.timestamp}
                          </span>
                          {notification.metadata?.projectName && (
                            <span>Project: {notification.metadata.projectName}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </Link>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
