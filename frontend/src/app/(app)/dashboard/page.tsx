"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { useAuthGuard } from "@/lib/useAuthGuard"
import { useToast } from '@/components/ui/toast'
import { KpiMetric } from "@/components/ui/kpi-metric"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useMetrics } from "@/hooks/use-metrics"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityFeed, useActivityFeed } from "@/components/ui/activity-feed"
import { ProfessionalActivity } from "@/components/ui/professional-activity"
import {
  ProfessionalAreaChart,
  ProfessionalLineChart,
  ProfessionalBarChart,
  ProfessionalPieChart,
} from "@/components/ui/professional-charts"
import {
  RefreshCw,
  LayoutGrid,
  Activity,
  Shield,
  Rocket,
  CheckCircle2,
  Timer,
  Gauge,
  TrendingUp,
  Workflow,
  History,
  BarChart3,
  Target,
  Zap,
  Play,
  FlaskConical,
  Loader2,
  XCircle,
  CircleDot,
  GitCommit,
  Package,
  AlertTriangle,
  FolderKanban,
  PercentCircle,
  Briefcase
} from "lucide-react"

export default function DashboardPage() {
  useAuthGuard();
  const router = useRouter();
  const { showToast } = useToast();
  const { kpis, pipelines, activities, isLoading, error, wsConnected, refresh } = useMetrics()
  const activityFeed = useActivityFeed()
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [viewedSections, setViewedSections] = useState<Record<string, boolean>>({
    overview: true,
    pipelines: false,
    activity: false,
    analytics: false
  })
  const [previousCounts, setPreviousCounts] = useState<Record<string, number>>({
    pipelines: 0,
    activity: 0
  });

  // Logout handler
  const handleLogout = () => {
    logout();
    showToast("Logged out successfully!", "success");
    router.replace("/auth/login");
  };

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
    refresh();
    showToast("Dashboard data refreshed!", "success");
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
    showToast(error, "error");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Connection Error</div>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-10 p-8 pb-12">
      {/* Header - Clean & Professional */}
      <div className="space-y-4">
        <div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 font-normal tracking-wide leading-relaxed">
            Real-time insights into your <span className="text-gray-700 font-medium">DevOps</span> performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
            {wsConnected ? (
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-600">
              {wsConnected ? 'Live' : 'Polling Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid - Clean 2x2 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          kpis.slice(0, 4).map((kpi) => {
            // Map KPI IDs to appropriate icons with enhanced aesthetics
            const getIcon = (kpiId: string) => {
              switch (kpiId) {
                case 'projects':
                  return <Briefcase className="h-6 w-6" strokeWidth={2.5} />;
                case 'pipelines':
                  return <Workflow className="h-6 w-6" strokeWidth={2.5} />;
                case 'pipelineSuccess':
                  return <BarChart3 className="h-6 w-6" strokeWidth={2.5} />;
                case 'testPass':
                  return <FlaskConical className="h-6 w-6" strokeWidth={2.5} />;
                case 'deploymentSuccess':
                  return <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />;
                case 'avgDuration':
                  return <Timer className="h-6 w-6" strokeWidth={2.5} />;
                case 'deploymentFreq':
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

      {/* Main Content Tabs - Clean Monochromatic Theme */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-sm rounded-lg p-1.5">
          <TabsTrigger
            value="overview"
            className="group px-4 py-2.5 text-blue-600 hover:bg-gray-50 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:shadow-sm rounded-md transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <LayoutGrid className="h-4 w-4 text-blue-600 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Overview</span>
            {getNotificationCount('overview') > 0 && (
              <div className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="pipelines"
            className="group px-4 py-2.5 text-blue-600 hover:bg-gray-50 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:shadow-sm rounded-md transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <Workflow className="h-4 w-4 text-blue-600 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Pipelines</span>
            {getNotificationCount('pipelines') > 0 && (
              <div className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="group px-4 py-2.5 text-blue-600 hover:bg-gray-50 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:shadow-sm rounded-md transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <History className="h-4 w-4 text-blue-600 transition-colors duration-200" strokeWidth={2.5} />
            <span className="text-sm font-medium">Activity</span>
            {getNotificationCount('activity') > 0 && (
              <div className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="group px-4 py-2.5 text-blue-600 hover:bg-gray-50 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:shadow-sm rounded-md transition-all duration-200 [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-2"
          >
            <TrendingUp className="h-4 w-4 text-blue-600 transition-colors duration-200" />
            <span className="text-sm font-medium">Analytics</span>
            {getNotificationCount('analytics') > 0 && (
              <div className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Status Card - Clean & Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-blue-600">Pipeline Status</h3>
                <span className="text-xs text-gray-500">Recent 5</span>
              </div>
              <div className="space-y-2.5">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))
                ) : (
                  pipelines.slice(0, 5).map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between p-3.5 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {pipeline.status === 'deployed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={2.5} />
                          ) : pipeline.status === 'testing' ? (
                            <FlaskConical className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                          ) : pipeline.status === 'building' ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" strokeWidth={2.5} />
                          ) : pipeline.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                          ) : (
                            <CircleDot className="w-4 h-4 text-gray-300" strokeWidth={2.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {pipeline.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {pipeline.lastRun.toLocaleTimeString()} • {pipeline.duration}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          pipeline.status === 'deployed'
                            ? 'default'
                            : pipeline.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs ml-3"
                      >
                        {pipeline.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity Card - Clean & Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-blue-600">Recent Activity</h3>
                <span className="text-xs text-gray-500">Recent 6</span>
              </div>
              <div className="space-y-2.5">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))
                ) : (
                  activities.slice(0, 6).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3.5 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {activity.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                        ) : activity.severity === 'medium' ? (
                          <GitCommit className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            {activity.user}
                          </span>
                          <span className="text-xs text-gray-400">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
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
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-600 mb-5">
              All Pipelines
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              ) : (
                pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className="flex items-center justify-between p-4 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          pipeline.status === 'deployed'
                            ? 'bg-green-500'
                            : pipeline.status === 'testing'
                            ? 'bg-blue-600'
                            : pipeline.status === 'building'
                            ? 'bg-gray-400 animate-pulse'
                            : pipeline.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {pipeline.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Last run: {pipeline.lastRun.toLocaleString()} • Duration: {pipeline.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="font-medium text-sm text-gray-900">{pipeline.progress}%</p>
                      </div>
                      <Badge
                        variant={
                          pipeline.status === 'deployed'
                            ? 'default'
                            : pipeline.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
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
          <ProfessionalActivity activities={activities} maxItems={20} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deployment Frequency Chart - Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-blue-600">Deployment Frequency</h3>
                <span className="text-xs text-gray-500">Last 7 Days</span>
              </div>
              <ProfessionalAreaChart
                data={[
                  { label: "Mon", value: 12 },
                  { label: "Tue", value: 19 },
                  { label: "Wed", value: 15 },
                  { label: "Thu", value: 25 },
                  { label: "Fri", value: 22 },
                  { label: "Sat", value: 8 },
                  { label: "Sun", value: 5 },
                ]}
                height={260}
              />
            </div>

            {/* Pipeline Distribution - Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-blue-600">Pipeline Distribution</h3>
                <span className="text-xs text-gray-500">Total: 188</span>
              </div>
              <ProfessionalPieChart
                data={[
                  { label: "Success", value: 145, color: "#10b981" },
                  { label: "Failed", value: 23, color: "#ef4444" },
                  { label: "Running", value: 8, color: "#3b82f6" },
                  { label: "Cancelled", value: 12, color: "#9ca3af" },
                ]}
                height={260}
              />
            </div>

            {/* Test Pass Rate - Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-blue-600">Test Pass Rate</h3>
                <span className="text-xs text-gray-500">Monthly Trend</span>
              </div>
              <ProfessionalLineChart
                data={[
                  { label: "Week 1", value: 78 },
                  { label: "Week 2", value: 82 },
                  { label: "Week 3", value: 85 },
                  { label: "Week 4", value: 88 },
                ]}
                height={260}
              />
            </div>

            {/* Build Duration - Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-blue-600">Build Duration</h3>
                <span className="text-xs text-gray-500">Average (min)</span>
              </div>
              <ProfessionalBarChart
                data={[
                  { label: "Frontend", value: 4.2 },
                  { label: "Backend", value: 6.8 },
                  { label: "Mobile", value: 8.5 },
                  { label: "Analytics", value: 5.3 },
                ]}
                height={260}
              />
            </div>
          </div>

          {/* Additional Metrics - Clean */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-600">Avg Response Time</h4>
                <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">234ms</p>
              <p className="text-xs text-gray-500 mt-1">12% faster than last week</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-600">Code Coverage</h4>
                <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">87.3%</p>
              <p className="text-xs text-gray-500 mt-1">3.2% increase from last week</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-600">System Uptime</h4>
                <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">99.97%</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}