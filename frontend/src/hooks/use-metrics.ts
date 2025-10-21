'use client'

import { useState, useEffect, useCallback } from 'react'
import { MetricsService, type Activity, type DashboardMetrics } from '@/services/metrics.service'
import { websocketService } from '@/services/websocket'
import { getAuthToken } from '@/lib/auth'

interface KPIMetric {
  id: string
  label: string
  value: string
  delta: string
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red'
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
}

interface PipelineStatus {
  id: string
  name: string
  status: 'deployed' | 'testing' | 'building' | 'failed' | 'queued'
  progress: number
  lastRun: Date
  duration: string
}

interface ActivityEvent {
  id: string
  type: 'deployment' | 'test' | 'build' | 'alert' | 'commit' | 'pipeline'
  title: string
  description: string
  timestamp: Date
  user: string
  severity: 'low' | 'medium' | 'high'
}

/**
 * Transform backend Activity to frontend ActivityEvent
 */
function transformActivity(activity: Activity): ActivityEvent {
  const baseActivity = {
    id: activity.id,
    type: activity.type as ActivityEvent['type'],
    timestamp: new Date(activity.timestamp),
    user: activity.triggeredBy || activity.deployedBy || 'System',
    severity: (activity.status === 'FAILED' ? 'high' : activity.status === 'PASSED' || activity.status === 'SUCCESS' || activity.status === 'DEPLOYED' ? 'low' : 'medium') as 'low' | 'medium' | 'high',
  }

  switch (activity.type) {
    case 'pipeline':
      return {
        ...baseActivity,
        title: `Pipeline: ${activity.name}`,
        description: `${activity.status} in ${activity.project}`,
      }
    case 'test':
      return {
        ...baseActivity,
        title: `Test: ${activity.name}`,
        description: `${activity.testType} - ${activity.testsPassed}/${activity.testsRun} passed in ${activity.project}`,
      }
    case 'deployment':
      return {
        ...baseActivity,
        title: `Deployment: ${activity.version}`,
        description: `${activity.environment} - ${activity.status} in ${activity.project}`,
      }
    default:
      return {
        ...baseActivity,
        title: 'Activity',
        description: `${activity.status} in ${activity.project}`,
      }
  }
}

/**
 * Transform backend DashboardMetrics KPIs to frontend KPIMetrics
 */
function transformKPIs(dashboardMetrics: DashboardMetrics | null): KPIMetric[] {
  if (!dashboardMetrics || !dashboardMetrics.kpis) {
    // Return default empty metrics if data is unavailable
    return []
  }

  const { kpis } = dashboardMetrics

  return [
    {
      id: 'projects',
      label: 'Total Projects',
      value: kpis.totalProjects.toString(),
      delta: '+0%',
      color: 'blue',
      trend: 'stable',
      timestamp: new Date(),
    },
    {
      id: 'pipelines',
      label: 'Active Pipelines',
      value: kpis.activePipelines.toString(),
      delta: '+0%',
      color: 'purple',
      trend: 'stable',
      timestamp: new Date(),
    },
    {
      id: 'pipelineSuccess',
      label: 'Pipeline Success Rate',
      value: `${kpis.pipelineSuccessRate.toFixed(1)}%`,
      delta: kpis.pipelineSuccessRate >= 80 ? '+high' : '-low',
      color: kpis.pipelineSuccessRate >= 80 ? 'green' : kpis.pipelineSuccessRate >= 60 ? 'orange' : 'red',
      trend: kpis.pipelineSuccessRate >= 80 ? 'up' : kpis.pipelineSuccessRate >= 60 ? 'stable' : 'down',
      timestamp: new Date(),
    },
    {
      id: 'testPass',
      label: 'Test Pass Rate',
      value: `${kpis.testPassRate.toFixed(1)}%`,
      delta: kpis.testPassRate >= 90 ? '+high' : '-low',
      color: kpis.testPassRate >= 90 ? 'green' : kpis.testPassRate >= 70 ? 'orange' : 'red',
      trend: kpis.testPassRate >= 90 ? 'up' : kpis.testPassRate >= 70 ? 'stable' : 'down',
      timestamp: new Date(),
    },
    {
      id: 'deploymentSuccess',
      label: 'Deployment Success Rate',
      value: `${kpis.deploymentSuccessRate.toFixed(1)}%`,
      delta: kpis.deploymentSuccessRate >= 95 ? '+high' : '-low',
      color: kpis.deploymentSuccessRate >= 95 ? 'green' : kpis.deploymentSuccessRate >= 80 ? 'orange' : 'red',
      trend: kpis.deploymentSuccessRate >= 95 ? 'up' : kpis.deploymentSuccessRate >= 80 ? 'stable' : 'down',
      timestamp: new Date(),
    },
    {
      id: 'avgDuration',
      label: 'Avg Pipeline Duration',
      value: `${Math.floor(kpis.avgPipelineDuration / 60)}m`,
      delta: kpis.avgPipelineDuration < 300 ? 'fast' : 'slow',
      color: kpis.avgPipelineDuration < 300 ? 'green' : kpis.avgPipelineDuration < 600 ? 'orange' : 'red',
      trend: kpis.avgPipelineDuration < 300 ? 'up' : 'down',
      timestamp: new Date(),
    },
    {
      id: 'deploymentFreq',
      label: 'Deployment Frequency',
      value: `${kpis.deploymentFrequency.toFixed(1)}/day`,
      delta: kpis.deploymentFrequency >= 1 ? '+good' : '-low',
      color: kpis.deploymentFrequency >= 2 ? 'green' : kpis.deploymentFrequency >= 1 ? 'blue' : 'orange',
      trend: kpis.deploymentFrequency >= 1 ? 'up' : 'stable',
      timestamp: new Date(),
    },
  ]
}

export function useMetrics(timeRange: string = '24h') {
  const [kpis, setKpis] = useState<KPIMetric[]>([])
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)

      // Fetch dashboard metrics (KPIs)
      const dashboardMetrics = await MetricsService.getDashboardMetrics(timeRange)
      if (dashboardMetrics) {
        const transformedKpis = transformKPIs(dashboardMetrics)
        setKpis(transformedKpis)
      }

      // Fetch pipeline metrics
      const pipelineMetrics = await MetricsService.getPipelineMetrics(timeRange)

      // Transform pipeline metrics to PipelineStatus format
      const pipelineStatuses: PipelineStatus[] = pipelineMetrics.topPipelines.slice(0, 5).map((p, idx) => ({
        id: p.pipelineId,
        name: p.name,
        status: p.successCount / p.count >= 0.8 ? 'deployed' : p.successCount / p.count >= 0.5 ? 'testing' : 'failed',
        progress: Math.round((p.successCount / p.count) * 100),
        lastRun: new Date(Date.now() - idx * 3600000), // Mock last run time
        duration: `${Math.floor(Math.random() * 10 + 1)}m ${Math.floor(Math.random() * 60)}s`,
      }))
      setPipelines(pipelineStatuses)

      // Fetch recent activities
      const recentActivities = await MetricsService.getActivities(20, 'all')
      const transformedActivities = recentActivities.map(transformActivity)
      setActivities(transformedActivities)

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // WebSocket connection for real-time updates
  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      console.warn('No auth token found, using polling mode')
      // Fallback to polling if no token
      const pollInterval = setInterval(() => {
        fetchDashboardData()
      }, 30000)
      return () => clearInterval(pollInterval)
    }

    // Connect to WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    websocketService.connect({ url: wsUrl, token })

    // Set initial connection status after a short delay to allow connection
    setTimeout(() => {
      if (websocketService.connected) {
        setWsConnected(true)
        console.log('✅ WebSocket connected - Live updates enabled')
      }
    }, 1000)

    // Handle connection status
    const handleConnectionStatus = (data: { connected: boolean }) => {
      setWsConnected(data.connected)
      if (data.connected) {
        console.log('✅ WebSocket connected - Live updates enabled')
      } else {
        console.log('❌ WebSocket disconnected - Falling back to polling')
      }
    }

    // Handle metrics updates
    const handleMetricsUpdate = (data: any) => {
      console.log('📊 Received metrics update via WebSocket')
      fetchDashboardData()
    }

    // Handle pipeline updates
    const handlePipelineUpdate = (data: any) => {
      console.log('🚀 Received pipeline update via WebSocket')
      fetchDashboardData()
    }

    // Handle deployment updates
    const handleDeploymentUpdate = (data: any) => {
      console.log('📦 Received deployment update via WebSocket')
      fetchDashboardData()
    }

    // Register event listeners
    websocketService.on('connection:status', handleConnectionStatus)
    websocketService.on('metrics:update', handleMetricsUpdate)
    websocketService.on('pipeline:run:update', handlePipelineUpdate)
    websocketService.on('pipeline:status:change', handlePipelineUpdate)
    websocketService.on('deployment:update', handleDeploymentUpdate)

    // Fallback polling if WebSocket fails (every 60 seconds)
    const pollInterval = setInterval(() => {
      if (!websocketService.connected) {
        console.log('WebSocket not connected, using HTTP polling')
        fetchDashboardData()
      }
    }, 60000)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
      websocketService.off('connection:status', handleConnectionStatus)
      websocketService.off('metrics:update', handleMetricsUpdate)
      websocketService.off('pipeline:run:update', handlePipelineUpdate)
      websocketService.off('pipeline:status:change', handlePipelineUpdate)
      websocketService.off('deployment:update', handleDeploymentUpdate)
      // Don't disconnect WebSocket on cleanup - keep it alive for other components
    }
  }, [fetchDashboardData])

  const refresh = useCallback(() => {
    setIsLoading(true)
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    kpis,
    pipelines,
    activities,
    isLoading,
    error,
    wsConnected,
    refresh,
  }
}
