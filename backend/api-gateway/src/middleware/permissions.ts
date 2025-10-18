/**
 * Permission Middleware
 * Checks if user has required permissions to access routes
 */

import { Response, NextFunction } from 'express';
import { Permission } from '@prisma/client';
import { AuthenticatedRequest } from './auth';
import { PermissionService } from '../services/permissionService';
import { logger } from '../utils/logger';

/**
 * Middleware to require specific permission(s)
 * Usage: requirePermission(Permission.USER_VIEW)
 * Usage: requirePermission([Permission.USER_VIEW, Permission.USER_EDIT]) // requires ANY of the permissions
 */
export function requirePermission(permission: Permission | Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 401,
        });
      }

      const permissions = Array.isArray(permission) ? permission : [permission];
      const hasPermission = await PermissionService.hasAnyPermission(req.user.id, permissions);

      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          requiredPermissions: permissions,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check failed', { error, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to check permissions',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  };
}

/**
 * Middleware to require ALL specified permissions
 * Usage: requireAllPermissions([Permission.USER_VIEW, Permission.USER_EDIT])
 */
export function requireAllPermissions(permissions: Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 401,
        });
      }

      const hasAllPermissions = await PermissionService.hasAllPermissions(req.user.id, permissions);

      if (!hasAllPermissions) {
        logger.warn('Permission denied - missing required permissions', {
          userId: req.user.id,
          requiredPermissions: permissions,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have all required permissions to perform this action',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check failed', { error, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to check permissions',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  };
}

/**
 * Middleware to require admin role
 * Shortcut for ADMIN-only routes
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401,
    });
  }

  if (req.user.role !== 'ADMIN') {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      userRole: req.user.role,
      path: req.path,
    });

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403,
    });
  }

  next();
}
