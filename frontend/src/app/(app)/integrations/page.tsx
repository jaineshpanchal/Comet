'use client'

import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IntegrationService, type Integration } from '@/services/integration.service'
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

const integrationIcons: Record<string, string> = {
  GITHUB: '🐙',
  GITLAB: '🦊',
  BITBUCKET: '🪣',
  JIRA: '📋',
  SLACK: '💬',
  DISCORD: '🎮',
  TEAMS: '👥',
  SONARQUBE: '📊',
  AWS: '☁️',
  AZURE: '🔷',
  GCP: '🌐',
  CUSTOM_WEBHOOK: '🔗',
}

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
  ERROR: { label: 'Error', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  PENDING_AUTH: { label: 'Pending Auth', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
}

export default function IntegrationsPage() {
  useAuthGuard()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [githubToken, setGitHubToken] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isTestingId, setIsTestingId] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setError(null)
      const data = await IntegrationService.listIntegrations()
      setIntegrations(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch integrations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGitHubIntegration = async () => {
    if (!githubToken.trim()) {
      setError('Please enter a GitHub Personal Access Token')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await IntegrationService.createGitHubIntegration(githubToken)
      setShowAddModal(false)
      setGitHubToken('')
      setSelectedType(null)
      await fetchIntegrations()
    } catch (err: any) {
      setError(err.message || 'Failed to create integration')
    } finally {
      setIsCreating(false)
    }
  }

  const handleTestConnection = async (integrationId: string) => {
    setIsTestingId(integrationId)
    setError(null)

    try {
      const isConnected = await IntegrationService.testConnection(integrationId)
      if (isConnected) {
        await fetchIntegrations()
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed')
    } finally {
      setIsTestingId(null)
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration? This will remove all associated webhooks.')) {
      return
    }

    setIsDeletingId(integrationId)
    setError(null)

    try {
      await IntegrationService.deleteIntegration(integrationId)
      await fetchIntegrations()
    } catch (err: any) {
      setError(err.message || 'Failed to delete integration')
    } finally {
      setIsDeletingId(null)
    }
  }

  const getStatistics = () => {
    return {
      total: integrations.length,
      active: integrations.filter(i => i.status === 'ACTIVE').length,
      error: integrations.filter(i => i.status === 'ERROR').length,
      totalWebhooks: integrations.reduce((sum, i) => sum + i.webhookCount, 0),
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
                Integrations
              </h1>
              <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
                Connect your <span className="text-gray-700 font-medium">tools</span> and{' '}
                <span className="text-gray-700 font-medium">services</span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = getStatistics()

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
              Integrations
            </h1>
            <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
              Connect your <span className="text-gray-700 font-medium">tools</span> and{' '}
              <span className="text-gray-700 font-medium">services</span>
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all shadow-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Integration
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Total Integrations</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-500">Errors</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.error}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-500">Total Webhooks</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.totalWebhooks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No integrations yet</h3>
            <p className="text-gray-500 mb-6">
              Connect your first integration to start automating your workflows
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map(integration => {
            const statusInfo = statusConfig[integration.status]
            const StatusIcon = statusInfo.icon

            return (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{integrationIcons[integration.type] || '🔗'}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.type}</CardDescription>
                      </div>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Webhooks</p>
                      <p className="font-semibold">
                        {integration.activeWebhookCount} / {integration.webhookCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Sync</p>
                      <p className="font-semibold text-xs">
                        {integration.lastSyncAt
                          ? new Date(integration.lastSyncAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(integration.id)}
                      disabled={isTestingId === integration.id}
                      className="flex-1"
                    >
                      {isTestingId === integration.id ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteIntegration(integration.id)}
                      disabled={isDeletingId === integration.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isDeletingId === integration.id ? (
                        'Deleting...'
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Integration</CardTitle>
              <CardDescription>Connect a service to your Comet platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedType ? (
                <>
                  <p className="text-sm text-gray-600">Select an integration type:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedType('GITHUB')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integrationIcons.GITHUB}</span>
                        <div>
                          <p className="font-semibold">GitHub</p>
                          <p className="text-xs text-gray-500">Source control & CI/CD</p>
                        </div>
                      </div>
                    </button>

                    <button
                      disabled
                      className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integrationIcons.SLACK}</span>
                        <div>
                          <p className="font-semibold">Slack</p>
                          <p className="text-xs text-gray-500">Coming soon</p>
                        </div>
                      </div>
                    </button>

                    <button
                      disabled
                      className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integrationIcons.JIRA}</span>
                        <div>
                          <p className="font-semibold">JIRA</p>
                          <p className="text-xs text-gray-500">Coming soon</p>
                        </div>
                      </div>
                    </button>

                    <button
                      disabled
                      className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integrationIcons.GITLAB}</span>
                        <div>
                          <p className="font-semibold">GitLab</p>
                          <p className="text-xs text-gray-500">Coming soon</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selectedType === 'GITHUB' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GitHub Personal Access Token
                        </label>
                        <input
                          type="password"
                          value={githubToken}
                          onChange={e => setGitHubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Create a token at{' '}
                          <a
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline"
                          >
                            github.com/settings/tokens
                          </a>
                          <br />
                          Required scopes: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">repo</code>,{' '}
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">admin:repo_hook</code>
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedType(null)
                    setGitHubToken('')
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                {selectedType && (
                  <Button
                    onClick={handleCreateGitHubIntegration}
                    disabled={isCreating || !githubToken.trim()}
                  >
                    {isCreating ? 'Creating...' : 'Create Integration'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
