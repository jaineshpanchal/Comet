"use client"

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/contexts/WebSocketContext'

interface Metrics {
  totalProjects: number
  activePipelines: number
  successRate: number
  failureRate: number
  avgDuration: number
  deployments: number
  testPassRate: number
  codeQuality: number
  [key: string]: any
}

export function useRealTimeMetrics(channel: string = 'metrics') {
  const { subscribe, isConnected } = useWebSocket()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!isConnected) {
      return
    }

    const unsubscribe = subscribe(channel, (data: any) => {
      setMetrics(data)
      setLastUpdate(new Date())
      setLoading(false)
      setError(null)
    })

    // Initial data fetch
    fetchInitialData()

    return unsubscribe
  }, [isConnected, channel, subscribe])

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('comet_jwt')
      const response = await fetch(`http://localhost:8000/api/metrics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setMetrics(data.data)
        setLastUpdate(new Date())
      }
    } catch (err) {
      setError('Failed to fetch initial metrics')
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = useCallback(() => {
    fetchInitialData()
  }, [])

  return { metrics, loading, error, lastUpdate, isConnected, refresh }
}
