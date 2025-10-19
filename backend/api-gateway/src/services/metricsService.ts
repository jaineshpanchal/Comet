import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { websocketService } from './websocketService';

const prisma = new PrismaClient();

interface KPIMetrics {
  totalPipelines: number;
  activePipelines: number;
  totalPipelineRuns: number;
  successRate: number;
  avgDuration: number;
  totalTestSuites: number;
  totalTestRuns: number;
  testPassRate: number;
  totalDeployments: number;
  deploymentSuccessRate: number;
  activeUsers: number;
  totalProjects: number;
}

interface PipelineMetrics {
  id: string;
  name: string;
  status: string;
  projectName: string;
  lastRunAt: Date | null;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
}

interface RecentActivity {
  id: string;
  type: 'pipeline' | 'test' | 'deployment';
  action: string;
  description: string;
  user: string;
  timestamp: Date;
  status: string;
}

class MetricsService {
  private metricsCache: any = null;
  private lastCacheUpdate: Date | null = null;
  private cacheTimeout = 30000; // 30 seconds

  /**
   * Get dashboard KPIs
   */
  async getKPIs(): Promise<KPIMetrics> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get pipeline metrics
      const totalPipelines = await prisma.pipeline.count();
      const activePipelines = await prisma.pipeline.count({
        where: { isActive: true }
      });

      const pipelineRuns = await prisma.pipelineRun.findMany({
        where: {
          startedAt: { gte: thirtyDaysAgo }
        }
      });

      const totalPipelineRuns = pipelineRuns.length;
      const successfulRuns = pipelineRuns.filter(r => r.status === 'SUCCESS').length;
      const successRate = totalPipelineRuns > 0
        ? (successfulRuns / totalPipelineRuns) * 100
        : 0;

      const completedRuns = pipelineRuns.filter(r => r.duration !== null);
      const avgDuration = completedRuns.length > 0
        ? completedRuns.reduce((sum, r) => sum + (r.duration || 0), 0) / completedRuns.length
        : 0;

      // Get test metrics
      const totalTestSuites = await prisma.testSuite.count({
        where: { isActive: true }
      });

      const testRuns = await prisma.testRun.findMany({
        where: {
          startedAt: { gte: thirtyDaysAgo }
        }
      });

      const totalTestRuns = testRuns.length;
      const passedTests = testRuns.filter(r => r.status === 'PASSED').length;
      const testPassRate = totalTestRuns > 0
        ? (passedTests / totalTestRuns) * 100
        : 0;

      // Get deployment metrics
      const deployments = await prisma.deployment.findMany({
        where: {
          deployedAt: { gte: thirtyDaysAgo }
        }
      });

      const totalDeployments = deployments.length;
      const successfulDeployments = deployments.filter(d => d.status === 'DEPLOYED').length;
      const deploymentSuccessRate = totalDeployments > 0
        ? (successfulDeployments / totalDeployments) * 100
        : 0;

      // Get user metrics
      const activeUsers = await prisma.user.count({
        where: { isActive: true }
      });

      // Get project metrics
      const totalProjects = await prisma.project.count({
        where: { isActive: true }
      });

      const kpis: KPIMetrics = {
        totalPipelines,
        activePipelines,
        totalPipelineRuns,
        successRate: Math.round(successRate * 10) / 10,
        avgDuration: Math.round(avgDuration),
        totalTestSuites,
        totalTestRuns,
        testPassRate: Math.round(testPassRate * 10) / 10,
        totalDeployments,
        deploymentSuccessRate: Math.round(deploymentSuccessRate * 10) / 10,
        activeUsers,
        totalProjects
      };

      return kpis;

    } catch (error: any) {
      logger.error('Error calculating KPIs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(limit = 10): Promise<PipelineMetrics[]> {
    try {
      const pipelines = await prisma.pipeline.findMany({
        take: limit,
        orderBy: { lastRunAt: 'desc' },
        include: {
          project: {
            select: {
              name: true
            }
          },
          pipelineRuns: {
            take: 20,
            orderBy: { startedAt: 'desc' }
          }
        }
      });

      return pipelines.map(pipeline => {
        const runs = pipeline.pipelineRuns;
        const totalRuns = runs.length;
        const successfulRuns = runs.filter(r => r.status === 'SUCCESS').length;
        const successRate = totalRuns > 0
          ? (successfulRuns / totalRuns) * 100
          : 0;

        const completedRuns = runs.filter(r => r.duration !== null);
        const avgDuration = completedRuns.length > 0
          ? completedRuns.reduce((sum, r) => sum + (r.duration || 0), 0) / completedRuns.length
          : 0;

        return {
          id: pipeline.id,
          name: pipeline.name,
          status: pipeline.status,
          projectName: pipeline.project.name,
          lastRunAt: pipeline.lastRunAt,
          totalRuns,
          successRate: Math.round(successRate * 10) / 10,
          avgDuration: Math.round(avgDuration)
        };
      });

    } catch (error: any) {
      logger.error('Error fetching pipeline metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 20): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent pipeline runs
      const pipelineRuns = await prisma.pipelineRun.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: {
          pipeline: {
            include: {
              project: true
            }
          },
          triggeredByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      pipelineRuns.forEach(run => {
        activities.push({
          id: run.id,
          type: 'pipeline',
          action: 'Pipeline Run',
          description: `${run.pipeline.project.name} - ${run.pipeline.name}`,
          user: run.triggeredByUser
            ? `${run.triggeredByUser.firstName} ${run.triggeredByUser.lastName}`
            : 'System',
          timestamp: run.startedAt,
          status: run.status
        });
      });

      // Get recent test runs
      const testRuns = await prisma.testRun.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: {
          testSuite: {
            include: {
              project: true
            }
          },
          triggeredByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      testRuns.forEach(run => {
        activities.push({
          id: run.id,
          type: 'test',
          action: 'Test Run',
          description: `${run.testSuite.project.name} - ${run.testSuite.name}`,
          user: run.triggeredByUser
            ? `${run.triggeredByUser.firstName} ${run.triggeredByUser.lastName}`
            : 'System',
          timestamp: run.startedAt,
          status: run.status
        });
      });

      // Get recent deployments
      const deployments = await prisma.deployment.findMany({
        take: 10,
        orderBy: { deployedAt: 'desc' },
        include: {
          project: true,
          deployedByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      deployments.forEach(deployment => {
        activities.push({
          id: deployment.id,
          type: 'deployment',
          action: 'Deployment',
          description: `${deployment.project.name} to ${deployment.environment}`,
          user: `${deployment.deployedByUser.firstName} ${deployment.deployedByUser.lastName}`,
          timestamp: deployment.deployedAt,
          status: deployment.status
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error: any) {
      logger.error('Error fetching recent activities', { error: error.message });
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      // Check cache first
      if (this.metricsCache && this.lastCacheUpdate) {
        const timeSinceUpdate = Date.now() - this.lastCacheUpdate.getTime();
        if (timeSinceUpdate < this.cacheTimeout) {
          logger.debug('Returning cached metrics');
          return this.metricsCache;
        }
      }

      logger.info('Calculating fresh dashboard metrics');

      const [kpis, pipelines, activities] = await Promise.all([
        this.getKPIs(),
        this.getPipelineMetrics(),
        this.getRecentActivities()
      ]);

      const metrics = {
        kpis,
        pipelines,
        activities,
        timestamp: new Date().toISOString()
      };

      // Update cache
      this.metricsCache = metrics;
      this.lastCacheUpdate = new Date();

      // Broadcast to WebSocket clients
      websocketService.broadcastMetricsUpdate(metrics);

      return metrics;

    } catch (error: any) {
      logger.error('Error fetching dashboard metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Invalidate metrics cache
   */
  invalidateCache(): void {
    this.metricsCache = null;
    this.lastCacheUpdate = null;
    logger.debug('Metrics cache invalidated');
  }

  /**
   * Start periodic metrics collection
   */
  startPeriodicCollection(intervalMs = 60000): void {
    setInterval(async () => {
      try {
        await this.getDashboardMetrics();
        logger.debug('Periodic metrics collection completed');
      } catch (error: any) {
        logger.error('Periodic metrics collection failed', { error: error.message });
      }
    }, intervalMs);

    logger.info('Periodic metrics collection started', { intervalMs });
  }
}

export const metricsService = new MetricsService();
export default metricsService;
