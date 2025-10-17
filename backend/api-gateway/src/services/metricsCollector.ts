import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Time range to date conversion
interface TimeRangeConfig {
  hours: number;
  label: string;
}

const TIME_RANGES: Record<string, TimeRangeConfig> = {
  '1h': { hours: 1, label: 'Last Hour' },
  '24h': { hours: 24, label: 'Last 24 Hours' },
  '7d': { hours: 24 * 7, label: 'Last 7 Days' },
  '30d': { hours: 24 * 30, label: 'Last 30 Days' },
  '90d': { hours: 24 * 90, label: 'Last 90 Days' }
};

/**
 * Metrics Collector Service
 * Collects and aggregates metrics from various sources
 */
export class MetricsCollector {

  /**
   * Get overview metrics for dashboard
   */
  public async getOverviewMetrics(timeRange: string, user: any): Promise<any> {
    const startDate = this.getStartDate(timeRange);

    const where = this.buildUserAccessFilter(user);

    // Get counts
    const [totalPipelines, totalTests, totalDeployments, totalProjects] = await Promise.all([
      prisma.pipeline.count({ where }),
      prisma.testSuite.count({ where }),
      prisma.deployment.count({
        where: {
          ...where,
          deployedAt: { gte: startDate }
        }
      }),
      prisma.project.count({ where })
    ]);

    // Get pipeline runs
    const pipelineRuns = await prisma.pipelineRun.count({
      where: {
        pipeline: where,
        startedAt: { gte: startDate }
      }
    });

    const successfulPipelines = await prisma.pipelineRun.count({
      where: {
        pipeline: where,
        startedAt: { gte: startDate },
        status: 'SUCCESS'
      }
    });

    // Get test runs
    const testRuns = await prisma.testRun.count({
      where: {
        testSuite: where,
        startedAt: { gte: startDate }
      }
    });

    const passedTests = await prisma.testRun.count({
      where: {
        testSuite: where,
        startedAt: { gte: startDate },
        status: 'PASSED'
      }
    });

    // Get successful deployments
    const successfulDeployments = await prisma.deployment.count({
      where: {
        project: where,
        deployedAt: { gte: startDate },
        status: 'DEPLOYED'
      }
    });

    // Calculate rates
    const pipelineSuccessRate = pipelineRuns > 0 ? (successfulPipelines / pipelineRuns) * 100 : 0;
    const testPassRate = testRuns > 0 ? (passedTests / testRuns) * 100 : 0;
    const deploymentSuccessRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;

    return {
      totalProjects,
      totalPipelines,
      totalTests,
      totalDeployments,
      pipelineRuns,
      successfulPipelines,
      testRuns,
      passedTests,
      successfulDeployments,
      pipelineSuccessRate: Math.round(pipelineSuccessRate * 10) / 10,
      testPassRate: Math.round(testPassRate * 10) / 10,
      deploymentSuccessRate: Math.round(deploymentSuccessRate * 10) / 10,
      timeRange: TIME_RANGES[timeRange]?.label || timeRange
    };
  }

  /**
   * Get pipeline-specific metrics
   */
  public async getPipelineMetrics(timeRange: string, projectId: string | undefined, user: any): Promise<any> {
    const startDate = this.getStartDate(timeRange);
    const where = this.buildUserAccessFilter(user, projectId);

    const pipelineRuns = await prisma.pipelineRun.findMany({
      where: {
        pipeline: where,
        startedAt: { gte: startDate }
      },
      include: {
        pipeline: {
          select: {
            name: true,
            projectId: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Aggregate by status
    const statusCounts = pipelineRuns.reduce((acc, run) => {
      acc[run.status] = (acc[run.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average duration
    const completedRuns = pipelineRuns.filter(r => r.duration && r.duration > 0);
    const avgDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.duration || 0), 0) / completedRuns.length
      : 0;

    // Get most active pipelines
    const pipelineActivity = pipelineRuns.reduce((acc, run) => {
      const key = run.pipelineId;
      if (!acc[key]) {
        acc[key] = {
          pipelineId: run.pipelineId,
          name: run.pipeline.name,
          count: 0,
          successCount: 0
        };
      }
      acc[key].count++;
      if (run.status === 'SUCCESS') {
        acc[key].successCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    const topPipelines = Object.values(pipelineActivity)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRuns: pipelineRuns.length,
      statusCounts,
      avgDuration: Math.round(avgDuration),
      topPipelines,
      successRate: pipelineRuns.length > 0
        ? Math.round(((statusCounts.SUCCESS || 0) / pipelineRuns.length) * 100 * 10) / 10
        : 0,
      timeRange: TIME_RANGES[timeRange]?.label || timeRange
    };
  }

  /**
   * Get test-specific metrics
   */
  public async getTestMetrics(timeRange: string, projectId: string | undefined, user: any): Promise<any> {
    const startDate = this.getStartDate(timeRange);
    const where = this.buildUserAccessFilter(user, projectId);

    const testRuns = await prisma.testRun.findMany({
      where: {
        testSuite: where,
        startedAt: { gte: startDate }
      },
      include: {
        testSuite: {
          select: {
            name: true,
            type: true,
            projectId: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Aggregate by status
    const statusCounts = testRuns.reduce((acc, run) => {
      acc[run.status] = (acc[run.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate by test type
    const typeCounts = testRuns.reduce((acc, run) => {
      const type = run.testSuite.type;
      if (!acc[type]) {
        acc[type] = { total: 0, passed: 0, failed: 0 };
      }
      acc[type].total++;
      if (run.status === 'PASSED') acc[type].passed++;
      if (run.status === 'FAILED') acc[type].failed++;
      return acc;
    }, {} as Record<string, any>);

    // Calculate total tests executed
    const totalTestsExecuted = testRuns.reduce((sum, run) => sum + (run.totalTests || 0), 0);
    const totalTestsPassed = testRuns.reduce((sum, run) => sum + (run.passedTests || 0), 0);
    const totalTestsFailed = testRuns.reduce((sum, run) => sum + (run.failedTests || 0), 0);

    // Calculate average coverage
    const runsWithCoverage = testRuns.filter(r => r.coverage && r.coverage > 0);
    const avgCoverage = runsWithCoverage.length > 0
      ? runsWithCoverage.reduce((sum, r) => sum + (r.coverage || 0), 0) / runsWithCoverage.length
      : 0;

    return {
      totalRuns: testRuns.length,
      totalTestsExecuted,
      totalTestsPassed,
      totalTestsFailed,
      statusCounts,
      typeCounts,
      avgCoverage: Math.round(avgCoverage * 10) / 10,
      passRate: totalTestsExecuted > 0
        ? Math.round((totalTestsPassed / totalTestsExecuted) * 100 * 10) / 10
        : 0,
      timeRange: TIME_RANGES[timeRange]?.label || timeRange
    };
  }

  /**
   * Get deployment-specific metrics
   */
  public async getDeploymentMetrics(
    timeRange: string,
    projectId: string | undefined,
    environment: string | undefined,
    user: any
  ): Promise<any> {
    const startDate = this.getStartDate(timeRange);
    const where = this.buildUserAccessFilter(user, projectId);

    const deploymentWhere: any = {
      project: where,
      deployedAt: { gte: startDate }
    };

    if (environment) {
      deploymentWhere.environment = environment;
    }

    const deployments = await prisma.deployment.findMany({
      where: deploymentWhere,
      include: {
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        deployedAt: 'desc'
      }
    });

    // Aggregate by environment
    const environmentCounts = deployments.reduce((acc, dep) => {
      const env = dep.environment;
      if (!acc[env]) {
        acc[env] = { total: 0, deployed: 0, failed: 0, rolledBack: 0 };
      }
      acc[env].total++;
      if (dep.status === 'DEPLOYED') acc[env].deployed++;
      if (dep.status === 'FAILED') acc[env].failed++;
      if (dep.status === 'ROLLED_BACK') acc[env].rolledBack++;
      return acc;
    }, {} as Record<string, any>);

    // Aggregate by status
    const statusCounts = deployments.reduce((acc, dep) => {
      acc[dep.status] = (acc[dep.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average duration
    const completedDeployments = deployments.filter(d => d.duration && d.duration > 0);
    const avgDuration = completedDeployments.length > 0
      ? completedDeployments.reduce((sum, d) => sum + (d.duration || 0), 0) / completedDeployments.length
      : 0;

    // Get deployment frequency (deployments per day)
    const timeRangeHours = TIME_RANGES[timeRange]?.hours || 24;
    const deploymentFrequency = deployments.length / (timeRangeHours / 24);

    return {
      totalDeployments: deployments.length,
      environmentCounts,
      statusCounts,
      avgDuration: Math.round(avgDuration),
      deploymentFrequency: Math.round(deploymentFrequency * 10) / 10,
      successRate: deployments.length > 0
        ? Math.round(((statusCounts.DEPLOYED || 0) / deployments.length) * 100 * 10) / 10
        : 0,
      timeRange: TIME_RANGES[timeRange]?.label || timeRange
    };
  }

  /**
   * Get metrics for a specific project
   */
  public async getProjectMetrics(projectId: string, timeRange: string): Promise<any> {
    const startDate = this.getStartDate(timeRange);

    const [project, pipelines, testSuites, deployments, pipelineRuns, testRuns] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.pipeline.count({ where: { projectId } }),
      prisma.testSuite.count({ where: { projectId } }),
      prisma.deployment.findMany({
        where: {
          projectId,
          deployedAt: { gte: startDate }
        }
      }),
      prisma.pipelineRun.findMany({
        where: {
          pipeline: { projectId },
          startedAt: { gte: startDate }
        }
      }),
      prisma.testRun.findMany({
        where: {
          testSuite: { projectId },
          startedAt: { gte: startDate }
        }
      })
    ]);

    // Calculate pipeline stats
    const pipelineStats = {
      total: pipelines,
      runs: pipelineRuns.length,
      successful: pipelineRuns.filter(r => r.status === 'SUCCESS').length,
      failed: pipelineRuns.filter(r => r.status === 'FAILED').length,
      successRate: pipelineRuns.length > 0
        ? Math.round((pipelineRuns.filter(r => r.status === 'SUCCESS').length / pipelineRuns.length) * 100 * 10) / 10
        : 0
    };

    // Calculate test stats
    const testStats = {
      total: testSuites,
      runs: testRuns.length,
      passed: testRuns.filter(r => r.status === 'PASSED').length,
      failed: testRuns.filter(r => r.status === 'FAILED').length,
      passRate: testRuns.length > 0
        ? Math.round((testRuns.filter(r => r.status === 'PASSED').length / testRuns.length) * 100 * 10) / 10
        : 0
    };

    // Calculate deployment stats
    const deploymentStats = {
      total: deployments.length,
      deployed: deployments.filter(d => d.status === 'DEPLOYED').length,
      failed: deployments.filter(d => d.status === 'FAILED').length,
      rolledBack: deployments.filter(d => d.status === 'ROLLED_BACK').length,
      successRate: deployments.length > 0
        ? Math.round((deployments.filter(d => d.status === 'DEPLOYED').length / deployments.length) * 100 * 10) / 10
        : 0
    };

    return {
      project,
      pipelineStats,
      testStats,
      deploymentStats,
      timeRange: TIME_RANGES[timeRange]?.label || timeRange
    };
  }

  /**
   * Get dashboard metrics (KPIs)
   */
  public async getDashboardMetrics(timeRange: string, user: any): Promise<any> {
    const overview = await this.getOverviewMetrics(timeRange, user);
    const pipelineMetrics = await this.getPipelineMetrics(timeRange, undefined, user);
    const testMetrics = await this.getTestMetrics(timeRange, undefined, user);
    const deploymentMetrics = await this.getDeploymentMetrics(timeRange, undefined, undefined, user);

    return {
      kpis: {
        totalProjects: overview.totalProjects,
        activePipelines: overview.totalPipelines,
        pipelineSuccessRate: overview.pipelineSuccessRate,
        testPassRate: overview.testPassRate,
        deploymentSuccessRate: overview.deploymentSuccessRate,
        avgPipelineDuration: pipelineMetrics.avgDuration,
        deploymentFrequency: deploymentMetrics.deploymentFrequency
      },
      charts: {
        pipelineStatus: pipelineMetrics.statusCounts,
        testTypes: testMetrics.typeCounts,
        deploymentEnvironments: deploymentMetrics.environmentCounts
      },
      timeRange: TIME_RANGES[timeRange]?.label || timeRange
    };
  }

  /**
   * Get recent activities
   */
  public async getRecentActivities(limit: number, type: string, user: any): Promise<any[]> {
    const where = this.buildUserAccessFilter(user);
    const activities: any[] = [];

    if (type === 'all' || type === 'pipeline') {
      const pipelineRuns = await prisma.pipelineRun.findMany({
        where: {
          pipeline: where
        },
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          pipeline: {
            select: {
              name: true,
              project: {
                select: {
                  name: true
                }
              }
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

      activities.push(...pipelineRuns.map(run => ({
        type: 'pipeline',
        id: run.id,
        name: run.pipeline.name,
        project: run.pipeline.project.name,
        status: run.status,
        triggeredBy: run.triggeredByUser ? `${run.triggeredByUser.firstName} ${run.triggeredByUser.lastName}` : 'System',
        timestamp: run.startedAt,
        duration: run.duration
      })));
    }

    if (type === 'all' || type === 'test') {
      const testRuns = await prisma.testRun.findMany({
        where: {
          testSuite: where
        },
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          testSuite: {
            select: {
              name: true,
              type: true,
              project: {
                select: {
                  name: true
                }
              }
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

      activities.push(...testRuns.map(run => ({
        type: 'test',
        id: run.id,
        name: run.testSuite.name,
        testType: run.testSuite.type,
        project: run.testSuite.project.name,
        status: run.status,
        triggeredBy: run.triggeredByUser ? `${run.triggeredByUser.firstName} ${run.triggeredByUser.lastName}` : 'System',
        timestamp: run.startedAt,
        testsRun: run.totalTests,
        testsPassed: run.passedTests
      })));
    }

    if (type === 'all' || type === 'deployment') {
      const deployments = await prisma.deployment.findMany({
        where: {
          project: where
        },
        take: limit,
        orderBy: { deployedAt: 'desc' },
        include: {
          project: {
            select: {
              name: true
            }
          },
          deployedByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      activities.push(...deployments.map(dep => ({
        type: 'deployment',
        id: dep.id,
        project: dep.project.name,
        version: dep.version,
        environment: dep.environment,
        status: dep.status,
        deployedBy: `${dep.deployedByUser.firstName} ${dep.deployedByUser.lastName}`,
        timestamp: dep.deployedAt,
        duration: dep.duration
      })));
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get metrics trends over time
   */
  public async getMetricTrends(metric: string, timeRange: string, user: any): Promise<any> {
    const startDate = this.getStartDate(timeRange);
    const where = this.buildUserAccessFilter(user);

    const dataPoints: any[] = [];
    const intervals = this.getTimeIntervals(timeRange);

    for (const interval of intervals) {
      let value = 0;

      switch (metric) {
        case 'pipelines':
          value = await prisma.pipelineRun.count({
            where: {
              pipeline: where,
              startedAt: {
                gte: interval.start,
                lt: interval.end
              }
            }
          });
          break;

        case 'tests':
          value = await prisma.testRun.count({
            where: {
              testSuite: where,
              startedAt: {
                gte: interval.start,
                lt: interval.end
              }
            }
          });
          break;

        case 'deployments':
          value = await prisma.deployment.count({
            where: {
              project: where,
              deployedAt: {
                gte: interval.start,
                lt: interval.end
              }
            }
          });
          break;

        case 'success_rate':
          const total = await prisma.pipelineRun.count({
            where: {
              pipeline: where,
              startedAt: {
                gte: interval.start,
                lt: interval.end
              }
            }
          });
          const successful = await prisma.pipelineRun.count({
            where: {
              pipeline: where,
              startedAt: {
                gte: interval.start,
                lt: interval.end
              },
              status: 'SUCCESS'
            }
          });
          value = total > 0 ? Math.round((successful / total) * 100) : 0;
          break;
      }

      dataPoints.push({
        timestamp: interval.start,
        value
      });
    }

    return {
      metric,
      timeRange: TIME_RANGES[timeRange]?.label || timeRange,
      dataPoints
    };
  }

  /**
   * Get system health metrics
   */
  public async getSystemHealthMetrics(): Promise<any> {
    const [totalUsers, activeUsers, totalProjects, totalPipelines, totalTests] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.project.count({ where: { isActive: true } }),
      prisma.pipeline.count({ where: { isActive: true } }),
      prisma.testSuite.count({ where: { isActive: true } })
    ]);

    // System resource metrics (simulated - in production, use actual system metrics)
    const systemMetrics = {
      cpu: Math.random() * 30 + 20, // 20-50%
      memory: Math.random() * 40 + 30, // 30-70%
      disk: Math.random() * 20 + 40, // 40-60%
      network: Math.random() * 50 + 100 // 100-150 Mbps
    };

    return {
      users: {
        total: totalUsers,
        active: activeUsers
      },
      resources: {
        totalProjects,
        totalPipelines,
        totalTests
      },
      system: {
        cpuUsage: Math.round(systemMetrics.cpu * 10) / 10,
        memoryUsage: Math.round(systemMetrics.memory * 10) / 10,
        diskUsage: Math.round(systemMetrics.disk * 10) / 10,
        networkThroughput: Math.round(systemMetrics.network * 10) / 10
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper: Get start date based on time range
   */
  private getStartDate(timeRange: string): Date {
    const config = TIME_RANGES[timeRange] || TIME_RANGES['24h'];
    return new Date(Date.now() - config.hours * 60 * 60 * 1000);
  }

  /**
   * Helper: Build user access filter
   */
  private buildUserAccessFilter(user: any, projectId?: string): any {
    const filter: any = {};

    if (projectId) {
      filter.projectId = projectId;
    }

    // Allow unauthenticated access in development mode
    if (user && user.role !== 'ADMIN') {
      filter.OR = [
        { ownerId: user.id },
        { team: { members: { some: { userId: user.id } } } }
      ];
    }

    return filter;
  }

  /**
   * Helper: Get time intervals for trends
   */
  private getTimeIntervals(timeRange: string): Array<{ start: Date; end: Date }> {
    const now = new Date();
    const intervals: Array<{ start: Date; end: Date }> = [];

    let intervalCount = 0;
    let intervalMs = 0;

    switch (timeRange) {
      case '7d':
        intervalCount = 7;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '30d':
        intervalCount = 30;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '90d':
        intervalCount = 18;
        intervalMs = 5 * 24 * 60 * 60 * 1000; // 5 days
        break;
      default:
        intervalCount = 30;
        intervalMs = 24 * 60 * 60 * 1000;
    }

    for (let i = intervalCount - 1; i >= 0; i--) {
      const end = new Date(now.getTime() - i * intervalMs);
      const start = new Date(end.getTime() - intervalMs);
      intervals.push({ start, end });
    }

    return intervals;
  }
}

// Export singleton instance
const metricsCollector = new MetricsCollector();
export default metricsCollector;
