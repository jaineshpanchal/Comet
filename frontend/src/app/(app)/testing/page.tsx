'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TestService, type TestSuite, type TestRun } from '@/services/test.service'

const testTypeConfig = {
  UNIT: { label: 'Unit', color: 'bg-blue-100 text-blue-800' },
  INTEGRATION: { label: 'Integration', color: 'bg-purple-100 text-purple-800' },
  E2E: { label: 'E2E', color: 'bg-indigo-100 text-indigo-800' },
  PERFORMANCE: { label: 'Performance', color: 'bg-orange-100 text-orange-800' },
  SECURITY: { label: 'Security', color: 'bg-red-100 text-red-800' },
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  RUNNING: { label: 'Running', color: 'bg-blue-100 text-blue-800 animate-pulse' },
  PASSED: { label: 'Passed', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  SKIPPED: { label: 'Skipped', color: 'bg-yellow-100 text-yellow-800' },
}

export default function TestingPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
    }
  }, [router]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('suites')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const fetchTestSuites = useCallback(async () => {
    try {
      setError(null)
      const data = await TestService.getTestSuites()
      setTestSuites(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch test suites')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchTestRuns = useCallback(async (suiteId: string) => {
    try {
      setError(null)
      const data = await TestService.getTestRuns(suiteId, 10)
      setTestRuns(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch test runs')
    }
  }, [])

  useEffect(() => {
    fetchTestSuites()
  }, [fetchTestSuites])

  useEffect(() => {
    if (selectedSuite) {
      fetchTestRuns(selectedSuite.id)
    }
  }, [selectedSuite, fetchTestRuns])

  // Auto-refresh running tests every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const hasRunningTests = testRuns.some(run => run.status === 'RUNNING')
      if (hasRunningTests && selectedSuite) {
        fetchTestRuns(selectedSuite.id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [testRuns, selectedSuite, fetchTestRuns])

  const handleRunTestSuite = async (suiteId: string) => {
    try {
      setIsRunning(suiteId)
      setError(null)
      await TestService.runTestSuite(suiteId)
      await fetchTestSuites()
      if (selectedSuite?.id === suiteId) {
        await fetchTestRuns(suiteId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run test suite')
    } finally {
      setIsRunning(null)
    }
  }

  const handleSelectSuite = (suite: TestSuite) => {
    setSelectedSuite(suite)
    setActiveTab('runs')
  }

  const handleCancelTestRun = async (runId: string) => {
    try {
      setError(null)
      await TestService.cancelTestRun(runId)
      if (selectedSuite) {
        await fetchTestRuns(selectedSuite.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel test run')
    }
  }

  const filteredTestSuites = testSuites.filter(suite => {
    if (typeFilter !== 'all' && suite.type !== typeFilter) return false
    if (statusFilter === 'active' && !suite.isActive) return false
    if (statusFilter === 'inactive' && suite.isActive) return false
    return true
  })

  const getTestStats = (suite: TestSuite) => {
    // TestSuite from service doesn't have test stats, use _count if available
    const totalTests = suite._count?.testRuns || 0
    const passedTests = 0 // Not available in TestSuite, would need to aggregate from runs
    const passRate = '0'
    return { totalTests, passedTests, passRate }
  }

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Test Suites</h1>
            <p className="text-muted-foreground">Manage and execute test suites</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Test Suites</h1>
          <p className="text-muted-foreground">Manage and execute test suites</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="suites">
        <TabsList>
          <TabsTrigger value="suites">All Test Suites ({testSuites.length})</TabsTrigger>
          <TabsTrigger value="runs" disabled={!selectedSuite}>
            Test Runs {selectedSuite && `(${selectedSuite.name})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suites" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </Button>
            {Object.entries(testTypeConfig).map(([type, config]) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All Status
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>

          {filteredTestSuites.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No test suites found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTestSuites.map(suite => {
                const stats = getTestStats(suite)
                return (
                  <Card
                    key={suite.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectSuite(suite)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">{suite.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {suite.description || 'No description'}
                          </CardDescription>
                        </div>
                        <Badge className={testTypeConfig[suite.type as keyof typeof testTypeConfig]?.color || testTypeConfig.UNIT.color}>
                          {testTypeConfig[suite.type as keyof typeof testTypeConfig]?.label || suite.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Tests</p>
                          <p className="text-xl font-bold">{stats.totalTests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Passed</p>
                          <p className="text-xl font-bold text-green-600">{stats.passedTests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pass Rate</p>
                          <p className="text-xl font-bold">{stats.passRate}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {suite.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunTestSuite(suite.id)
                          }}
                          disabled={isRunning === suite.id || !suite.isActive}
                        >
                          {isRunning === suite.id ? 'Running...' : 'Run Tests'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          {selectedSuite && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedSuite.name}</CardTitle>
                    <CardDescription>Recent test runs</CardDescription>
                  </div>
                  <Button onClick={() => handleRunTestSuite(selectedSuite.id)}>
                    Run Tests
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {testRuns.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No test runs yet. Click "Run Tests" to start.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testRuns.map(run => (
                      <Card key={run.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={statusConfig[run.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color}>
                                  {statusConfig[run.status as keyof typeof statusConfig]?.label || run.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(run.startedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Duration</p>
                                  <p className="font-medium">{formatDuration(run.duration)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Total</p>
                                  <p className="font-medium">{run.totalTests || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Passed</p>
                                  <p className="font-medium text-green-600">{run.passedTests || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Failed</p>
                                  <p className="font-medium text-red-600">{run.failedTests || 0}</p>
                                </div>
                              </div>

                              {run.triggeredByUser && (
                                <p className="text-sm text-muted-foreground">
                                  Triggered by: {run.triggeredByUser.firstName} {run.triggeredByUser.lastName}
                                </p>
                              )}

                              {run.status === 'FAILED' && run.results?.error && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm text-red-800">{run.results.error}</p>
                                </div>
                              )}
                            </div>

                            {run.status === 'RUNNING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelTestRun(run.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
