"use client"

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/contexts/WebSocketContext'

interface Pipeline {
  id: string
  name: string
  status: 'running' | 'success' | 'failed' | 'pending'
  branch: string
  commit: string
  author: string
  startedAt: string
  duration?: number
  stages?: any[]
  [key: string]: any
}

export function useRealTimePipelines() {
  const { subscribe, isConnected } = useWebSocket()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!isConnected) {
      return
    }

    const unsubscribe = subscribe('pipelines', (data: any) => {
      if (data.type === 'update') {
        // Update specific pipeline
        setPipelines(prev => {
          const index = prev.findIndex(p => p.id === data.pipeline.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = data.pipeline
            return updated
          }
          return [data.pipeline, ...prev]
        })
      } else if (data.type === 'list') {
        // Full list update
        setPipelines(data.pipelines)
      }
      setLastUpdate(new Date())
      setLoading(false)
    })

    fetchInitialData()

    return unsubscribe
  }, [isConnected, subscribe])

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('comet_jwt')
      const response = await fetch(`http://localhost:8000/api/pipelines`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setPipelines(data.data || [])
        setLastUpdate(new Date())
      }
    } catch (err) {
      setError('Failed to fetch pipelines')
      console.error('Failed to fetch pipelines:', err)
    } finally {
      setLoading(false)
    }
  }

  return { pipelines, loading, error, lastUpdate, isConnected }
}
