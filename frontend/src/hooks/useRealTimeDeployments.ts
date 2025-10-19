"use client"

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/contexts/WebSocketContext'

interface Deployment {
  id: string
  environment: 'production' | 'staging' | 'development'
  status: 'deploying' | 'success' | 'failed' | 'rolled-back'
  version: string
  deployedBy: string
  startedAt: string
  completedAt?: string
  duration?: number
  [key: string]: any
}

export function useRealTimeDeployments() {
  const { subscribe, isConnected } = useWebSocket()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!isConnected) {
      return
    }

    const unsubscribe = subscribe('deployments', (data: any) => {
      if (data.type === 'update') {
        setDeployments(prev => {
          const index = prev.findIndex(d => d.id === data.deployment.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = data.deployment
            return updated
          }
          return [data.deployment, ...prev]
        })
      } else if (data.type === 'list') {
        setDeployments(data.deployments)
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
      const response = await fetch(`http://localhost:8000/api/deployments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setDeployments(data.data || [])
        setLastUpdate(new Date())
      }
    } catch (err) {
      setError('Failed to fetch deployments')
      console.error('Failed to fetch deployments:', err)
    } finally {
      setLoading(false)
    }
  }

  return { deployments, loading, error, lastUpdate, isConnected }
}
