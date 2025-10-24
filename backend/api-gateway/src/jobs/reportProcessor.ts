import { Job } from 'bull';
import { jobQueueManager, QueueName, ReportJobType } from '../services/jobQueue';
import { logger } from '../utils/logger';
import { db } from '../config/database';

/**
 * Report Generation Job Processor
 *
 * Handles generating various types of reports:
 * - Pipeline execution reports
 * - Test coverage reports
 * - Security scan reports
 * - Analytics reports
 * - Audit log reports
 */

/**
 * Generate pipeline report
 */
async function generatePipelineReport(data: any): Promise<any> {
  const { pipelineId, startDate, endDate } = data;

  const runs = await db.pipelineRun.findMany({
    where: {
      pipelineId,
      startedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      pipeline: {
        include: {
          project: true,
        },
      },
      stages: true,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  // Calculate statistics
  const stats = {
    totalRuns: runs.length,
    successful: runs.filter((r) => r.status === 'SUCCESS').length,
    failed: runs.filter((r) => r.status === 'FAILED').length,
    cancelled: runs.filter((r) => r.status === 'CANCELLED').length,
    averageDuration: runs.reduce((sum, r) => sum + (r.duration || 0), 0) / runs.length,
    successRate: (runs.filter((r) => r.status === 'SUCCESS').length / runs.length) * 100,
  };

  return {
    pipelineId,
    dateRange: { startDate, endDate },
    stats,
    runs: runs.map((run) => ({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      duration: run.duration,
      stageCount: run.stages.length,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate test coverage report
 */
async function generateTestCoverageReport(data: any): Promise<any> {
  const { projectId, startDate, endDate } = data;

  const testRuns = await db.testRun.findMany({
    where: {
      testSuite: {
        projectId,
      },
      startedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      testSuite: true,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  // Calculate coverage stats
  const averageCoverage =
    testRuns.reduce((sum, r) => sum + (r.coverage || 0), 0) / testRuns.length;

  const coverageByType: any = {};
  testRuns.forEach((run) => {
    const type = run.testSuite.type;
    if (!coverageByType[type]) {
      coverageByType[type] = {
        count: 0,
        totalCoverage: 0,
      };
    }
    coverageByType[type].count++;
    coverageByType[type].totalCoverage += run.coverage || 0;
  });

  Object.keys(coverageByType).forEach((type) => {
    const data = coverageByType[type];
    data.averageCoverage = data.totalCoverage / data.count;
  });

  return {
    projectId,
    dateRange: { startDate, endDate },
    totalTestRuns: testRuns.length,
    averageCoverage,
    coverageByType,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate security scan report
 */
async function generateSecurityScanReport(data: any): Promise<any> {
  const { projectId, startDate, endDate } = data;

  const scans = await db.securityScan.findMany({
    where: {
      projectId,
      startedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  // Parse vulnerabilities from JSON
  const allVulnerabilities: any[] = [];
  scans.forEach((scan) => {
    try {
      const vulns = JSON.parse(scan.vulnerabilities);
      allVulnerabilities.push(...vulns);
    } catch (e) {
      // Skip invalid JSON
    }
  });

  // Group by severity
  const bySeverity = {
    critical: allVulnerabilities.filter((v) => v.severity === 'critical').length,
    high: allVulnerabilities.filter((v) => v.severity === 'high').length,
    medium: allVulnerabilities.filter((v) => v.severity === 'medium').length,
    low: allVulnerabilities.filter((v) => v.severity === 'low').length,
  };

  return {
    projectId,
    dateRange: { startDate, endDate },
    totalScans: scans.length,
    totalVulnerabilities: allVulnerabilities.length,
    vulnerabilitiesBySeverity: bySeverity,
    scans: scans.map((s) => ({
      id: s.id,
      scanType: s.scanType,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate analytics report
 */
async function generateAnalyticsReport(data: any): Promise<any> {
  const { startDate, endDate } = data;

  // Get metrics
  const metrics = await db.systemMetric.findMany({
    where: {
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  // Group by metric name
  const byName: any = {};
  metrics.forEach((metric) => {
    if (!byName[metric.name]) {
      byName[metric.name] = [];
    }
    byName[metric.name].push({
      value: metric.value,
      timestamp: metric.timestamp,
    });
  });

  // Calculate stats for each metric
  const stats: any = {};
  Object.keys(byName).forEach((name) => {
    const values = byName[name].map((m: any) => m.value);
    stats[name] = {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  });

  return {
    dateRange: { startDate, endDate },
    totalMetrics: metrics.length,
    stats,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate audit log report
 */
async function generateAuditLogReport(data: any): Promise<any> {
  const { userId, action, resource, startDate, endDate } = data;

  const where: any = {
    timestamp: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  const logs = await db.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Group by action
  const byAction: any = {};
  logs.forEach((log) => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
  });

  // Group by resource
  const byResource: any = {};
  logs.forEach((log) => {
    byResource[log.resource] = (byResource[log.resource] || 0) + 1;
  });

  return {
    filters: { userId, action, resource },
    dateRange: { startDate, endDate },
    totalLogs: logs.length,
    actionBreakdown: byAction,
    resourceBreakdown: byResource,
    logs: logs.slice(0, 100), // Return first 100 logs
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Process report job
 */
async function processReportJob(job: Job): Promise<any> {
  const reportType = job.name as ReportJobType;

  logger.info('Processing report job', {
    jobId: job.id,
    type: reportType,
  });

  let report: any;

  try {
    switch (reportType) {
      case ReportJobType.PIPELINE_REPORT:
        report = await generatePipelineReport(job.data);
        break;
      case ReportJobType.TEST_COVERAGE:
        report = await generateTestCoverageReport(job.data);
        break;
      case ReportJobType.SECURITY_SCAN:
        report = await generateSecurityScanReport(job.data);
        break;
      case ReportJobType.ANALYTICS:
        report = await generateAnalyticsReport(job.data);
        break;
      case ReportJobType.AUDIT_LOG:
        report = await generateAuditLogReport(job.data);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // Update job progress
    await job.progress(100);

    logger.info('Report generated successfully', {
      jobId: job.id,
      type: reportType,
    });

    // TODO: Store report in database or file system
    // TODO: Send email notification with report link

    return report;
  } catch (error: any) {
    logger.error('Report generation failed', {
      jobId: job.id,
      type: reportType,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Initialize report processor
 */
export function initializeReportProcessor(): void {
  // Register processor for all report job types
  Object.values(ReportJobType).forEach((reportType) => {
    jobQueueManager.processJobs(
      QueueName.REPORT,
      reportType,
      processReportJob,
      2 // Process up to 2 reports concurrently
    );
  });

  logger.info('Report processor initialized');
}
