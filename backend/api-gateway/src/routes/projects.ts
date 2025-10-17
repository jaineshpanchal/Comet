import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { ValidationAppError, NotFoundAppError, AuthenticationAppError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { teamId, isActive } = req.query;

    const where: any = {};

    // Filter by team if provided
    if (teamId) {
      where.teamId = teamId as string;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // If user is not ADMIN, only show projects they own or are part of
    if (user.role !== 'ADMIN') {
      where.OR = [
        { ownerId: user.id },
        { team: { members: { some: { userId: user.id } } } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            pipelines: true,
            testSuites: true,
            deployments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response: ApiResponse = {
      success: true,
      data: projects,
      message: `Found ${projects.length} projects`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Projects retrieved', { userId: user.id, count: projects.length });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching projects', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
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
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
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
                    email: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        pipelines: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        testSuites: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        deployments: {
          take: 5,
          orderBy: { deployedAt: 'desc' }
        }
      }
    });

    if (!project) {
      throw new NotFoundAppError('Project not found');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      project.ownerId === user.id ||
      project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this project');
    }

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Project retrieved', { userId: user.id, projectId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - repositoryUrl
 *               - framework
 *               - language
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               repositoryUrl:
 *                 type: string
 *               branch:
 *                 type: string
 *               framework:
 *                 type: string
 *               language:
 *                 type: string
 *               teamId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { name, description, repositoryUrl, branch, framework, language, teamId, settings } = req.body;

    // Validation
    if (!name || !repositoryUrl || !framework || !language) {
      throw new ValidationAppError('Missing required fields: name, repositoryUrl, framework, language');
    }

    // Validate repository URL format
    const validRepoPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!validRepoPattern.test(repositoryUrl)) {
      throw new ValidationAppError('Invalid repository URL format');
    }

    // If teamId provided, verify team exists and user has access
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: { userId: user.id }
          }
        }
      });

      if (!team) {
        throw new NotFoundAppError('Team not found');
      }

      if (user.role !== 'ADMIN' && team.members.length === 0) {
        throw new AuthenticationAppError('You are not a member of this team');
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositoryUrl,
        branch: branch || 'main',
        framework,
        language,
        ownerId: user.id,
        teamId: teamId || null,
        settings: settings ? JSON.stringify(settings) : '{}'
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        team: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    };

    logger.info('Project created', { userId: user.id, projectId: project.id, name });
    res.status(201).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
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
 *     responses:
 *       200:
 *         description: Project updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, description, repositoryUrl, branch, framework, language, teamId, isActive, settings } = req.body;

    // Find existing project
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      throw new NotFoundAppError('Project not found');
    }

    // Check permissions
    const canUpdate =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      existingProject.ownerId === user.id;

    if (!canUpdate) {
      throw new AuthenticationAppError('Only project owner, managers, or admins can update projects');
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (repositoryUrl !== undefined) updateData.repositoryUrl = repositoryUrl;
    if (branch !== undefined) updateData.branch = branch;
    if (framework !== undefined) updateData.framework = framework;
    if (language !== undefined) updateData.language = language;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        team: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Project updated', { userId: user.id, projectId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
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
 *         description: Project deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find existing project
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      throw new NotFoundAppError('Project not found');
    }

    // Check permissions - only owner or admin can delete
    const canDelete =
      user.role === 'ADMIN' ||
      existingProject.ownerId === user.id;

    if (!canDelete) {
      throw new AuthenticationAppError('Only project owner or admins can delete projects');
    }

    await prisma.project.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      data: { id },
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Project deleted', { userId: user.id, projectId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

export default router;
