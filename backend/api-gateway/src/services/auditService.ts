/**
 * Audit Logging Service
 * Tracks user actions for compliance and security
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Common audit actions
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  REGISTER = 'auth.register',
  PASSWORD_CHANGE = 'auth.password_change',
  PASSWORD_RESET_REQUEST = 'auth.password_reset_request',
  PASSWORD_RESET_COMPLETE = 'auth.password_reset_complete',
  TOKEN_REFRESH = 'auth.token_refresh',

  // User Management
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_ACTIVATE = 'user.activate',
  USER_DEACTIVATE = 'user.deactivate',
  USER_ROLE_CHANGE = 'user.role_change',
  USER_PERMISSION_ADD = 'user.permission_add',
  USER_PERMISSION_REMOVE = 'user.permission_remove',

  // Team Management
  TEAM_CREATE = 'team.create',
  TEAM_UPDATE = 'team.update',
  TEAM_DELETE = 'team.delete',
  TEAM_MEMBER_ADD = 'team.member_add',
  TEAM_MEMBER_REMOVE = 'team.member_remove',

  // Project Management
  PROJECT_CREATE = 'project.create',
  PROJECT_UPDATE = 'project.update',
  PROJECT_DELETE = 'project.delete',
  PROJECT_SETTINGS_UPDATE = 'project.settings_update',

  // Pipeline Management
  PIPELINE_CREATE = 'pipeline.create',
  PIPELINE_UPDATE = 'pipeline.update',
  PIPELINE_DELETE = 'pipeline.delete',
  PIPELINE_EXECUTE = 'pipeline.execute',
  PIPELINE_CANCEL = 'pipeline.cancel',

  // Test Management
  TEST_CREATE = 'test.create',
  TEST_UPDATE = 'test.update',
  TEST_DELETE = 'test.delete',
  TEST_EXECUTE = 'test.execute',

  // Deployment Management
  DEPLOYMENT_TRIGGER = 'deployment.trigger',
  DEPLOYMENT_APPROVE = 'deployment.approve',
  DEPLOYMENT_ROLLBACK = 'deployment.rollback',

  // Integration Management
  INTEGRATION_CREATE = 'integration.create',
  INTEGRATION_UPDATE = 'integration.update',
  INTEGRATION_DELETE = 'integration.delete',

  // System Management
  SYSTEM_SETTINGS_UPDATE = 'system.settings_update',
  SYSTEM_LOGS_VIEW = 'system.logs_view',
  SYSTEM_METRICS_VIEW = 'system.metrics_view',
  SYSTEM_AUDIT_LOGS_VIEW = 'system.audit_logs_view',
}

export class AuditService {
  /**
   * Create a new audit log entry
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          metadata: JSON.stringify(data.metadata || {}),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      logger.info('Audit log created', {
        action: data.action,
        resource: data.resource,
        userId: data.userId,
      });
    } catch (error) {
      // Don't throw error to prevent audit logging from breaking the main flow
      logger.error('Failed to create audit log', { error, data });
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getLogs(options: {
    userId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (resource) where.resource = { contains: resource };
    if (resourceId) where.resourceId = resourceId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : {},
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get recent audit logs for a user
   */
  static async getUserLogs(userId: string, limit: number = 20) {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {},
    }));
  }

  /**
   * Get audit statistics
   */
  static async getStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [
      totalLogs,
      actionCounts,
      resourceCounts,
      userCounts,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: true,
        orderBy: { _count: { resource: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      topActions: actionCounts.map((a) => ({ action: a.action, count: a._count })),
      topResources: resourceCounts.map((r) => ({ resource: r.resource, count: r._count })),
      topUsers: userCounts.map((u) => ({ userId: u.userId, count: u._count })),
    };
  }

  /**
   * Delete old audit logs (data retention)
   */
  static async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Deleted old audit logs', {
      count: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });

    return result.count;
  }

  /**
   * Helper: Log authentication events
   */
  static async logAuth(
    action: AuditAction,
    userId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      action,
      resource: 'authentication',
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Helper: Log user management events
   */
  static async logUserManagement(
    action: AuditAction,
    targetUserId: string,
    performedBy?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: performedBy,
      action,
      resource: 'user',
      resourceId: targetUserId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Helper: Log resource events (projects, pipelines, etc.)
   */
  static async logResourceAction(
    action: AuditAction,
    resource: string,
    resourceId: string,
    userId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
    });
  }
}
