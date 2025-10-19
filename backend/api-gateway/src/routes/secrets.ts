/**
 * Secrets Management API Routes
 * Secure storage and retrieval of project secrets
 */

import { Router, Response } from 'express';
import { PrismaClient, Permission } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { EncryptionService } from '../services/encryptionService';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/projects/:projectId/secrets
 * Get all secrets for a project (values are masked)
 */
router.get(
  '/projects/:projectId/secrets',
  authenticateToken,
  requirePermission(Permission.PROJECT_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const { environment } = req.query;

      // Check if project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      const secrets = await prisma.projectSecret.findMany({
        where: {
          projectId,
          ...(environment && { environment: environment as string }),
        },
        select: {
          id: true,
          key: true,
          description: true,
          environment: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          // value is excluded for security
        },
        orderBy: [
          { environment: 'asc' },
          { key: 'asc' },
        ],
      });

      res.json({
        success: true,
        data: secrets,
      });
    } catch (error: any) {
      logger.error('Error retrieving secrets', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve secrets',
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/secrets/:secretId
 * Get a specific secret (decrypted value is returned - requires PROJECT_MANAGE_SETTINGS permission)
 */
router.get(
  '/projects/:projectId/secrets/:secretId',
  authenticateToken,
  requirePermission(Permission.PROJECT_MANAGE_SETTINGS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, secretId } = req.params;

      const secret = await prisma.projectSecret.findFirst({
        where: {
          id: secretId,
          projectId,
        },
      });

      if (!secret) {
        return res.status(404).json({
          success: false,
          error: 'Secret not found',
        });
      }

      // Decrypt the value
      const decryptedValue = EncryptionService.decrypt(secret.value);

      // Audit log for secret access
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'secret.accessed',
          resource: 'ProjectSecret',
          resourceId: secret.id,
          metadata: JSON.stringify({
            projectId,
            key: secret.key,
            environment: secret.environment,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        data: {
          id: secret.id,
          key: secret.key,
          value: decryptedValue,
          description: secret.description,
          environment: secret.environment,
          createdBy: secret.createdBy,
          createdAt: secret.createdAt,
          updatedAt: secret.updatedAt,
        },
      });
    } catch (error: any) {
      logger.error('Error retrieving secret', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve secret',
      });
    }
  }
);

/**
 * POST /api/projects/:projectId/secrets
 * Create a new secret
 */
router.post(
  '/projects/:projectId/secrets',
  authenticateToken,
  requirePermission(Permission.PROJECT_MANAGE_SETTINGS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const { key, value, description, environment = 'development' } = req.body;

      if (!key || !value) {
        return res.status(400).json({
          success: false,
          error: 'Key and value are required',
        });
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      // Check if secret with same key and environment already exists
      const existing = await prisma.projectSecret.findFirst({
        where: {
          projectId,
          key,
          environment,
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: `Secret with key '${key}' already exists in ${environment} environment`,
        });
      }

      // Encrypt the value
      const encryptedValue = EncryptionService.encrypt(value);

      const secret = await prisma.projectSecret.create({
        data: {
          projectId,
          key,
          value: encryptedValue,
          description,
          environment,
          createdBy: req.user!.id,
        },
        select: {
          id: true,
          key: true,
          description: true,
          environment: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'secret.created',
          resource: 'ProjectSecret',
          resourceId: secret.id,
          metadata: JSON.stringify({
            projectId,
            key,
            environment,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('Secret created', {
        projectId,
        key,
        environment,
        userId: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: secret,
      });
    } catch (error: any) {
      logger.error('Error creating secret', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to create secret',
      });
    }
  }
);

/**
 * PUT /api/projects/:projectId/secrets/:secretId
 * Update a secret
 */
router.put(
  '/projects/:projectId/secrets/:secretId',
  authenticateToken,
  requirePermission(Permission.PROJECT_MANAGE_SETTINGS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, secretId } = req.params;
      const { value, description } = req.body;

      const secret = await prisma.projectSecret.findFirst({
        where: {
          id: secretId,
          projectId,
        },
      });

      if (!secret) {
        return res.status(404).json({
          success: false,
          error: 'Secret not found',
        });
      }

      // Encrypt new value if provided
      const encryptedValue = value ? EncryptionService.encrypt(value) : undefined;

      const updatedSecret = await prisma.projectSecret.update({
        where: { id: secretId },
        data: {
          ...(encryptedValue && { value: encryptedValue }),
          ...(description !== undefined && { description }),
        },
        select: {
          id: true,
          key: true,
          description: true,
          environment: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'secret.updated',
          resource: 'ProjectSecret',
          resourceId: secret.id,
          metadata: JSON.stringify({
            projectId,
            key: secret.key,
            environment: secret.environment,
            valueUpdated: !!value,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('Secret updated', {
        projectId,
        secretId,
        userId: req.user!.id,
      });

      res.json({
        success: true,
        data: updatedSecret,
      });
    } catch (error: any) {
      logger.error('Error updating secret', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to update secret',
      });
    }
  }
);

/**
 * DELETE /api/projects/:projectId/secrets/:secretId
 * Delete a secret
 */
router.delete(
  '/projects/:projectId/secrets/:secretId',
  authenticateToken,
  requirePermission(Permission.PROJECT_MANAGE_SETTINGS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, secretId } = req.params;

      const secret = await prisma.projectSecret.findFirst({
        where: {
          id: secretId,
          projectId,
        },
      });

      if (!secret) {
        return res.status(404).json({
          success: false,
          error: 'Secret not found',
        });
      }

      await prisma.projectSecret.delete({
        where: { id: secretId },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'secret.deleted',
          resource: 'ProjectSecret',
          resourceId: secretId,
          metadata: JSON.stringify({
            projectId,
            key: secret.key,
            environment: secret.environment,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('Secret deleted', {
        projectId,
        secretId,
        userId: req.user!.id,
      });

      res.json({
        success: true,
        message: 'Secret deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting secret', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to delete secret',
      });
    }
  }
);

/**
 * POST /api/projects/:projectId/secrets/bulk
 * Bulk import secrets from key-value pairs
 */
router.post(
  '/projects/:projectId/secrets/bulk',
  authenticateToken,
  requirePermission(Permission.PROJECT_MANAGE_SETTINGS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const { secrets, environment = 'development', overwrite = false } = req.body;

      if (!Array.isArray(secrets) || secrets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Secrets array is required',
        });
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      const created: string[] = [];
      const updated: string[] = [];
      const skipped: string[] = [];
      const errors: Array<{ key: string; error: string }> = [];

      for (const secret of secrets) {
        try {
          const { key, value, description } = secret;

          if (!key || !value) {
            errors.push({ key: key || 'unknown', error: 'Key and value are required' });
            continue;
          }

          // Check if exists
          const existing = await prisma.projectSecret.findFirst({
            where: { projectId, key, environment },
          });

          const encryptedValue = EncryptionService.encrypt(value);

          if (existing) {
            if (overwrite) {
              await prisma.projectSecret.update({
                where: { id: existing.id },
                data: { value: encryptedValue, description },
              });
              updated.push(key);
            } else {
              skipped.push(key);
            }
          } else {
            await prisma.projectSecret.create({
              data: {
                projectId,
                key,
                value: encryptedValue,
                description,
                environment,
                createdBy: req.user!.id,
              },
            });
            created.push(key);
          }
        } catch (error: any) {
          errors.push({ key: secret.key || 'unknown', error: error.message });
        }
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'secrets.bulk_import',
          resource: 'ProjectSecret',
          resourceId: projectId,
          metadata: JSON.stringify({
            projectId,
            environment,
            created: created.length,
            updated: updated.length,
            skipped: skipped.length,
            errors: errors.length,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info('Bulk secrets import', {
        projectId,
        created: created.length,
        updated: updated.length,
        skipped: skipped.length,
        errors: errors.length,
      });

      res.json({
        success: true,
        data: {
          created,
          updated,
          skipped,
          errors,
        },
      });
    } catch (error: any) {
      logger.error('Error bulk importing secrets', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to bulk import secrets',
      });
    }
  }
);

export default router;
