/**
 * Audit Logging Middleware
 * Automatically logs important API requests
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService, AuditAction } from '../services/auditService';

/**
 * Extract IP address from request
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Map HTTP method and path to audit action
 */
function mapToAuditAction(method: string, path: string): AuditAction | null {
  // Authentication routes
  if (path.includes('/api/auth/login')) return AuditAction.LOGIN;
  if (path.includes('/api/auth/logout')) return AuditAction.LOGOUT;
  if (path.includes('/api/auth/register')) return AuditAction.REGISTER;
  if (path.includes('/api/auth/change-password')) return AuditAction.PASSWORD_CHANGE;
  if (path.includes('/api/auth/forgot-password')) return AuditAction.PASSWORD_RESET_REQUEST;
  if (path.includes('/api/auth/reset-password')) return AuditAction.PASSWORD_RESET_COMPLETE;
  if (path.includes('/api/auth/refresh')) return AuditAction.TOKEN_REFRESH;

  // User management routes
  if (path.match(/\/api\/users$/) && method === 'POST') return AuditAction.USER_CREATE;
  if (path.match(/\/api\/users\/[^/]+$/) && method === 'PUT') return AuditAction.USER_UPDATE;
  if (path.match(/\/api\/users\/[^/]+$/) && method === 'DELETE') return AuditAction.USER_DELETE;
  if (path.includes('/api/users/') && path.includes('/role')) return AuditAction.USER_ROLE_CHANGE;
  if (path.includes('/api/users/') && path.includes('/permissions') && method === 'POST')
    return AuditAction.USER_PERMISSION_ADD;
  if (path.includes('/api/users/') && path.includes('/permissions') && method === 'DELETE')
    return AuditAction.USER_PERMISSION_REMOVE;

  // Team management routes
  if (path.match(/\/api\/teams$/) && method === 'POST') return AuditAction.TEAM_CREATE;
  if (path.match(/\/api\/teams\/[^/]+$/) && method === 'PUT') return AuditAction.TEAM_UPDATE;
  if (path.match(/\/api\/teams\/[^/]+$/) && method === 'DELETE') return AuditAction.TEAM_DELETE;
  if (path.includes('/api/teams/') && path.includes('/members') && method === 'POST')
    return AuditAction.TEAM_MEMBER_ADD;
  if (path.includes('/api/teams/') && path.includes('/members') && method === 'DELETE')
    return AuditAction.TEAM_MEMBER_REMOVE;

  // Project management routes
  if (path.match(/\/api\/projects$/) && method === 'POST') return AuditAction.PROJECT_CREATE;
  if (path.match(/\/api\/projects\/[^/]+$/) && method === 'PUT') return AuditAction.PROJECT_UPDATE;
  if (path.match(/\/api\/projects\/[^/]+$/) && method === 'DELETE') return AuditAction.PROJECT_DELETE;
  if (path.includes('/api/projects/') && path.includes('/settings'))
    return AuditAction.PROJECT_SETTINGS_UPDATE;

  // Pipeline management routes
  if (path.match(/\/api\/pipelines$/) && method === 'POST') return AuditAction.PIPELINE_CREATE;
  if (path.match(/\/api\/pipelines\/[^/]+$/) && method === 'PUT') return AuditAction.PIPELINE_UPDATE;
  if (path.match(/\/api\/pipelines\/[^/]+$/) && method === 'DELETE') return AuditAction.PIPELINE_DELETE;
  if (path.includes('/api/pipelines/') && path.includes('/execute')) return AuditAction.PIPELINE_EXECUTE;
  if (path.includes('/api/pipelines/') && path.includes('/cancel')) return AuditAction.PIPELINE_CANCEL;

  // Test management routes
  if (path.match(/\/api\/tests$/) && method === 'POST') return AuditAction.TEST_CREATE;
  if (path.match(/\/api\/tests\/[^/]+$/) && method === 'PUT') return AuditAction.TEST_UPDATE;
  if (path.match(/\/api\/tests\/[^/]+$/) && method === 'DELETE') return AuditAction.TEST_DELETE;
  if (path.includes('/api/tests/') && path.includes('/execute')) return AuditAction.TEST_EXECUTE;

  // Deployment management routes
  if (path.includes('/api/deployments') && method === 'POST') return AuditAction.DEPLOYMENT_TRIGGER;
  if (path.includes('/api/deployments/') && path.includes('/approve'))
    return AuditAction.DEPLOYMENT_APPROVE;
  if (path.includes('/api/deployments/') && path.includes('/rollback'))
    return AuditAction.DEPLOYMENT_ROLLBACK;

  // Integration management routes
  if (path.match(/\/api\/integrations$/) && method === 'POST') return AuditAction.INTEGRATION_CREATE;
  if (path.match(/\/api\/integrations\/[^/]+$/) && method === 'PUT')
    return AuditAction.INTEGRATION_UPDATE;
  if (path.match(/\/api\/integrations\/[^/]+$/) && method === 'DELETE')
    return AuditAction.INTEGRATION_DELETE;

  // System management routes
  if (path.includes('/api/system/settings')) return AuditAction.SYSTEM_SETTINGS_UPDATE;
  if (path.includes('/api/system/logs') && method === 'GET') return AuditAction.SYSTEM_LOGS_VIEW;
  if (path.includes('/api/system/metrics') && method === 'GET') return AuditAction.SYSTEM_METRICS_VIEW;
  if (path.includes('/api/audit-logs') && method === 'GET') return AuditAction.SYSTEM_AUDIT_LOGS_VIEW;

  return null;
}

/**
 * Extract resource ID from request path
 */
function extractResourceId(path: string): string | undefined {
  const match = path.match(/\/([a-f0-9-]{36})/i);
  return match ? match[1] : undefined;
}

/**
 * Extract resource type from path
 */
function extractResourceType(path: string): string {
  if (path.includes('/users')) return 'user';
  if (path.includes('/teams')) return 'team';
  if (path.includes('/projects')) return 'project';
  if (path.includes('/pipelines')) return 'pipeline';
  if (path.includes('/tests')) return 'test';
  if (path.includes('/deployments')) return 'deployment';
  if (path.includes('/integrations')) return 'integration';
  if (path.includes('/auth')) return 'authentication';
  if (path.includes('/system')) return 'system';
  return 'unknown';
}

/**
 * Audit logging middleware
 * Logs important API actions automatically
 */
export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip audit logging for certain routes
  const skipPaths = [
    '/api/health',
    '/api/docs',
    '/api/metrics',
    '/favicon.ico',
  ];

  if (skipPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Skip GET requests (only log mutations)
  if (req.method === 'GET') {
    return next();
  }

  const auditAction = mapToAuditAction(req.method, req.path);

  // Only log if we have a mapped action
  if (!auditAction) {
    return next();
  }

  // Store original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data: any): Response {
    // Only log on successful responses (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const user = (req as any).user;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'];
      const resourceId = extractResourceId(req.path);
      const resourceType = extractResourceType(req.path);

      // Extract metadata from request body (sanitize sensitive data)
      const metadata: Record<string, any> = {};
      if (req.body) {
        const sanitizedBody = { ...req.body };
        // Remove sensitive fields
        delete sanitizedBody.password;
        delete sanitizedBody.currentPassword;
        delete sanitizedBody.newPassword;
        delete sanitizedBody.confirmPassword;
        delete sanitizedBody.token;
        metadata.requestBody = sanitizedBody;
      }

      // Add response status
      metadata.statusCode = res.statusCode;
      metadata.method = req.method;
      metadata.path = req.path;

      // Log the audit event (don't await to not slow down response)
      AuditService.log({
        userId: user?.userId || user?.id,
        action: auditAction,
        resource: resourceType,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
      }).catch((error) => {
        console.error('Audit logging failed:', error);
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Manual audit log helper for custom actions
 */
export async function logAudit(
  req: Request,
  action: AuditAction,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const user = (req as any).user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  await AuditService.log({
    userId: user?.userId || user?.id,
    action,
    resource,
    resourceId,
    metadata,
    ipAddress,
    userAgent,
  });
}
