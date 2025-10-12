"use client"

import { useState, useEffect } from "react"
import { KpiMetric } from "@/components/ui/kpi-metric"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useMetrics } from "@/hooks/use-metrics"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Activity, Zap, TrendingUp, BarChart3, Target, Clock, Shield, Rocket, CheckCircle2, Timer, Users, Gauge, BarChart4, PieChart } from "lucide-react"

export default function DashboardPage() {
  const { kpis, pipelines, activities, isLoading, error, wsConnected, refresh } = useMetrics()
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [viewedSections, setViewedSections] = useState<Record<string, boolean>>({
    overview: true,
    pipelines: false,
    activity: false,
    analytics: false
  })

  // Keep track of previous data counts to detect new updates
  const [previousCounts, setPreviousCounts] = useState<Record<string, number>>({
    pipelines: 0,
    activity: 0
  })

  // Effect to detect new data and show notifications
  useEffect(() => {
    const currentPipelinesCount = pipelines.length
    const currentActivitiesCount = activities.length

    // If we have new pipelines and user hasn't viewed the section, mark as unviewed
    if (currentPipelinesCount > previousCounts.pipelines && viewedSections.pipelines) {
      setViewedSections(prev => ({ ...prev, pipelines: false }))
    }

    // If we have new activities and user hasn't viewed the section, mark as unviewed
    if (currentActivitiesCount > previousCounts.activity && viewedSections.activity) {
      setViewedSections(prev => ({ ...prev, activity: false }))
    }

    // Update previous counts
    setPreviousCounts({
      pipelines: currentPipelinesCount,
      activity: currentActivitiesCount
    })
  }, [pipelines.length, activities.length])

  // Handle tab change and mark section as viewed
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setViewedSections(prev => ({
      ...prev,
      [value]: true
    }))
  }

  // Handle refresh with notification simulation
  const handleRefresh = () => {
    refresh()
    // Simulate new notifications for sections not currently active
    if (activeTab !== 'pipelines') {
      setViewedSections(prev => ({ ...prev, pipelines: false }))
    }
    if (activeTab !== 'activity') {
      setViewedSections(prev => ({ ...prev, activity: false }))
    }
  }

  // Calculate notification counts (only show if section hasn't been viewed)
  const getNotificationCount = (section: string) => {
    if (viewedSections[section]) return 0
    
    switch (section) {
      case 'pipelines':
        return pipelines.length
      case 'activity':
        return activities.length
      default:
        return 0
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Connection Error</div>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-10 p-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-none mb-4">
              Dashboard
            </h1>
            <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
              Real-time insights into your <span className="text-gray-700 font-medium">DevOps</span> performance
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-sm font-medium text-gray-600">
              {wsConnected ? 'Live' : 'Polling Mode'}
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))
        ) : (
          kpis.map((kpi) => {
            // Map KPI IDs to appropriate icons with enhanced aesthetics
            const getIcon = (kpiId: string) => {
              switch (kpiId) {
                case 'deployment-success':
                  return <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />;
                case 'lead-time':
                  return <Timer className="h-6 w-6" strokeWidth={2.5} />;
                case 'test-coverage':
                  return <Shield className="h-6 w-6" strokeWidth={2.5} />;
                case 'active-deployments':
                  return <Rocket className="h-6 w-6" strokeWidth={2.5} />;
                default:
                  return <Gauge className="h-6 w-6" strokeWidth={2.5} />;
              }
            };

            return (
              <KpiMetric
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                color={kpi.color}
                icon={getIcon(kpi.id)}
                selected={selectedKpi === kpi.id}
                onSelect={() => setSelectedKpi(selectedKpi === kpi.id ? null : kpi.id)}
              />
            );
          })
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-lg shadow-slate-900/5 rounded-2xl p-2">
          <TabsTrigger 
            value="overview" 
            className="group px-3 py-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-100/80 data-[state=active]:shadow-sm data-[state=active]:shadow-blue-200/50 rounded-xl transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <BarChart3 className="h-5 w-5 text-blue-600 group-hover:text-blue-600 group-data-[state=active]:text-blue-700 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Overview</span>
            {getNotificationCount('overview') > 0 && (
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="pipelines" 
            className="group px-3 py-2.5 text-green-600 hover:text-green-700 hover:bg-green-50/70 data-[state=active]:text-green-800 data-[state=active]:bg-green-100/80 data-[state=active]:shadow-sm data-[state=active]:shadow-green-200/50 rounded-xl transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <Rocket className="h-5 w-5 text-green-600 group-hover:text-green-600 group-data-[state=active]:text-green-700 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Pipelines</span>
            {getNotificationCount('pipelines') > 0 && (
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="group px-3 py-2.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50/70 data-[state=active]:text-purple-800 data-[state=active]:bg-purple-100/80 data-[state=active]:shadow-sm data-[state=active]:shadow-purple-200/50 rounded-xl transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <Clock className="h-5 w-5 text-purple-600 group-hover:text-purple-600 group-data-[state=active]:text-purple-700 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Activity</span>
            {getNotificationCount('activity') > 0 && (
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="group px-3 py-2.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50/70 data-[state=active]:text-orange-800 data-[state=active]:bg-orange-100/80 data-[state=active]:shadow-sm data-[state=active]:shadow-orange-200/50 rounded-xl transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <PieChart className="h-5 w-5 text-orange-600 group-hover:text-orange-600 group-data-[state=active]:text-orange-700 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Analytics</span>
            {getNotificationCount('analytics') > 0 && (
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Status Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Pipeline Status Overview
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))
                ) : (
                  pipelines.slice(0, 5).map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-50/50 hover:bg-neutral-100/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            pipeline.status === 'deployed'
                              ? 'bg-green-500'
                              : pipeline.status === 'testing'
                              ? 'bg-blue-500'
                              : pipeline.status === 'building'
                              ? 'bg-orange-500'
                              : pipeline.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <div>
                          <p className="font-medium text-neutral-900">
                            {pipeline.name}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Last run: {pipeline.lastRun.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            pipeline.status === 'deployed'
                              ? 'default'
                              : pipeline.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {pipeline.status}
                        </Badge>
                        <p className="text-sm text-neutral-600 mt-1">
                          {pipeline.duration}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))
                ) : (
                  activities.slice(0, 6).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-neutral-50/50 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.severity === 'high'
                            ? 'bg-red-500'
                            : activity.severity === 'medium'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-neutral-600 truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-neutral-500">
                            by {activity.user}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              All Pipelines
            </h3>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              ) : (
                pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-50/50 hover:bg-neutral-100/50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          pipeline.status === 'deployed'
                            ? 'bg-green-500'
                            : pipeline.status === 'testing'
                            ? 'bg-blue-500'
                            : pipeline.status === 'building'
                            ? 'bg-orange-500'
                            : pipeline.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-neutral-900">
                          {pipeline.name}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Last run: {pipeline.lastRun.toLocaleString()} • Duration: {pipeline.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-neutral-600">Progress</p>
                        <p className="font-medium">{pipeline.progress}%</p>
                      </div>
                      <Badge
                        variant={
                          pipeline.status === 'deployed'
                            ? 'default'
                            : pipeline.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {pipeline.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Activity Feed
            </h3>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-neutral-50/50 transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        activity.severity === 'high'
                          ? 'bg-red-500'
                          : activity.severity === 'medium'
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-neutral-900">
                          {activity.title}
                        </p>
                        <Badge
                          variant={
                            activity.type === 'deployment'
                              ? 'default'
                              : activity.type === 'alert'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-neutral-500">
                          by {activity.user}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {activity.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Performance Analytics
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-neutral-50/50">
                <h4 className="font-medium text-neutral-900 mb-2">Deployment Trends</h4>
                <p className="text-sm text-neutral-600">
                  Real-time deployment analytics and trends will be displayed here.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-neutral-50/50">
                <h4 className="font-medium text-neutral-900 mb-2">Quality Metrics</h4>
                <p className="text-sm text-neutral-600">
                  Code quality and testing metrics visualization coming soon.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}