/**
 * Metrics Service
 * Handles all metrics-related API calls
 */

import { api, ApiResponse } from '@/lib/api';

export interface DashboardMetrics {
  kpis: {
    totalProjects: number;
    activePipelines: number;
    pipelineSuccessRate: number;
    testPassRate: number;
    deploymentSuccessRate: number;
    avgPipelineDuration: number;
    deploymentFrequency: number;
  };
  charts: {
    pipelineStatus: Record<string, number>;
    testTypes: Record<string, any>;
    deploymentEnvironments: Record<string, any>;
  };
  timeRange: string;
}

export interface PipelineMetrics {
  totalRuns: number;
  statusCounts: Record<string, number>;
  avgDuration: number;
  topPipelines: Array<{
    pipelineId: string;
    name: string;
    count: number;
    successCount: number;
  }>;
  successRate: number;
  timeRange: string;
}

export interface TestMetrics {
  totalRuns: number;
  totalTestsExecuted: number;
  totalTestsPassed: number;
  totalTestsFailed: number;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, any>;
  avgCoverage: number;
  passRate: number;
  timeRange: string;
}

export interface DeploymentMetrics {
  totalDeployments: number;
  environmentCounts: Record<string, any>;
  statusCounts: Record<string, number>;
  avgDuration: number;
  deploymentFrequency: number;
  successRate: number;
  timeRange: string;
}

export interface Activity {
  type: 'pipeline' | 'test' | 'deployment';
  id: string;
  name?: string;
  project: string;
  status: string;
  triggeredBy?: string;
  deployedBy?: string;
  timestamp: string;
  duration?: number;
  testType?: string;
  testsRun?: number;
  testsPassed?: number;
  version?: string;
  environment?: string;
}

export interface MetricTrend {
  metric: string;
  timeRange: string;
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface SystemHealth {
  users: {
    total: number;
    active: number;
  };
  resources: {
    totalProjects: number;
    totalPipelines: number;
    totalTests: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkThroughput: number;
  };
  uptime: number;
  timestamp: string;
}

export class MetricsService {
  /**
   * Get dashboard metrics (KPIs and charts)
   */
  static async getDashboardMetrics(timeRange: string = '24h'): Promise<DashboardMetrics> {
    const response = await api.get<DashboardMetrics>('/api/metrics/dashboard', { timeRange });
    return response.data!;
  }

  /**
   * Get overview metrics
   */
  static async getOverviewMetrics(timeRange: string = '24h') {
    const response = await api.get('/api/metrics/overview', { timeRange });
    return response.data!;
  }

  /**
   * Get pipeline metrics
   */
  static async getPipelineMetrics(timeRange: string = '24h', projectId?: string): Promise<PipelineMetrics> {
    const response = await api.get<PipelineMetrics>('/api/metrics/pipelines', {
      timeRange,
      projectId,
    });
    return response.data!;
  }

  /**
   * Get test metrics
   */
  static async getTestMetrics(timeRange: string = '24h', projectId?: string): Promise<TestMetrics> {
    const response = await api.get<TestMetrics>('/api/metrics/tests', {
      timeRange,
      projectId,
    });
    return response.data!;
  }

  /**
   * Get deployment metrics
   */
  static async getDeploymentMetrics(
    timeRange: string = '24h',
    projectId?: string,
    environment?: string
  ): Promise<DeploymentMetrics> {
    const response = await api.get<DeploymentMetrics>('/api/metrics/deployments', {
      timeRange,
      projectId,
      environment,
    });
    return response.data!;
  }

  /**
   * Get recent activities
   */
  static async getActivities(limit: number = 20, type: string = 'all'): Promise<Activity[]> {
    const response = await api.get<Activity[]>('/api/metrics/activities', {
      limit,
      type,
    });
    return response.data!;
  }

  /**
   * Get metrics trends
   */
  static async getMetricTrends(
    metric: 'pipelines' | 'tests' | 'deployments' | 'success_rate',
    timeRange: string = '30d'
  ): Promise<MetricTrend> {
    const response = await api.get<MetricTrend>('/api/metrics/trends', {
      metric,
      timeRange,
    });
    return response.data!;
  }

  /**
   * Get project-specific metrics
   */
  static async getProjectMetrics(projectId: string, timeRange: string = '24h') {
    const response = await api.get(`/api/metrics/project/${projectId}`, { timeRange });
    return response.data!;
  }

  /**
   * Get system health metrics (Admin only)
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<SystemHealth>('/api/metrics/health');
    return response.data!;
  }
}
