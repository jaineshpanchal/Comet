/**
 * Permissions API Routes
 * Manage user permissions and role assignments
 */

import { Router, Response } from 'express';
import { PrismaClient, Permission } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { PermissionService } from '../services/permissionService';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/permissions
 * Get all available permissions grouped by category
 */
router.get('/', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const grouped = PermissionService.getAllPermissions();

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error: any) {
    logger.error('Error retrieving permissions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve permissions',
    });
  }
});

/**
 * GET /api/permissions/user/:userId
 * Get all permissions for a specific user
 */
router.get(
  '/user/:userId',
  authenticateToken,
  requirePermission(Permission.USER_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const allPermissions = await PermissionService.getUserPermissions(userId);
      const customPermissions = await PermissionService.getCustomPermissions(userId);
      const rolePermissions = PermissionService.getRolePermissions(user.role);

      res.json({
        success: true,
        data: {
          user,
          allPermissions,
          customPermissions,
          rolePermissions,
        },
      });
    } catch (error: any) {
      logger.error('Error retrieving user permissions', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user permissions',
      });
    }
  }
);

/**
 * POST /api/permissions/user/:userId
 * Add custom permission to user
 * Requires USER_MANAGE_PERMISSIONS permission
 */
router.post(
  '/user/:userId',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_PERMISSIONS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;

      if (!permission) {
        return res.status(400).json({
          success: false,
          error: 'Permission is required',
        });
      }

      // Validate permission enum
      if (!Object.values(Permission).includes(permission)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permission',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      await PermissionService.addPermission(userId, permission);

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permission.granted',
          resource: 'UserPermission',
          resourceId: userId,
          metadata: JSON.stringify({ permission, targetUserId: userId }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      const updatedPermissions = await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        message: 'Permission added successfully',
        data: {
          allPermissions: updatedPermissions,
        },
      });
    } catch (error: any) {
      logger.error('Error adding permission', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to add permission',
      });
    }
  }
);

/**
 * DELETE /api/permissions/user/:userId
 * Remove custom permission from user
 * Requires USER_MANAGE_PERMISSIONS permission
 */
router.delete(
  '/user/:userId',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_PERMISSIONS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;

      if (!permission) {
        return res.status(400).json({
          success: false,
          error: 'Permission is required',
        });
      }

      await PermissionService.removePermission(userId, permission);

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permission.revoked',
          resource: 'UserPermission',
          resourceId: userId,
          metadata: JSON.stringify({ permission, targetUserId: userId }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      const updatedPermissions = await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        message: 'Permission removed successfully',
        data: {
          allPermissions: updatedPermissions,
        },
      });
    } catch (error: any) {
      logger.error('Error removing permission', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to remove permission',
      });
    }
  }
);

/**
 * PUT /api/permissions/user/:userId
 * Set custom permissions for user (replaces all existing custom permissions)
 * Requires USER_MANAGE_PERMISSIONS permission
 */
router.put(
  '/user/:userId',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_PERMISSIONS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          error: 'Permissions must be an array',
        });
      }

      // Validate all permissions
      const invalidPermissions = permissions.filter(
        (p) => !Object.values(Permission).includes(p)
      );
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions',
          invalid: invalidPermissions,
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      await PermissionService.setCustomPermissions(userId, permissions);

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permissions.updated',
          resource: 'UserPermission',
          resourceId: userId,
          metadata: JSON.stringify({ permissions, targetUserId: userId }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      const updatedPermissions = await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        message: 'Permissions updated successfully',
        data: {
          allPermissions: updatedPermissions,
        },
      });
    } catch (error: any) {
      logger.error('Error updating permissions', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to update permissions',
      });
    }
  }
);

/**
 * PUT /api/permissions/user/:userId/role
 * Change user role
 * Requires USER_MANAGE_ROLES permission
 */
router.put(
  '/user/:userId/role',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_ROLES),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Role is required',
        });
      }

      // Validate role
      const validRoles = ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          validRoles,
        });
      }

      const previousUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!previousUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'user.role.changed',
          resource: 'User',
          resourceId: userId,
          metadata: JSON.stringify({
            previousRole: previousUser.role,
            newRole: role,
            targetUserId: userId,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      const updatedPermissions = await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user: updatedUser,
          allPermissions: updatedPermissions,
        },
      });
    } catch (error: any) {
      logger.error('Error updating user role', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to update user role',
      });
    }
  }
);

/**
 * GET /api/permissions/role/:role
 * Get default permissions for a role
 */
router.get('/role/:role', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.params;

    const validRoles = ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        validRoles,
      });
    }

    const permissions = PermissionService.getRolePermissions(role as any);

    res.json({
      success: true,
      data: {
        role,
        permissions,
      },
    });
  } catch (error: any) {
    logger.error('Error retrieving role permissions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve role permissions',
    });
  }
});

export default router;
