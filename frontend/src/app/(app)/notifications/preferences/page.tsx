"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'slack' | 'sms' | 'webhook'
  icon: any
  enabled: boolean
  config: {
    [key: string]: string
  }
}

interface NotificationPreference {
  category: string
  description: string
  email: boolean
  slack: boolean
  sms: boolean
  webhook: boolean
}

export default function NotificationPreferencesPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: "1",
      name: "Email",
      type: "email",
      icon: EnvelopeIcon,
      enabled: true,
      config: { address: "user@company.com" }
    },
    {
      id: "2",
      name: "Slack",
      type: "slack",
      icon: ChatBubbleLeftIcon,
      enabled: true,
      config: { workspace: "my-workspace", channel: "#devops-alerts" }
    },
    {
      id: "3",
      name: "SMS",
      type: "sms",
      icon: DevicePhoneMobileIcon,
      enabled: false,
      config: { phone: "+1-555-0123" }
    },
    {
      id: "4",
      name: "Webhook",
      type: "webhook",
      icon: GlobeAltIcon,
      enabled: false,
      config: { url: "https://api.example.com/webhooks/notifications" }
    }
  ])

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      category: "Pipeline Events",
      description: "Notifications about pipeline starts, completions, and failures",
      email: true,
      slack: true,
      sms: false,
      webhook: false
    },
    {
      category: "Test Results",
      description: "Notifications about test suite executions and failures",
      email: true,
      slack: false,
      sms: false,
      webhook: false
    },
    {
      category: "Deployment Updates",
      description: "Notifications about deployment status and rollbacks",
      email: true,
      slack: true,
      sms: true,
      webhook: false
    },
    {
      category: "Security Alerts",
      description: "Critical security vulnerabilities and threats",
      email: true,
      slack: true,
      sms: true,
      webhook: true
    },
    {
      category: "Performance Alerts",
      description: "System performance issues and resource usage warnings",
      email: false,
      slack: true,
      sms: false,
      webhook: false
    },
    {
      category: "Code Quality",
      description: "Code coverage and quality metric alerts",
      email: true,
      slack: false,
      sms: false,
      webhook: false
    },
    {
      category: "System Maintenance",
      description: "Scheduled maintenance and system updates",
      email: true,
      slack: false,
      sms: false,
      webhook: false
    }
  ])

  const [savedMessage, setSavedMessage] = useState(false)

  const toggleChannel = (id: string) => {
    setChannels(channels.map(channel =>
      channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
    ))
  }

  const updatePreference = (index: number, channel: keyof Omit<NotificationPreference, 'category' | 'description'>) => {
    const updated = [...preferences]
    updated[index] = { ...updated[index], [channel]: !updated[index][channel] }
    setPreferences(updated)
  }

  const savePreferences = () => {
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 3000)
  }

  const enabledChannels = channels.filter(c => c.enabled)

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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BellIcon className="h-10 w-10 text-green-600" />
              Notification Preferences
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure how and when you receive notifications
            </p>
          </div>
          {savedMessage && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <CheckCircleIcon className="h-5 w-5" />
              Preferences saved successfully!
            </div>
          )}
        </div>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Configure and enable notification delivery channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`border rounded-lg p-4 transition-all ${
                  channel.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <channel.icon className={`h-8 w-8 ${channel.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-semibold text-gray-900">{channel.name}</div>
                      <div className="text-sm text-gray-600">
                        {Object.entries(channel.config).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {channel.enabled && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => toggleChannel(channel.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        channel.enabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {channel.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which notifications you want to receive on each channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  {channels.map((channel) => (
                    <th key={channel.id} className="text-center py-3 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <channel.icon className={`h-5 w-5 ${channel.enabled ? 'text-gray-700' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${channel.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                          {channel.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preferences.map((pref, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{pref.category}</div>
                        <div className="text-sm text-gray-600">{pref.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={() => updatePreference(index, 'email')}
                        disabled={!channels.find(c => c.type === 'email')?.enabled}
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-30"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={pref.slack}
                        onChange={() => updatePreference(index, 'slack')}
                        disabled={!channels.find(c => c.type === 'slack')?.enabled}
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-30"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={pref.sms}
                        onChange={() => updatePreference(index, 'sms')}
                        disabled={!channels.find(c => c.type === 'sms')?.enabled}
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-30"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={pref.webhook}
                        onChange={() => updatePreference(index, 'webhook')}
                        disabled={!channels.find(c => c.type === 'webhook')?.enabled}
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-30"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BellIcon className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <div className="font-semibold text-blue-900 mb-1">Notification Summary</div>
              <div className="text-sm text-blue-800">
                You have <strong>{enabledChannels.length} active channels</strong> and are subscribed to{" "}
                <strong>{preferences.filter(p => p.email || p.slack || p.sms || p.webhook).length} notification categories</strong>.
                Make sure to test your notification settings to ensure you receive important alerts.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          Reset to Defaults
        </button>
        <button
          onClick={savePreferences}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}
