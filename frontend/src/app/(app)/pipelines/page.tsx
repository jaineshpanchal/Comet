"use client"

import { useState, useEffect } from "react"
import { useAuthGuard } from '@/lib/useAuthGuard'
import { PipelineService, type Pipeline, type PipelineRun } from "@/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Play,
  Square,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  GitBranch,
  Calendar,
  Filter
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const statusConfig = {
  IDLE: { color: 'bg-gray-500', icon: Clock, label: 'Idle' },
  PENDING: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
  RUNNING: { color: 'bg-blue-500', icon: Loader2, label: 'Running' },
  SUCCESS: { color: 'bg-green-500', icon: CheckCircle2, label: 'Success' },
  FAILED: { color: 'bg-red-500', icon: XCircle, label: 'Failed' },
  CANCELLED: { color: 'bg-gray-500', icon: Square, label: 'Cancelled' },
}

const runStatusConfig = {
  PENDING: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
  RUNNING: { color: 'bg-blue-500', icon: Loader2, label: 'Running' },
  SUCCESS: { color: 'bg-green-500', icon: CheckCircle2, label: 'Success' },
  FAILED: { color: 'bg-red-500', icon: XCircle, label: 'Failed' },
  CANCELLED: { color: 'bg-gray-500', icon: Square, label: 'Cancelled' },
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  useAuthGuard();
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'pipelines' | 'runs'>('pipelines')

  // Fetch pipelines
  const fetchPipelines = async () => {
    try {
      setError(null)
      const data = await PipelineService.getPipelines()
      setPipelines(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipelines')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch pipeline runs
  const fetchPipelineRuns = async (pipelineId: string) => {
    try {
      const runs = await PipelineService.getPipelineRuns(pipelineId, 10)
      setPipelineRuns(runs)
    } catch (err: any) {
      console.error('Failed to fetch pipeline runs:', err)
    }
  }

  // Run pipeline
  const handleRunPipeline = async (pipelineId: string) => {
    try {
      setIsRunning(pipelineId)
      setError(null)

      const run = await PipelineService.runPipeline(pipelineId)

      // Refresh pipelines and runs
      await fetchPipelines()
      if (selectedPipeline?.id === pipelineId) {
        await fetchPipelineRuns(pipelineId)
      }

      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to run pipeline')
    } finally {
      setIsRunning(null)
    }
  }

  // Cancel pipeline run
  const handleCancelRun = async (runId: string) => {
    try {
      await PipelineService.cancelPipelineRun(runId)

      // Refresh runs
      if (selectedPipeline) {
        await fetchPipelineRuns(selectedPipeline.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel pipeline run')
    }
  }

  // Select pipeline and load its runs
  const handleSelectPipeline = async (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline)
    setActiveTab('runs')
    await fetchPipelineRuns(pipeline.id)
  }

  // Initial load
  useEffect(() => {
    fetchPipelines()
  }, [])

  // Auto-refresh running pipelines every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const hasRunningPipelines = pipelines.some(p => p.status === 'RUNNING')
      if (hasRunningPipelines) {
        fetchPipelines()
      }

      if (selectedPipeline) {
        fetchPipelineRuns(selectedPipeline.id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [pipelines, selectedPipeline])

  // Filter pipelines by status
  const filteredPipelines = statusFilter === 'all'
    ? pipelines
    : pipelines.filter(p => p.status === statusFilter)

  if (error && pipelines.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pipelines</h1>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Connection Error
            </CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchPipelines} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipelines</h1>
          <p className="text-neutral-600 mt-1">
            Manage and execute your CI/CD pipelines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={fetchPipelines} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Pipeline
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} defaultValue="pipelines">
        <TabsList>
          <TabsTrigger value="pipelines">
            All Pipelines ({pipelines.length})
          </TabsTrigger>
          <TabsTrigger value="runs" disabled={!selectedPipeline}>
            {selectedPipeline ? `${selectedPipeline.name} - Runs` : 'Pipeline Runs'}
          </TabsTrigger>
        </TabsList>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'RUNNING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('RUNNING')}
            >
              Running
            </Button>
            <Button
              variant={statusFilter === 'SUCCESS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('SUCCESS')}
            >
              Success
            </Button>
            <Button
              variant={statusFilter === 'FAILED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('FAILED')}
            >
              Failed
            </Button>
          </div>

          {/* Pipeline List */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPipelines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GitBranch className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                <p className="text-neutral-600 mb-2">No pipelines found</p>
                <p className="text-sm text-neutral-500">
                  {statusFilter !== 'all'
                    ? `No pipelines with status: ${statusFilter}`
                    : 'Create your first pipeline to get started'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPipelines.map(pipeline => {
                const StatusIcon = statusConfig[pipeline.status]?.icon || Clock
                const isCurrentlyRunning = isRunning === pipeline.id

                return (
                  <Card
                    key={pipeline.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectPipeline(pipeline)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {pipeline.name}
                            {pipeline.status === 'RUNNING' && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {pipeline.project?.name || 'No project'}
                          </CardDescription>
                        </div>

                        <Badge
                          className={`${statusConfig[pipeline.status]?.color || 'bg-gray-500'} text-white`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[pipeline.status]?.label || pipeline.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          <span className="capitalize">{pipeline.trigger.toLowerCase().replace('_', ' ')}</span>
                        </div>
                        {pipeline.lastRunAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(pipeline.lastRunAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunPipeline(pipeline.id)
                          }}
                          disabled={isCurrentlyRunning || pipeline.status === 'RUNNING'}
                          size="sm"
                          className="flex-1"
                        >
                          {isCurrentlyRunning ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Run Pipeline
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Pipeline Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          {selectedPipeline && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Runs - {selectedPipeline.name}</CardTitle>
                  <CardDescription>
                    View execution history and detailed logs
                  </CardDescription>
                </CardHeader>
              </Card>

              {pipelineRuns.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                    <p className="text-neutral-600">No runs yet</p>
                    <p className="text-sm text-neutral-500 mb-4">
                      This pipeline hasn't been executed
                    </p>
                    <Button onClick={() => handleRunPipeline(selectedPipeline.id)}>
                      <Play className="w-4 h-4 mr-2" />
                      Run Now
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pipelineRuns.map(run => {
                    const RunStatusIcon = runStatusConfig[run.status]?.icon || Clock
                    const isRunning = run.status === 'RUNNING'

                    return (
                      <Card key={run.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge
                                className={`${runStatusConfig[run.status]?.color || 'bg-gray-500'} text-white`}
                              >
                                <RunStatusIcon className={`w-3 h-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
                                {runStatusConfig[run.status]?.label || run.status}
                              </Badge>

                              <div>
                                <div className="font-medium">
                                  Run #{run.id.substring(0, 8)}
                                </div>
                                <div className="text-sm text-neutral-600">
                                  Started {new Date(run.startedAt).toLocaleString()}
                                  {run.triggeredByUser && (
                                    <span className="ml-2">
                                      by {run.triggeredByUser.firstName} {run.triggeredByUser.lastName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {run.duration && (
                                <div className="text-sm text-neutral-600">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  {Math.floor(run.duration / 60)}m {run.duration % 60}s
                                </div>
                              )}

                              {isRunning && (
                                <Button
                                  onClick={() => handleCancelRun(run.id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Square className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
