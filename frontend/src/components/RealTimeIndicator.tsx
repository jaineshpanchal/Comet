"use client"

import React from 'react'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { cn } from '@/lib/utils'
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface RealTimeIndicatorProps {
  className?: string
  showLabel?: boolean
  lastUpdate?: Date | null
}

export function RealTimeIndicator({ className, showLabel = true, lastUpdate }: RealTimeIndicatorProps) {
  const { connectionStatus, isConnected } = useWebSocket()

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'connecting':
        return <ArrowPathIcon className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'error':
      case 'disconnected':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return <ArrowPathIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'error':
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return null
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)

    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return lastUpdate.toLocaleTimeString()
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center">
        {getStatusIcon()}
        <div className={cn(
          "absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-75",
          isConnected ? getStatusColor() : "hidden"
        )} />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn(
            "text-xs font-medium",
            isConnected ? "text-green-600" : "text-gray-500"
          )}>
            {getStatusText()}
          </span>
          {lastUpdate && (
            <span className="text-[10px] text-gray-400">
              Updated {formatLastUpdate()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
