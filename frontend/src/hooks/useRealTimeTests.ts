"use client"

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/contexts/WebSocketContext'

interface TestRun {
  id: string
  suite: string
  status: 'running' | 'passed' | 'failed' | 'skipped'
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  startedAt: string
  [key: string]: any
}

export function useRealTimeTests() {
  const { subscribe, isConnected } = useWebSocket()
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!isConnected) {
      return
    }

    const unsubscribe = subscribe('tests', (data: any) => {
      if (data.type === 'update') {
        setTestRuns(prev => {
          const index = prev.findIndex(t => t.id === data.testRun.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = data.testRun
            return updated
          }
          return [data.testRun, ...prev]
        })
      } else if (data.type === 'list') {
        setTestRuns(data.testRuns)
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
      const response = await fetch(`http://localhost:8000/api/test/runs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setTestRuns(data.data || [])
        setLastUpdate(new Date())
      }
    } catch (err) {
      setError('Failed to fetch test runs')
      console.error('Failed to fetch test runs:', err)
    } finally {
      setLoading(false)
    }
  }

  return { testRuns, loading, error, lastUpdate, isConnected }
}
