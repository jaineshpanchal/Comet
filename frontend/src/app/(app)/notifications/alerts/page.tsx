"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BellAlertIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface AlertRule {
  id: string
  name: string
  description: string
  type: 'PIPELINE' | 'TEST' | 'DEPLOYMENT' | 'SECURITY' | 'PERFORMANCE'
  condition: string
  threshold: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  channels: string[]
  enabled: boolean
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: "1",
      name: "Pipeline Failure Alert",
      description: "Notify when any pipeline fails",
      type: "PIPELINE",
      condition: "status == 'FAILED'",
      threshold: "immediate",
      severity: "ERROR",
      channels: ["email", "slack"],
      enabled: true,
      createdAt: "2024-01-15",
      lastTriggered: "2 hours ago",
      triggerCount: 12
    },
    {
      id: "2",
      name: "Critical Security Vulnerability",
      description: "Alert on critical security issues",
      type: "SECURITY",
      condition: "severity == 'CRITICAL'",
      threshold: "immediate",
      severity: "CRITICAL",
      channels: ["email", "slack", "pagerduty"],
      enabled: true,
      createdAt: "2024-01-10",
      lastTriggered: "15 minutes ago",
      triggerCount: 3
    },
    {
      id: "3",
      name: "Test Coverage Below Threshold",
      description: "Alert when code coverage drops below 75%",
      type: "TEST",
      condition: "coverage < 75%",
      threshold: "75%",
      severity: "WARNING",
      channels: ["email"],
      enabled: true,
      createdAt: "2024-01-12",
      lastTriggered: "3 hours ago",
      triggerCount: 5
    },
    {
      id: "4",
      name: "Deployment Rollback",
      description: "Notify when deployment is rolled back",
      type: "DEPLOYMENT",
      condition: "action == 'ROLLBACK'",
      threshold: "immediate",
      severity: "ERROR",
      channels: ["email", "slack"],
      enabled: true,
      createdAt: "2024-01-08",
      lastTriggered: "1 day ago",
      triggerCount: 2
    },
    {
      id: "5",
      name: "High Memory Usage",
      description: "Alert when service memory usage exceeds 90%",
      type: "PERFORMANCE",
      condition: "memory > 90%",
      threshold: "90%",
      severity: "WARNING",
      channels: ["slack"],
      enabled: false,
      createdAt: "2024-01-05",
      lastTriggered: "1 day ago",
      triggerCount: 8
    },
    {
      id: "6",
      name: "Pipeline Duration Exceeded",
      description: "Alert when pipeline takes longer than expected",
      type: "PIPELINE",
      condition: "duration > 30min",
      threshold: "30 minutes",
      severity: "INFO",
      channels: ["email"],
      enabled: true,
      createdAt: "2024-01-03",
      lastTriggered: "5 hours ago",
      triggerCount: 15
    }
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)

  const toggleRule = (id: string) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const deleteRule = (id: string) => {
    if (confirm("Are you sure you want to delete this alert rule?")) {
      setRules(rules.filter(rule => rule.id !== id))
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-blue-700 bg-purple-100'
      case 'ERROR': return 'text-red-700 bg-red-100'
      case 'WARNING': return 'text-orange-700 bg-orange-100'
      case 'INFO': return 'text-blue-700 bg-blue-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PIPELINE': return 'text-blue-700 bg-blue-100'
      case 'TEST': return 'text-green-700 bg-green-100'
      case 'DEPLOYMENT': return 'text-blue-700 bg-purple-100'
      case 'SECURITY': return 'text-red-700 bg-red-100'
      case 'PERFORMANCE': return 'text-orange-700 bg-orange-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '=�'
      case 'slack': return '=�'
      case 'pagerduty': return '=�'
      case 'webhook': return '='
      default: return '='
    }
  }

  const enabledCount = rules.filter(r => r.enabled).length
  const totalTriggered = rules.reduce((sum, r) => sum + r.triggerCount, 0)

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/notifications"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Notifications
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Alert Rules
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure custom alert rules and notification triggers
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create New Rule
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Total Rules</div>
                <div className="text-3xl font-bold text-gray-900">{rules.length}</div>
              </div>
              <BellAlertIcon className="h-12 w-12 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Active Rules</div>
                <div className="text-3xl font-bold text-green-600">{enabledCount}</div>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Total Triggers</div>
                <div className="text-3xl font-bold text-orange-600">{totalTriggered}</div>
              </div>
              <ClockIcon className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Alert Rules</CardTitle>
          <CardDescription>Manage your alert rules and notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 transition-all ${
                  rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(rule.type)}`}>
                        {rule.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                        {rule.severity}
                      </span>
                      {rule.enabled ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rule.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                      <span>
                        <strong>Condition:</strong> {rule.condition}
                      </span>
                      <span>
                        <strong>Threshold:</strong> {rule.threshold}
                      </span>
                      <span>
                        <strong>Channels:</strong> {rule.channels.map(c => getChannelIcon(c)).join(' ')} {rule.channels.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>Created: {rule.createdAt}</span>
                      {rule.lastTriggered && (
                        <span>Last triggered: {rule.lastTriggered}</span>
                      )}
                      <span>Triggered {rule.triggerCount} times</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        rule.enabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit rule"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete rule"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Rule Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Alert Rule</CardTitle>
              <CardDescription>Configure a new alert rule for notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    placeholder="e.g., High CPU Usage Alert"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe when this rule should trigger"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                      <option>Pipeline</option>
                      <option>Test</option>
                      <option>Deployment</option>
                      <option>Security</option>
                      <option>Performance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                      <option>Critical</option>
                      <option>Error</option>
                      <option>Warning</option>
                      <option>Info</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Channels</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Slack</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">PagerDuty</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert("Alert rule created!")
                      setShowCreateModal(false)
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Create Rule
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
