import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { ValidationAppError, NotFoundAppError, AuthenticationAppError } from '../middleware/errorHandler';
import deploymentExecutor from '../services/deploymentExecutor';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/deployments:
 *   get:
 *     summary: Get all deployments
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *           enum: [development, staging, production]
 *         description: Filter by environment
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, DEPLOYED, FAILED, ROLLED_BACK]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of deployments
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, environment, status } = req.query;

    const where: any = {};

    // Filter by project if provided
    if (projectId) {
      where.projectId = projectId as string;
    }

    // Filter by environment if provided
    if (environment) {
      where.environment = environment as string;
    }

    // Filter by status if provided
    if (status) {
      where.status = status as string;
    }

    // If user is not ADMIN, only show deployments from projects they have access to
    if (user.role !== 'ADMIN') {
      where.project = {
        OR: [
          { ownerId: user.id },
          { team: { members: { some: { userId: user.id } } } }
        ]
      };
    }

    const deployments = await prisma.deployment.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true,
            branch: true
          }
        },
        deployedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        deployedAt: 'desc'
      }
    });

    const response: ApiResponse = {
      success: true,
      data: deployments,
      message: `Found ${deployments.length} deployments`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Deployments retrieved', { userId: user.id, count: deployments.length });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching deployments', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/deployments/{id}:
 *   get:
 *     summary: Get deployment by ID
 *     tags: [Deployments]
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
 *         description: Deployment details
 *       404:
 *         description: Deployment not found
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        deployedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    if (!deployment) {
      throw new NotFoundAppError('Deployment not found');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      deployment.project.ownerId === user.id ||
      deployment.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this deployment');
    }

    const response: ApiResponse = {
      success: true,
      data: deployment,
      message: 'Deployment retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Deployment retrieved', { userId: user.id, deploymentId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deployments:
 *   post:
 *     summary: Create a new deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - environment
 *               - version
 *             properties:
 *               projectId:
 *                 type: string
 *               environment:
 *                 type: string
 *                 enum: [development, staging, production]
 *               version:
 *                 type: string
 *               branch:
 *                 type: string
 *               commitHash:
 *                 type: string
 *               configuration:
 *                 type: object
 *     responses:
 *       202:
 *         description: Deployment started
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, environment, version, branch, commitHash, configuration } = req.body;

    // Validation
    if (!projectId || !environment || !version) {
      throw new ValidationAppError('Missing required fields: projectId, environment, version');
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      throw new ValidationAppError(`Invalid environment. Must be one of: ${validEnvironments.join(', ')}`);
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundAppError('Project not found');
    }

    const hasAccess =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      project.ownerId === user.id ||
      (project.team && project.team.members.length > 0);

    if (!hasAccess) {
      throw new AuthenticationAppError('You do not have access to deploy this project');
    }

    // For production deployments, require ADMIN or MANAGER role
    if (environment === 'production' && !['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new AuthenticationAppError('Only ADMIN or MANAGER roles can deploy to production');
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        environment,
        version,
        branch: branch || project.branch,
        commitHash: commitHash || '',
        status: 'PENDING',
        deployedBy: user.id,
        configuration: configuration ? JSON.stringify(configuration) : '{}'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true,
            branch: true
          }
        },
        deployedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Execute deployment asynchronously
    deploymentExecutor.executeDeployment({
      deploymentId: deployment.id,
      projectId,
      repositoryUrl: project.repositoryUrl,
      branch: branch || project.branch,
      commitHash: commitHash || 'HEAD',
      version,
      environment,
      configuration: configuration || {},
      deployedBy: user.id
    }).catch(error => {
      logger.error('Deployment execution failed', { deploymentId: deployment.id, error: error.message });
    });

    const response: ApiResponse = {
      success: true,
      data: deployment,
      message: 'Deployment started successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 202
    };

    logger.info('Deployment started', { userId: user.id, deploymentId: deployment.id, environment, version });
    res.status(202).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deployments/{id}/rollback:
 *   post:
 *     summary: Rollback a deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       202:
 *         description: Rollback started
 *       404:
 *         description: Deployment not found
 */
router.post('/:id/rollback', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { reason } = req.body;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!deployment) {
      throw new NotFoundAppError('Deployment not found');
    }

    // Check permissions
    const canRollback =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      deployment.project.ownerId === user.id;

    if (!canRollback) {
      throw new AuthenticationAppError('Only ADMIN, MANAGER, or project owner can rollback deployments');
    }

    // Can only rollback if currently deployed
    if (deployment.status !== 'DEPLOYED') {
      throw new ValidationAppError(`Cannot rollback deployment with status: ${deployment.status}`);
    }

    // Find the previous successful deployment to rollback to
    const previousDeployment = await prisma.deployment.findFirst({
      where: {
        projectId: deployment.projectId,
        environment: deployment.environment,
        status: 'DEPLOYED',
        deployedAt: {
          lt: deployment.deployedAt
        }
      },
      orderBy: {
        deployedAt: 'desc'
      }
    });

    if (!previousDeployment) {
      throw new ValidationAppError('No previous deployment found to rollback to');
    }

    // Create rollback deployment
    const rollbackDeployment = await prisma.deployment.create({
      data: {
        projectId: deployment.projectId,
        environment: deployment.environment,
        version: previousDeployment.version,
        branch: previousDeployment.branch,
        commitHash: previousDeployment.commitHash,
        status: 'PENDING',
        deployedBy: user.id,
        rollbackFromId: deployment.id,
        configuration: JSON.stringify({
          ...(previousDeployment.configuration ? JSON.parse(previousDeployment.configuration as string) : {}),
          rollbackReason: reason || 'Manual rollback'
        })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true
          }
        },
        deployedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Execute rollback asynchronously
    deploymentExecutor.executeDeployment({
      deploymentId: rollbackDeployment.id,
      projectId: deployment.projectId,
      repositoryUrl: deployment.project.repositoryUrl,
      branch: previousDeployment.branch,
      commitHash: previousDeployment.commitHash,
      version: previousDeployment.version,
      environment: deployment.environment,
      configuration: JSON.parse(previousDeployment.configuration as string || '{}'),
      deployedBy: user.id,
      isRollback: true
    }).catch(error => {
      logger.error('Rollback execution failed', { deploymentId: rollbackDeployment.id, error: error.message });
    });

    // Update original deployment status
    await prisma.deployment.update({
      where: { id },
      data: {
        status: 'ROLLED_BACK',
        rollbackToId: rollbackDeployment.id
      }
    });

    const response: ApiResponse = {
      success: true,
      data: rollbackDeployment,
      message: 'Rollback started successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 202
    };

    logger.info('Deployment rollback started', { userId: user.id, deploymentId: id, rollbackDeploymentId: rollbackDeployment.id });
    res.status(202).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deployments/{id}/logs:
 *   get:
 *     summary: Get deployment logs
 *     tags: [Deployments]
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
 *         description: Deployment logs
 *       404:
 *         description: Deployment not found
 */
router.get('/:id/logs', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!deployment) {
      throw new NotFoundAppError('Deployment not found');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      deployment.project.ownerId === user.id;

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to view deployment logs');
    }

    // Parse logs from metadata
    const logs = deployment.logs || '';

    const response: ApiResponse = {
      success: true,
      data: {
        deploymentId: id,
        logs: logs.split('\n').filter(l => l.trim()),
        status: deployment.status,
        startedAt: deployment.deployedAt,
        finishedAt: deployment.finishedAt
      },
      message: 'Deployment logs retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Deployment logs retrieved', { userId: user.id, deploymentId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deployments/project/{projectId}/history:
 *   get:
 *     summary: Get deployment history for a project
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deployment history
 *       404:
 *         description: Project not found
 */
router.get('/project/:projectId/history', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { limit = '20', environment } = req.query;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundAppError('Project not found');
    }

    const hasAccess =
      user.role === 'ADMIN' ||
      project.ownerId === user.id;

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to view deployment history');
    }

    const where: any = { projectId };

    if (environment) {
      where.environment = environment as string;
    }

    const deployments = await prisma.deployment.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { deployedAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        deployedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: deployments,
      message: `Found ${deployments.length} deployments`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Deployment history retrieved', { userId: user.id, projectId, count: deployments.length });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

export default router;
