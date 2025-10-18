/**
 * Permission Service
 * Handles role-based permissions and custom user permissions
 */

import { PrismaClient, UserRole, Permission } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Role-based permission defaults
 * Each role has a set of default permissions
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // All permissions - admin has full access
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
    Permission.USER_MANAGE_PERMISSIONS,
    Permission.TEAM_VIEW,
    Permission.TEAM_CREATE,
    Permission.TEAM_EDIT,
    Permission.TEAM_DELETE,
    Permission.TEAM_MANAGE_MEMBERS,
    Permission.PROJECT_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE_SETTINGS,
    Permission.PIPELINE_VIEW,
    Permission.PIPELINE_CREATE,
    Permission.PIPELINE_EDIT,
    Permission.PIPELINE_DELETE,
    Permission.PIPELINE_EXECUTE,
    Permission.PIPELINE_CANCEL,
    Permission.TEST_VIEW,
    Permission.TEST_CREATE,
    Permission.TEST_EDIT,
    Permission.TEST_DELETE,
    Permission.TEST_EXECUTE,
    Permission.DEPLOYMENT_VIEW,
    Permission.DEPLOYMENT_TRIGGER,
    Permission.DEPLOYMENT_ROLLBACK,
    Permission.DEPLOYMENT_APPROVE,
    Permission.INTEGRATION_VIEW,
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_EDIT,
    Permission.INTEGRATION_DELETE,
    Permission.SYSTEM_VIEW_LOGS,
    Permission.SYSTEM_VIEW_METRICS,
    Permission.SYSTEM_MANAGE_SETTINGS,
    Permission.SYSTEM_VIEW_AUDIT_LOGS,
  ],

  MANAGER: [
    // User management (view, create, edit)
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,

    // Team management (full access)
    Permission.TEAM_VIEW,
    Permission.TEAM_CREATE,
    Permission.TEAM_EDIT,
    Permission.TEAM_MANAGE_MEMBERS,

    // Project management (full access)
    Permission.PROJECT_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_MANAGE_SETTINGS,

    // Pipeline management (full access)
    Permission.PIPELINE_VIEW,
    Permission.PIPELINE_CREATE,
    Permission.PIPELINE_EDIT,
    Permission.PIPELINE_EXECUTE,
    Permission.PIPELINE_CANCEL,

    // Test management (full access)
    Permission.TEST_VIEW,
    Permission.TEST_CREATE,
    Permission.TEST_EDIT,
    Permission.TEST_EXECUTE,

    // Deployment management (view, trigger, approve)
    Permission.DEPLOYMENT_VIEW,
    Permission.DEPLOYMENT_TRIGGER,
    Permission.DEPLOYMENT_APPROVE,

    // Integration management (view, create, edit)
    Permission.INTEGRATION_VIEW,
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_EDIT,

    // System (view logs and metrics)
    Permission.SYSTEM_VIEW_LOGS,
    Permission.SYSTEM_VIEW_METRICS,
  ],

  DEVELOPER: [
    // User (view only)
    Permission.USER_VIEW,

    // Team (view only)
    Permission.TEAM_VIEW,

    // Project (view, edit)
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,

    // Pipeline (view, create, execute)
    Permission.PIPELINE_VIEW,
    Permission.PIPELINE_CREATE,
    Permission.PIPELINE_EXECUTE,

    // Test (full access)
    Permission.TEST_VIEW,
    Permission.TEST_CREATE,
    Permission.TEST_EDIT,
    Permission.TEST_EXECUTE,

    // Deployment (view, trigger)
    Permission.DEPLOYMENT_VIEW,
    Permission.DEPLOYMENT_TRIGGER,

    // Integration (view)
    Permission.INTEGRATION_VIEW,

    // System (view logs)
    Permission.SYSTEM_VIEW_LOGS,
  ],

  TESTER: [
    // User (view only)
    Permission.USER_VIEW,

    // Team (view only)
    Permission.TEAM_VIEW,

    // Project (view only)
    Permission.PROJECT_VIEW,

    // Pipeline (view, execute)
    Permission.PIPELINE_VIEW,
    Permission.PIPELINE_EXECUTE,

    // Test (full access)
    Permission.TEST_VIEW,
    Permission.TEST_CREATE,
    Permission.TEST_EDIT,
    Permission.TEST_DELETE,
    Permission.TEST_EXECUTE,

    // Deployment (view only)
    Permission.DEPLOYMENT_VIEW,

    // Integration (view)
    Permission.INTEGRATION_VIEW,

    // System (view logs)
    Permission.SYSTEM_VIEW_LOGS,
  ],

  VIEWER: [
    // User (view only)
    Permission.USER_VIEW,

    // Team (view only)
    Permission.TEAM_VIEW,

    // Project (view only)
    Permission.PROJECT_VIEW,

    // Pipeline (view only)
    Permission.PIPELINE_VIEW,

    // Test (view only)
    Permission.TEST_VIEW,

    // Deployment (view only)
    Permission.DEPLOYMENT_VIEW,

    // Integration (view only)
    Permission.INTEGRATION_VIEW,

    // System (view logs and metrics)
    Permission.SYSTEM_VIEW_LOGS,
    Permission.SYSTEM_VIEW_METRICS,
  ],
};

/**
 * Permission descriptions for UI display
 */
export const PermissionDescriptions: Record<Permission, { name: string; description: string; category: string }> = {
  // User Management
  [Permission.USER_VIEW]: {
    name: 'View Users',
    description: 'View user profiles and information',
    category: 'User Management',
  },
  [Permission.USER_CREATE]: {
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'User Management',
  },
  [Permission.USER_EDIT]: {
    name: 'Edit Users',
    description: 'Edit user profiles and information',
    category: 'User Management',
  },
  [Permission.USER_DELETE]: {
    name: 'Delete Users',
    description: 'Delete user accounts',
    category: 'User Management',
  },
  [Permission.USER_MANAGE_ROLES]: {
    name: 'Manage User Roles',
    description: 'Assign and change user roles',
    category: 'User Management',
  },
  [Permission.USER_MANAGE_PERMISSIONS]: {
    name: 'Manage User Permissions',
    description: 'Assign custom permissions to users',
    category: 'User Management',
  },

  // Team Management
  [Permission.TEAM_VIEW]: {
    name: 'View Teams',
    description: 'View team information and members',
    category: 'Team Management',
  },
  [Permission.TEAM_CREATE]: {
    name: 'Create Teams',
    description: 'Create new teams',
    category: 'Team Management',
  },
  [Permission.TEAM_EDIT]: {
    name: 'Edit Teams',
    description: 'Edit team information',
    category: 'Team Management',
  },
  [Permission.TEAM_DELETE]: {
    name: 'Delete Teams',
    description: 'Delete teams',
    category: 'Team Management',
  },
  [Permission.TEAM_MANAGE_MEMBERS]: {
    name: 'Manage Team Members',
    description: 'Add and remove team members',
    category: 'Team Management',
  },

  // Project Management
  [Permission.PROJECT_VIEW]: {
    name: 'View Projects',
    description: 'View project information',
    category: 'Project Management',
  },
  [Permission.PROJECT_CREATE]: {
    name: 'Create Projects',
    description: 'Create new projects',
    category: 'Project Management',
  },
  [Permission.PROJECT_EDIT]: {
    name: 'Edit Projects',
    description: 'Edit project information',
    category: 'Project Management',
  },
  [Permission.PROJECT_DELETE]: {
    name: 'Delete Projects',
    description: 'Delete projects',
    category: 'Project Management',
  },
  [Permission.PROJECT_MANAGE_SETTINGS]: {
    name: 'Manage Project Settings',
    description: 'Configure project settings and integrations',
    category: 'Project Management',
  },

  // Pipeline Management
  [Permission.PIPELINE_VIEW]: {
    name: 'View Pipelines',
    description: 'View pipeline configurations and runs',
    category: 'Pipeline Management',
  },
  [Permission.PIPELINE_CREATE]: {
    name: 'Create Pipelines',
    description: 'Create new pipelines',
    category: 'Pipeline Management',
  },
  [Permission.PIPELINE_EDIT]: {
    name: 'Edit Pipelines',
    description: 'Edit pipeline configurations',
    category: 'Pipeline Management',
  },
  [Permission.PIPELINE_DELETE]: {
    name: 'Delete Pipelines',
    description: 'Delete pipelines',
    category: 'Pipeline Management',
  },
  [Permission.PIPELINE_EXECUTE]: {
    name: 'Execute Pipelines',
    description: 'Trigger pipeline executions',
    category: 'Pipeline Management',
  },
  [Permission.PIPELINE_CANCEL]: {
    name: 'Cancel Pipelines',
    description: 'Cancel running pipelines',
    category: 'Pipeline Management',
  },

  // Test Management
  [Permission.TEST_VIEW]: {
    name: 'View Tests',
    description: 'View test suites and results',
    category: 'Test Management',
  },
  [Permission.TEST_CREATE]: {
    name: 'Create Tests',
    description: 'Create new test suites',
    category: 'Test Management',
  },
  [Permission.TEST_EDIT]: {
    name: 'Edit Tests',
    description: 'Edit test configurations',
    category: 'Test Management',
  },
  [Permission.TEST_DELETE]: {
    name: 'Delete Tests',
    description: 'Delete test suites',
    category: 'Test Management',
  },
  [Permission.TEST_EXECUTE]: {
    name: 'Execute Tests',
    description: 'Run test suites',
    category: 'Test Management',
  },

  // Deployment Management
  [Permission.DEPLOYMENT_VIEW]: {
    name: 'View Deployments',
    description: 'View deployment history and status',
    category: 'Deployment Management',
  },
  [Permission.DEPLOYMENT_TRIGGER]: {
    name: 'Trigger Deployments',
    description: 'Initiate new deployments',
    category: 'Deployment Management',
  },
  [Permission.DEPLOYMENT_ROLLBACK]: {
    name: 'Rollback Deployments',
    description: 'Rollback to previous deployments',
    category: 'Deployment Management',
  },
  [Permission.DEPLOYMENT_APPROVE]: {
    name: 'Approve Deployments',
    description: 'Approve pending deployments',
    category: 'Deployment Management',
  },

  // Integration Management
  [Permission.INTEGRATION_VIEW]: {
    name: 'View Integrations',
    description: 'View integration configurations',
    category: 'Integration Management',
  },
  [Permission.INTEGRATION_CREATE]: {
    name: 'Create Integrations',
    description: 'Create new integrations',
    category: 'Integration Management',
  },
  [Permission.INTEGRATION_EDIT]: {
    name: 'Edit Integrations',
    description: 'Edit integration configurations',
    category: 'Integration Management',
  },
  [Permission.INTEGRATION_DELETE]: {
    name: 'Delete Integrations',
    description: 'Delete integrations',
    category: 'Integration Management',
  },

  // System Management
  [Permission.SYSTEM_VIEW_LOGS]: {
    name: 'View System Logs',
    description: 'Access system logs',
    category: 'System Management',
  },
  [Permission.SYSTEM_VIEW_METRICS]: {
    name: 'View System Metrics',
    description: 'View system performance metrics',
    category: 'System Management',
  },
  [Permission.SYSTEM_MANAGE_SETTINGS]: {
    name: 'Manage System Settings',
    description: 'Configure system-wide settings',
    category: 'System Management',
  },
  [Permission.SYSTEM_VIEW_AUDIT_LOGS]: {
    name: 'View Audit Logs',
    description: 'Access audit logs for compliance',
    category: 'System Management',
  },
};

export class PermissionService {
  /**
   * Get all permissions for a user (role-based + custom)
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { customPermissions: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get role-based permissions
      const rolePermissions = RolePermissions[user.role] || [];

      // Get custom permissions
      const customPermissions = user.customPermissions.map((cp) => cp.permission);

      // Combine and deduplicate
      const allPermissions = Array.from(new Set([...rolePermissions, ...customPermissions]));

      return allPermissions;
    } catch (error) {
      logger.error('Failed to get user permissions', { userId, error });
      throw error;
    }
  }

  /**
   * Check if user has a specific permission
   */
  static async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      logger.error('Failed to check user permission', { userId, permission, error });
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.some((p) => userPermissions.includes(p));
    } catch (error) {
      logger.error('Failed to check user permissions', { userId, permissions, error });
      return false;
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.every((p) => userPermissions.includes(p));
    } catch (error) {
      logger.error('Failed to check user permissions', { userId, permissions, error });
      return false;
    }
  }

  /**
   * Add custom permission to user
   */
  static async addPermission(userId: string, permission: Permission): Promise<void> {
    try {
      await prisma.userPermission.create({
        data: {
          userId,
          permission,
        },
      });

      logger.info('Permission added to user', { userId, permission });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation - permission already exists
        logger.warn('Permission already exists for user', { userId, permission });
        return;
      }
      logger.error('Failed to add permission to user', { userId, permission, error });
      throw error;
    }
  }

  /**
   * Remove custom permission from user
   */
  static async removePermission(userId: string, permission: Permission): Promise<void> {
    try {
      await prisma.userPermission.deleteMany({
        where: {
          userId,
          permission,
        },
      });

      logger.info('Permission removed from user', { userId, permission });
    } catch (error) {
      logger.error('Failed to remove permission from user', { userId, permission, error });
      throw error;
    }
  }

  /**
   * Get all custom permissions for a user
   */
  static async getCustomPermissions(userId: string): Promise<Permission[]> {
    try {
      const customPermissions = await prisma.userPermission.findMany({
        where: { userId },
      });

      return customPermissions.map((cp) => cp.permission);
    } catch (error) {
      logger.error('Failed to get custom permissions', { userId, error });
      throw error;
    }
  }

  /**
   * Set custom permissions for a user (replaces all existing custom permissions)
   */
  static async setCustomPermissions(userId: string, permissions: Permission[]): Promise<void> {
    try {
      // Remove all existing custom permissions
      await prisma.userPermission.deleteMany({
        where: { userId },
      });

      // Add new custom permissions
      if (permissions.length > 0) {
        await prisma.userPermission.createMany({
          data: permissions.map((permission) => ({
            userId,
            permission,
          })),
        });
      }

      logger.info('Custom permissions updated for user', { userId, permissions });
    } catch (error) {
      logger.error('Failed to set custom permissions', { userId, permissions, error });
      throw error;
    }
  }

  /**
   * Get default permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return RolePermissions[role] || [];
  }

  /**
   * Get all available permissions grouped by category
   */
  static getAllPermissions(): Record<string, Array<{ permission: Permission; name: string; description: string }>> {
    const grouped: Record<string, Array<{ permission: Permission; name: string; description: string }>> = {};

    Object.entries(PermissionDescriptions).forEach(([permission, details]) => {
      if (!grouped[details.category]) {
        grouped[details.category] = [];
      }
      grouped[details.category].push({
        permission: permission as Permission,
        name: details.name,
        description: details.description,
      });
    });

    return grouped;
  }
}
