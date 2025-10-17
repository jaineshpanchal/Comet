'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeploymentService, type Deployment } from '@/services/deployment.service'

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 animate-pulse' },
  DEPLOYED: { label: 'Deployed', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  ROLLED_BACK: { label: 'Rolled Back', color: 'bg-yellow-100 text-yellow-800' },
}

const environmentConfig = {
  development: { label: 'Development', color: 'bg-blue-100 text-blue-800' },
  staging: { label: 'Staging', color: 'bg-purple-100 text-purple-800' },
  production: { label: 'Production', color: 'bg-red-100 text-red-800' },
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  useAuthGuard();
  const [isLoading, setIsLoading] = useState(true)
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchDeployments = useCallback(async () => {
    try {
      setError(null)
      const params: any = {}
      if (environmentFilter !== 'all') params.environment = environmentFilter
      if (statusFilter !== 'all') params.status = statusFilter

      const data = await DeploymentService.getDeployments(params.environment, params.status)
      setDeployments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deployments')
    } finally {
      setIsLoading(false)
    }
  }, [environmentFilter, statusFilter])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  // Auto-refresh deployments in progress every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActiveDeployments = deployments.some(d => d.status === 'IN_PROGRESS')
      if (hasActiveDeployments) {
        fetchDeployments()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [deployments, fetchDeployments])

  const handleRollback = async (deploymentId: string) => {
    try {
      setIsRollingBack(deploymentId)
      setError(null)
      await DeploymentService.rollbackDeployment(deploymentId)
      await fetchDeployments()
    } catch (err: any) {
      setError(err.message || 'Failed to rollback deployment')
    } finally {
      setIsRollingBack(null)
    }
  }

  const handleSelectDeployment = (deployment: Deployment) => {
    setSelectedDeployment(deployment)
    setActiveTab('details')
  }

  const filteredDeployments = deployments.filter(deployment => {
    if (environmentFilter !== 'all' && deployment.environment !== environmentFilter) return false
    if (statusFilter !== 'all' && deployment.status !== statusFilter) return false
    return true
  })

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getEnvironmentStats = () => {
    const stats = {
      development: { total: 0, deployed: 0, failed: 0 },
      staging: { total: 0, deployed: 0, failed: 0 },
      production: { total: 0, deployed: 0, failed: 0 },
    }

    deployments.forEach(d => {
      const env = d.environment as keyof typeof stats
      if (stats[env]) {
        stats[env].total++
        if (d.status === 'DEPLOYED') stats[env].deployed++
        if (d.status === 'FAILED') stats[env].failed++
      }
    })

    return stats
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
            <p className="text-muted-foreground">Track and manage deployments</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const envStats = getEnvironmentStats()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground">Track and manage deployments across environments</p>
        </div>
        <Button onClick={() => fetchDeployments()}>Refresh</Button>
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

      {/* Environment Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(envStats).map(([env, stats]) => (
          <Card key={env}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{env}</CardTitle>
              <CardDescription>Deployment statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Deployed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.deployed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Deployments ({deployments.length})</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedDeployment}>
            Deployment Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={environmentFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEnvironmentFilter('all')}
            >
              All Environments
            </Button>
            {Object.entries(environmentConfig).map(([env, config]) => (
              <Button
                key={env}
                variant={environmentFilter === env ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEnvironmentFilter(env)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All Status
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          {filteredDeployments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No deployments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDeployments.map(deployment => (
                <Card
                  key={deployment.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectDeployment(deployment)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={environmentConfig[deployment.environment as keyof typeof environmentConfig]?.color || environmentConfig.development.color}>
                            {environmentConfig[deployment.environment as keyof typeof environmentConfig]?.label || deployment.environment}
                          </Badge>
                          <Badge className={statusConfig[deployment.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color}>
                            {statusConfig[deployment.status as keyof typeof statusConfig]?.label || deployment.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(deployment.deployedAt).toLocaleString()}
                          </span>
                        </div>

                        {deployment.project && (
                          <div>
                            <p className="font-medium">Version {deployment.version}</p>
                            <p className="text-sm text-muted-foreground">
                              Project: {deployment.project.name}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Version</p>
                            <p className="font-medium">{deployment.version}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium">{formatDuration(deployment.duration)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Branch</p>
                            <p className="font-medium">{deployment.branch}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Commit</p>
                            <p className="font-mono text-xs">{deployment.commitHash.substring(0, 7)}</p>
                          </div>
                        </div>

                        {deployment.deployedByUser && (
                          <p className="text-sm text-muted-foreground">
                            Deployed by: {deployment.deployedByUser.firstName} {deployment.deployedByUser.lastName}
                          </p>
                        )}
                      </div>

                      {deployment.status === 'DEPLOYED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRollback(deployment.id)
                          }}
                          disabled={isRollingBack === deployment.id}
                        >
                          {isRollingBack === deployment.id ? 'Rolling back...' : 'Rollback'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedDeployment && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Deployment Details</CardTitle>
                    <CardDescription>
                      {selectedDeployment.project?.name || 'Unknown Project'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={environmentConfig[selectedDeployment.environment as keyof typeof environmentConfig]?.color || environmentConfig.development.color}>
                      {environmentConfig[selectedDeployment.environment as keyof typeof environmentConfig]?.label || selectedDeployment.environment}
                    </Badge>
                    <Badge className={statusConfig[selectedDeployment.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color}>
                      {statusConfig[selectedDeployment.status as keyof typeof statusConfig]?.label || selectedDeployment.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium">{selectedDeployment.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Environment</p>
                    <p className="font-medium capitalize">{selectedDeployment.environment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-medium">{selectedDeployment.branch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commit Hash</p>
                    <p className="font-mono text-sm">{selectedDeployment.commitHash}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deployed At</p>
                    <p className="font-medium">{new Date(selectedDeployment.deployedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(selectedDeployment.duration)}</p>
                  </div>
                  {selectedDeployment.deployedByUser && (
                    <div>
                      <p className="text-sm text-muted-foreground">Deployed By</p>
                      <p className="font-medium">
                        {selectedDeployment.deployedByUser.firstName} {selectedDeployment.deployedByUser.lastName}
                      </p>
                    </div>
                  )}
                  {selectedDeployment.finishedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Finished At</p>
                      <p className="font-medium">{new Date(selectedDeployment.finishedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedDeployment.configuration && Object.keys(selectedDeployment.configuration).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Configuration</p>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(selectedDeployment.configuration, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedDeployment.status === 'DEPLOYED' && (
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleRollback(selectedDeployment.id)}
                      disabled={isRollingBack === selectedDeployment.id}
                    >
                      {isRollingBack === selectedDeployment.id ? 'Rolling back...' : 'Rollback Deployment'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
