'use client'

import { useState, useEffect, useCallback } from 'react'

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
  type: 'deployment' | 'test' | 'build' | 'alert' | 'commit'
  title: string
  description: string
  timestamp: Date
  user: string
  severity: 'low' | 'medium' | 'high'
}

const API_BASE_URL = 'http://localhost:9090/api/metrics'

export function useMetrics() {
  const [kpis, setKpis] = useState<KPIMetric[]>([])
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  const fetchKPIs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/kpis`)
      if (!response.ok) throw new Error('Failed to fetch KPIs')
      const result = await response.json()
      const data = result.data || []
      setKpis(data.map((kpi: any) => ({
        ...kpi,
        timestamp: new Date(kpi.timestamp)
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KPIs')
    }
  }, [])

  const fetchPipelines = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pipelines`)
      if (!response.ok) throw new Error('Failed to fetch pipelines')
      const result = await response.json()
      const data = result.data || []
      setPipelines(data.map((pipeline: any) => ({
        ...pipeline,
        lastRun: new Date(pipeline.lastRun)
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipelines')
    }
  }, [])

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/activities`)
      if (!response.ok) throw new Error('Failed to fetch activities')
      const result = await response.json()
      const data = result.data || []
      setActivities(data.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchKPIs(),
        fetchPipelines(),
        fetchActivities()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [fetchKPIs, fetchPipelines, fetchActivities])

  // Initial data fetch
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9090')
    
    ws.onopen = () => {
      console.log('🔗 Connected to metrics WebSocket')
      setWsConnected(true)
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'kpis':
            setKpis(data.data.map((kpi: any) => ({
              ...kpi,
              timestamp: new Date(kpi.timestamp)
            })))
            break
          case 'pipelines':
            setPipelines(data.data.map((pipeline: any) => ({
              ...pipeline,
              lastRun: new Date(pipeline.lastRun)
            })))
            break
          case 'activities':
            setActivities(data.data.map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp)
            })))
            break
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
      }
    }
    
    ws.onclose = () => {
      console.log('🔌 Disconnected from metrics WebSocket')
      setWsConnected(false)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setWsConnected(false)
      // Don't set error state for WebSocket failures - data can still load via HTTP
    }
    
    return () => {
      ws.close()
    }
  }, [])

  const refresh = useCallback(() => {
    fetchAllData()
  }, [fetchAllData])

  return {
    kpis,
    pipelines,
    activities,
    isLoading,
    error,
    wsConnected,
    refresh
  }
}