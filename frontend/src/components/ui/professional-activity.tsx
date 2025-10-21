"use client"

import React from "react"
import { Clock, GitCommit, Rocket, Shield, AlertCircle, CheckCircle2, XCircle } from "lucide-react"

interface Activity {
  id: string
  title: string
  description: string
  user: string
  timestamp: Date
  severity?: 'low' | 'medium' | 'high'
  type?: string
}

interface ProfessionalActivityProps {
  activities: Activity[]
  maxItems?: number
}

export function ProfessionalActivity({ activities, maxItems = 10 }: ProfessionalActivityProps) {
  const displayActivities = activities.slice(0, maxItems)

  const getIcon = (activity: Activity) => {
    if (activity.type === 'deployment') return Rocket
    if (activity.type === 'commit') return GitCommit
    if (activity.type === 'security') return Shield
    if (activity.severity === 'high') return AlertCircle
    if (activity.severity === 'low') return CheckCircle2
    return Clock
  }

  const getIconColor = (activity: Activity) => {
    if (activity.severity === 'high') return 'text-red-600'
    if (activity.severity === 'medium') return 'text-gray-500'
    return 'text-green-600'
  }

  const getIconBg = (activity: Activity) => {
    if (activity.severity === 'high') return 'bg-red-50'
    if (activity.severity === 'medium') return 'bg-gray-50'
    return 'bg-green-50'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-blue-600">Activity Timeline</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const Icon = getIcon(activity)
            const iconColor = getIconColor(activity)
            const iconBg = getIconBg(activity)

            return (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index !== displayActivities.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
                )}

                {/* Activity item */}
                <div className="flex gap-4 group">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center relative z-10`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">{activity.user}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
