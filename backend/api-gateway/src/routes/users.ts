/**
 * User Management Routes
 * Admin-only routes for managing users, roles, and permissions
 */

import { Router, Response } from 'express';
import { PrismaClient, Permission, UserRole } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { requirePermission, requireAllPermissions, requireAdmin } from '../middleware/permissions';
import { PermissionService } from '../services/permissionService';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or username
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(Permission.USER_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as UserRole | undefined;
      const search = req.query.search as string | undefined;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (role) {
        where.role = role;
      }
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        message: 'Users retrieved successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to get users', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(Permission.USER_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          customPermissions: {
            select: {
              permission: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'No user found with the provided ID',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 404,
        });
      }

      // Get all permissions (role + custom)
      const allPermissions = await PermissionService.getUserPermissions(id);
      const rolePermissions = PermissionService.getRolePermissions(user.role);
      const customPermissions = user.customPermissions.map((cp) => cp.permission);

      res.json({
        success: true,
        data: {
          user: {
            ...user,
            allPermissions,
            rolePermissions,
            customPermissions,
          },
        },
        message: 'User retrieved successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to get user', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, DEVELOPER, TESTER, VIEWER]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.put(
  '/:id/role',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_ROLES),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          message: 'Please provide a valid role',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      // Prevent changing own role (to avoid locking yourself out)
      if (id === req.user!.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot change own role',
          message: 'You cannot change your own role',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_USER_ROLE',
          resource: 'USER',
          resourceId: id,
          metadata: JSON.stringify({ newRole: role }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('User role updated', {
        updatedBy: req.user!.id,
        userId: id,
        newRole: role,
      });

      res.json({
        success: true,
        data: { user },
        message: 'User role updated successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to update user role', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to update user role',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   get:
 *     summary: Get user permissions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions
 */
router.get(
  '/:id/permissions',
  authenticateToken,
  requirePermission(Permission.USER_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'No user found with the provided ID',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 404,
        });
      }

      const allPermissions = await PermissionService.getUserPermissions(id);
      const rolePermissions = PermissionService.getRolePermissions(user.role);
      const customPermissions = await PermissionService.getCustomPermissions(id);

      res.json({
        success: true,
        data: {
          allPermissions,
          rolePermissions,
          customPermissions,
        },
        message: 'Permissions retrieved successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to get user permissions', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve permissions',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   put:
 *     summary: Set custom permissions for user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 */
router.put(
  '/:id/permissions',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_PERMISSIONS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions',
          message: 'Permissions must be an array',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      // Validate all permissions
      const validPermissions = Object.values(Permission);
      const invalidPerms = permissions.filter((p) => !validPermissions.includes(p));
      if (invalidPerms.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions',
          message: `Invalid permissions: ${invalidPerms.join(', ')}`,
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      // Set custom permissions
      await PermissionService.setCustomPermissions(id, permissions);

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_USER_PERMISSIONS',
          resource: 'USER',
          resourceId: id,
          metadata: JSON.stringify({ permissions }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('User permissions updated', {
        updatedBy: req.user!.id,
        userId: id,
        permissions,
      });

      res.json({
        success: true,
        data: { customPermissions: permissions },
        message: 'Permissions updated successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to update user permissions', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to update permissions',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/permissions/{permission}:
 *   post:
 *     summary: Add custom permission to user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission added successfully
 */
router.post(
  '/:id/permissions/:permission',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_PERMISSIONS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, permission } = req.params;

      if (!Object.values(Permission).includes(permission as Permission)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permission',
          message: 'Please provide a valid permission',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      await PermissionService.addPermission(id, permission as Permission);

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ADD_USER_PERMISSION',
          resource: 'USER',
          resourceId: id,
          metadata: JSON.stringify({ permission }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('Permission added to user', {
        updatedBy: req.user!.id,
        userId: id,
        permission,
      });

      res.json({
        success: true,
        message: 'Permission added successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to add permission', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to add permission',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/permissions/{permission}:
 *   delete:
 *     summary: Remove custom permission from user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission removed successfully
 */
router.delete(
  '/:id/permissions/:permission',
  authenticateToken,
  requirePermission(Permission.USER_MANAGE_PERMISSIONS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, permission } = req.params;

      await PermissionService.removePermission(id, permission as Permission);

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'REMOVE_USER_PERMISSION',
          resource: 'USER',
          resourceId: id,
          metadata: JSON.stringify({ permission }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('Permission removed from user', {
        updatedBy: req.user!.id,
        userId: id,
        permission,
      });

      res.json({
        success: true,
        message: 'Permission removed successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to remove permission', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to remove permission',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(Permission.USER_EDIT),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updateData: any = {};
      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_USER',
          resource: 'USER',
          resourceId: id,
          metadata: JSON.stringify(updateData),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        data: { user },
        message: 'User updated successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to update user', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(Permission.USER_DELETE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Prevent deleting own account
      if (id === req.user!.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete own account',
          message: 'You cannot delete your own account',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE_USER',
          resource: 'USER',
          resourceId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('User deleted', {
        deletedBy: req.user!.id,
        userId: id,
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to delete user', { error, userId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/permissions/all:
 *   get:
 *     summary: Get all available permissions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All available permissions grouped by category
 */
router.get(
  '/permissions/all',
  authenticateToken,
  requirePermission(Permission.USER_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const permissions = PermissionService.getAllPermissions();

      res.json({
        success: true,
        data: { permissions },
        message: 'Permissions retrieved successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to get permissions', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve permissions',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/roles/{role}/permissions:
 *   get:
 *     summary: Get default permissions for a role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, DEVELOPER, TESTER, VIEWER]
 *     responses:
 *       200:
 *         description: Role permissions
 */
router.get(
  '/roles/:role/permissions',
  authenticateToken,
  requirePermission(Permission.USER_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { role } = req.params;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          message: 'Please provide a valid role',
          timestamp: new Date().toISOString(),
          path: req.path,
          statusCode: 400,
        });
      }

      const permissions = PermissionService.getRolePermissions(role as UserRole);

      res.json({
        success: true,
        data: { role, permissions },
        message: 'Role permissions retrieved successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error('Failed to get role permissions', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve role permissions',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500,
      });
    }
  }
);

export default router;
