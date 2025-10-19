/**
 * Security Scanning Service
 * Integrates with npm audit and other security tools
 */

import { PrismaClient, SecurityScanType, SecurityScanStatus } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { websocketService } from './websocketService';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface Vulnerability {
  id: string;
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  package: string;
  version: string;
  fixedIn?: string;
  cve?: string;
  cwe?: string;
  url?: string;
  description?: string;
}

interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
}

export class SecurityScanService {
  /**
   * Run npm audit scan for a project
   */
  static async runNpmAudit(projectId: string, projectPath: string, userId: string): Promise<string> {
    const scan = await prisma.securityScan.create({
      data: {
        projectId,
        scanType: SecurityScanType.DEPENDENCY,
        status: SecurityScanStatus.RUNNING,
        initiatedBy: userId,
      },
    });

    try {
      const startTime = Date.now();

      // Run npm audit with JSON output
      const { stdout, stderr } = await execAsync('npm audit --json', {
        cwd: projectPath,
        timeout: 120000, // 2 minutes timeout
      });

      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Parse audit results
      const auditData = JSON.parse(stdout);
      const vulnerabilities = this.parseNpmAuditResults(auditData);
      const summary = this.calculateSummary(vulnerabilities);

      // Update scan record
      await prisma.securityScan.update({
        where: { id: scan.id },
        data: {
          status: SecurityScanStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          vulnerabilities: JSON.stringify(vulnerabilities),
          summary: JSON.stringify(summary),
        },
      });

      // Broadcast scan completion
      websocketService.broadcastSecurityEvent({
        type: 'scan_completed',
        scanId: scan.id,
        projectId,
        scanType: 'dependency',
        summary,
        severity: summary.critical > 0 ? 'critical' : summary.high > 0 ? 'high' : 'moderate',
      });

      logger.info('npm audit scan completed', {
        projectId,
        scanId: scan.id,
        vulnerabilities: vulnerabilities.length,
        duration,
      });

      return scan.id;
    } catch (error: any) {
      await prisma.securityScan.update({
        where: { id: scan.id },
        data: {
          status: SecurityScanStatus.FAILED,
          completedAt: new Date(),
          summary: JSON.stringify({ error: error.message }),
        },
      });

      logger.error('npm audit scan failed', {
        projectId,
        scanId: scan.id,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Parse npm audit JSON results
   */
  private static parseNpmAuditResults(auditData: any): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    if (auditData.vulnerabilities) {
      Object.entries(auditData.vulnerabilities).forEach(([packageName, vulnData]: [string, any]) => {
        vulnData.via.forEach((via: any) => {
          if (typeof via === 'object') {
            vulnerabilities.push({
              id: via.source?.toString() || `${packageName}-${via.title}`,
              title: via.title || 'Unknown vulnerability',
              severity: via.severity || 'moderate',
              package: packageName,
              version: vulnData.range || 'unknown',
              fixedIn: vulnData.fixAvailable?.version,
              cve: via.cve?.[0],
              cwe: via.cwe?.[0],
              url: via.url,
              description: via.overview,
            });
          }
        });
      });
    }

    return vulnerabilities;
  }

  /**
   * Calculate vulnerability summary
   */
  private static calculateSummary(vulnerabilities: Vulnerability[]): ScanSummary {
    return {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter((v) => v.severity === 'critical').length,
      high: vulnerabilities.filter((v) => v.severity === 'high').length,
      moderate: vulnerabilities.filter((v) => v.severity === 'moderate').length,
      low: vulnerabilities.filter((v) => v.severity === 'low').length,
      info: 0,
    };
  }

  /**
   * Get scan results
   */
  static async getScanResults(scanId: string) {
    const scan = await prisma.securityScan.findUnique({
      where: { id: scanId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!scan) {
      throw new Error('Scan not found');
    }

    return {
      ...scan,
      vulnerabilities: scan.vulnerabilities ? JSON.parse(scan.vulnerabilities) : [],
      summary: scan.summary ? JSON.parse(scan.summary) : null,
    };
  }

  /**
   * Get all scans for a project
   */
  static async getProjectScans(projectId: string, limit: number = 20) {
    const scans = await prisma.securityScan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return scans.map((scan) => ({
      ...scan,
      summary: scan.summary ? JSON.parse(scan.summary) : null,
    }));
  }

  /**
   * Get security statistics
   */
  static async getSecurityStatistics(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const [totalScans, recentScans] = await Promise.all([
      prisma.securityScan.count({ where }),
      prisma.securityScan.findMany({
        where: {
          ...where,
          status: SecurityScanStatus.COMPLETED,
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate aggregate statistics from recent scans
    let totalVulnerabilities = 0;
    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    recentScans.forEach((scan) => {
      if (scan.summary) {
        const summary = JSON.parse(scan.summary);
        totalVulnerabilities += summary.total || 0;
        criticalCount += summary.critical || 0;
        highCount += summary.high || 0;
        moderateCount += summary.moderate || 0;
        lowCount += summary.low || 0;
      }
    });

    return {
      totalScans,
      totalVulnerabilities,
      criticalVulnerabilities: criticalCount,
      highVulnerabilities: highCount,
      moderateVulnerabilities: moderateCount,
      lowVulnerabilities: lowCount,
      recentScans: recentScans.slice(0, 5).map((scan) => ({
        id: scan.id,
        scanType: scan.scanType,
        status: scan.status,
        createdAt: scan.createdAt,
        summary: scan.summary ? JSON.parse(scan.summary) : null,
      })),
    };
  }

  /**
   * Schedule automatic scans (placeholder for cron job integration)
   */
  static async scheduleAutomaticScan(projectId: string, interval: 'daily' | 'weekly' | 'monthly') {
    // This would integrate with a job scheduler like node-cron or Bull
    logger.info('Scheduled automatic security scan', { projectId, interval });
    // Implementation would depend on the scheduling system used
  }
}
