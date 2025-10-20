"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketContextType {
  isConnected: boolean
  subscribe: (channel: string, callback: (data: any) => void) => () => void
  send: (channel: string, data: any) => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
  url?: string
}

export function WebSocketProvider({ children, url = 'http://localhost:8000' }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const socketRef = useRef<Socket | null>(null)
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    setConnectionStatus('connecting')
    console.log('[WebSocket] Connecting to', url)

    try {
      // Get JWT token from localStorage for authentication
      const token = localStorage.getItem('golive_jwt')

      // Create Socket.IO connection with authentication
      const socket = io(url, {
        auth: {
          token: token || ''
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: maxReconnectAttempts,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('[WebSocket] Connected with ID:', socket.id)
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0

        // Resubscribe to all channels after reconnection
        subscribersRef.current.forEach((_, channel) => {
          socket.emit('subscribe', { channel })
        })
      })

      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
      })

      socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error)
        setConnectionStatus('error')
        reconnectAttemptsRef.current++

        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached')
          socket.disconnect()
        }
      })

      // Listen for pipeline updates
      socket.on('pipeline:run:update', (message) => {
        const callbacks = subscribersRef.current.get('pipelines')
        if (callbacks) {
          callbacks.forEach(callback => callback(message))
        }
      })

      // Listen for test run updates
      socket.on('test:run:update', (message) => {
        const callbacks = subscribersRef.current.get('tests')
        if (callbacks) {
          callbacks.forEach(callback => callback(message))
        }
      })

      // Listen for deployment updates
      socket.on('deployment:update', (message) => {
        const callbacks = subscribersRef.current.get('deployments')
        if (callbacks) {
          callbacks.forEach(callback => callback(message))
        }
      })

      // Listen for metrics updates
      socket.on('metrics:update', (message) => {
        const callbacks = subscribersRef.current.get('metrics')
        if (callbacks) {
          callbacks.forEach(callback => callback(message))
        }
      })

      // Listen for notifications
      socket.on('notification', (message) => {
        const callbacks = subscribersRef.current.get('notifications')
        if (callbacks) {
          callbacks.forEach(callback => callback(message))
        }
      })

    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      setConnectionStatus('error')
    }
  }, [url])

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    // Add subscriber to the map
    if (!subscribersRef.current.has(channel)) {
      subscribersRef.current.set(channel, new Set())
    }
    subscribersRef.current.get(channel)!.add(callback)

    // Subscribe to channel if connected
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { channel })
    }

    // Return unsubscribe function
    return () => {
      const callbacks = subscribersRef.current.get(channel)
      if (callbacks) {
        callbacks.delete(callback)

        // If no more subscribers, unsubscribe from channel
        if (callbacks.size === 0) {
          subscribersRef.current.delete(channel)
          if (socketRef.current?.connected) {
            socketRef.current.emit('unsubscribe', { channel })
          }
        }
      }
    }
  }, [])

  const send = useCallback((channel: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', { channel, data })
    } else {
      console.warn('[WebSocket] Cannot send message - not connected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [connect])

  const value: WebSocketContextType = {
    isConnected,
    subscribe,
    send,
    connectionStatus,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
