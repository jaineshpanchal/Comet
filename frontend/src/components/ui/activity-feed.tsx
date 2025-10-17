"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"

export interface Activity {
  id: string
  type: "pipeline" | "deployment" | "test" | "alert" | "user"
  title: string
  description: string
  timestamp: Date
  status?: "success" | "failed" | "pending" | "info"
  user?: {
    name: string
    avatar?: string
  }
  metadata?: {
    project?: string
    environment?: string
    version?: string
    [key: string]: any
  }
}

interface ActivityFeedProps {
  activities?: Activity[]
  maxItems?: number
  showHeader?: boolean
  compact?: boolean
  onActivityClick?: (activity: Activity) => void
}

const activityTypeConfig = {
  pipeline: { icon: "🔄", color: "text-blue-600", bgColor: "bg-blue-50" },
  deployment: { icon: "🚀", color: "text-purple-600", bgColor: "bg-purple-50" },
  test: { icon: "🧪", color: "text-green-600", bgColor: "bg-green-50" },
  alert: { icon: "⚠️", color: "text-orange-600", bgColor: "bg-orange-50" },
  user: { icon: "👤", color: "text-gray-600", bgColor: "bg-gray-50" },
}

const statusConfig = {
  success: { label: "Success", color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  info: { label: "Info", color: "bg-blue-100 text-blue-800" },
}

export function ActivityFeed({
  activities = [],
  maxItems = 10,
  showHeader = true,
  compact = false,
  onActivityClick,
}: ActivityFeedProps) {
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([])

  useEffect(() => {
    setDisplayedActivities(activities.slice(0, maxItems))
  }, [activities, maxItems])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  if (displayedActivities.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>System events and updates</CardDescription>
          </CardHeader>
        )}
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-600 mb-2">No recent activity</p>
          <p className="text-sm text-gray-500">Activity will appear here as it happens</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>System events and updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-0" : ""}>
        <ScrollArea className={compact ? "h-[400px]" : "h-[600px]"}>
          <div className="space-y-1">
            {displayedActivities.map((activity, index) => {
              const typeConfig = activityTypeConfig[activity.type]
              const statusConf = activity.status
                ? statusConfig[activity.status]
                : null

              return (
                <div
                  key={activity.id || index}
                  onClick={() => onActivityClick?.(activity)}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    onActivityClick
                      ? "cursor-pointer hover:bg-gray-50"
                      : ""
                  } ${index !== displayedActivities.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${typeConfig.bgColor}`}
                  >
                    {typeConfig.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                      {statusConf && (
                        <Badge className={`${statusConf.color} flex-shrink-0`}>
                          {statusConf.label}
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    {activity.metadata && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activity.metadata.project && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {activity.metadata.project}
                          </span>
                        )}
                        {activity.metadata.environment && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {activity.metadata.environment}
                          </span>
                        )}
                        {activity.metadata.version && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            v{activity.metadata.version}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {activity.user && (
                        <>
                          <span>{activity.user.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Hook to generate sample activities (for demo purposes)
export function useActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Generate sample activities
    const sampleActivities: Activity[] = [
      {
        id: "1",
        type: "pipeline",
        title: "Pipeline Completed",
        description: "Production deployment pipeline finished successfully",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: "success",
        user: { name: "Demo User" },
        metadata: {
          project: "E-Commerce Web App",
          environment: "production",
        },
      },
      {
        id: "2",
        type: "deployment",
        title: "Deployment Started",
        description: "Deploying version 2.4.1 to staging environment",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: "pending",
        user: { name: "Alice Johnson" },
        metadata: {
          project: "API Gateway Service",
          environment: "staging",
          version: "2.4.1",
        },
      },
      {
        id: "3",
        type: "test",
        title: "Test Suite Passed",
        description: "Integration tests completed with 98% pass rate",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: "success",
        user: { name: "John Smith" },
        metadata: {
          project: "Mobile App",
        },
      },
      {
        id: "4",
        type: "alert",
        title: "High Memory Usage",
        description: "Production server memory usage exceeded 85% threshold",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: "failed",
        metadata: {
          environment: "production",
        },
      },
      {
        id: "5",
        type: "user",
        title: "New Team Member",
        description: "Jane Doe was added to the Frontend Team",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "info",
        user: { name: "Admin User" },
      },
      {
        id: "6",
        type: "pipeline",
        title: "Pipeline Failed",
        description: "Build stage failed due to compilation errors",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        status: "failed",
        user: { name: "Demo User" },
        metadata: {
          project: "Data Analytics Service",
        },
      },
      {
        id: "7",
        type: "deployment",
        title: "Rollback Completed",
        description: "Rolled back to version 2.3.9 in production",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: "success",
        user: { name: "Alice Johnson" },
        metadata: {
          project: "E-Commerce Web App",
          environment: "production",
          version: "2.3.9",
        },
      },
      {
        id: "8",
        type: "test",
        title: "Performance Test Completed",
        description: "Load testing showed 15% improvement in response time",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: "success",
        user: { name: "John Smith" },
        metadata: {
          project: "API Gateway Service",
        },
      },
    ]

    setActivities(sampleActivities)

    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: ["pipeline", "deployment", "test", "alert", "user"][
          Math.floor(Math.random() * 5)
        ] as Activity["type"],
        title: "New Activity",
        description: "A new system event has occurred",
        timestamp: new Date(),
        status: ["success", "failed", "pending", "info"][
          Math.floor(Math.random() * 4)
        ] as Activity["status"],
        user: { name: "Demo User" },
      }

      setActivities((prev) => [newActivity, ...prev].slice(0, 20))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return activities
}
