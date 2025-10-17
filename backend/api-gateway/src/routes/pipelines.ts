import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, PipelineTrigger, PipelineStatus, StageType } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { ValidationAppError, NotFoundAppError, AuthenticationAppError } from '../middleware/errorHandler';
import pipelineExecutor from '../services/pipelineExecutor';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/pipelines:
 *   get:
 *     summary: Get all pipelines
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IDLE, RUNNING, SUCCESS, FAILED, CANCELLED, PENDING]
 *     responses:
 *       200:
 *         description: List of pipelines
 */
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, status } = req.query;

    const where: any = {};

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (status) {
      where.status = status as PipelineStatus;
    }

    // Check user access to projects
    if (user.role !== 'ADMIN') {
      where.project = {
        OR: [
          { ownerId: user.id },
          { team: { members: { some: { userId: user.id } } } }
        ]
      };
    }

    const pipelines = await prisma.pipeline.findMany({
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
        _count: {
          select: {
            pipelineRuns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse stages from JSON string
    const pipelinesWithStages = pipelines.map(pipeline => ({
      ...pipeline,
      stages: JSON.parse(pipeline.stages as string)
    }));

    const response: ApiResponse = {
      success: true,
      data: pipelinesWithStages,
      message: `Found ${pipelines.length} pipelines`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Pipelines retrieved', { userId: user.id, count: pipelines.length });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching pipelines', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/pipelines/{id}:
 *   get:
 *     summary: Get pipeline by ID
 *     tags: [Pipelines]
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
 *         description: Pipeline details
 *       404:
 *         description: Pipeline not found
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const pipeline = await prisma.pipeline.findUnique({
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
                members: true
              }
            }
          }
        },
        pipelineRuns: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            stages: true
          }
        }
      }
    });

    if (!pipeline) {
      throw new NotFoundAppError('Pipeline not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      pipeline.project.ownerId === user.id ||
      pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this pipeline');
    }

    // Parse stages from JSON
    const pipelineWithStages = {
      ...pipeline,
      stages: JSON.parse(pipeline.stages as string),
      pipelineRuns: pipeline.pipelineRuns.map(run => ({
        ...run,
        metadata: JSON.parse(run.metadata as string)
      }))
    };

    const response: ApiResponse = {
      success: true,
      data: pipelineWithStages,
      message: 'Pipeline retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Pipeline retrieved', { userId: user.id, pipelineId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipelines:
 *   post:
 *     summary: Create a new pipeline
 *     tags: [Pipelines]
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
 *               - name
 *               - trigger
 *               - stages
 *             properties:
 *               projectId:
 *                 type: string
 *               name:
 *                 type: string
 *               trigger:
 *                 type: string
 *                 enum: [MANUAL, GIT_PUSH, GIT_PR, SCHEDULE, WEBHOOK]
 *               stages:
 *                 type: array
 *     responses:
 *       201:
 *         description: Pipeline created
 */
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, name, trigger, stages } = req.body;

    // Validation
    if (!projectId || !name || !trigger || !stages) {
      throw new ValidationAppError('Missing required fields: projectId, name, trigger, stages');
    }

    if (!Array.isArray(stages) || stages.length === 0) {
      throw new ValidationAppError('Stages must be a non-empty array');
    }

    // Validate trigger
    if (!Object.values(PipelineTrigger).includes(trigger)) {
      throw new ValidationAppError(`Invalid trigger. Must be one of: ${Object.values(PipelineTrigger).join(', ')}`);
    }

    // Check project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: true
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
      project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this project');
    }

    // Validate stages
    const validStageTypes = Object.values(StageType);
    for (const stage of stages) {
      if (!stage.name || !stage.type) {
        throw new ValidationAppError('Each stage must have a name and type');
      }
      if (!validStageTypes.includes(stage.type)) {
        throw new ValidationAppError(`Invalid stage type: ${stage.type}. Must be one of: ${validStageTypes.join(', ')}`);
      }
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        projectId,
        name,
        trigger,
        stages: JSON.stringify(stages),
        status: PipelineStatus.IDLE
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true
          }
        }
      }
    });

    const pipelineWithStages = {
      ...pipeline,
      stages: JSON.parse(pipeline.stages as string)
    };

    const response: ApiResponse = {
      success: true,
      data: pipelineWithStages,
      message: 'Pipeline created successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    };

    logger.info('Pipeline created', { userId: user.id, pipelineId: pipeline.id, name });
    res.status(201).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipelines/{id}:
 *   put:
 *     summary: Update a pipeline
 *     tags: [Pipelines]
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
 *         description: Pipeline updated
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, trigger, stages, status } = req.body;

    // Find existing pipeline
    const existingPipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!existingPipeline) {
      throw new NotFoundAppError('Pipeline not found');
    }

    // Check permissions
    const canUpdate =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      existingPipeline.project.ownerId === user.id ||
      existingPipeline.project.team?.members.some(m => m.userId === user.id);

    if (!canUpdate) {
      throw new AuthenticationAppError('Access denied to update this pipeline');
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (trigger !== undefined) {
      if (!Object.values(PipelineTrigger).includes(trigger)) {
        throw new ValidationAppError(`Invalid trigger: ${trigger}`);
      }
      updateData.trigger = trigger;
    }
    if (stages !== undefined) {
      if (!Array.isArray(stages)) {
        throw new ValidationAppError('Stages must be an array');
      }
      updateData.stages = JSON.stringify(stages);
    }
    if (status !== undefined) {
      if (!Object.values(PipelineStatus).includes(status)) {
        throw new ValidationAppError(`Invalid status: ${status}`);
      }
      updateData.status = status;
    }

    const pipeline = await prisma.pipeline.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const pipelineWithStages = {
      ...pipeline,
      stages: JSON.parse(pipeline.stages as string)
    };

    const response: ApiResponse = {
      success: true,
      data: pipelineWithStages,
      message: 'Pipeline updated successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Pipeline updated', { userId: user.id, pipelineId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipelines/{id}:
 *   delete:
 *     summary: Delete a pipeline
 *     tags: [Pipelines]
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
 *         description: Pipeline deleted
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find existing pipeline
    const existingPipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingPipeline) {
      throw new NotFoundAppError('Pipeline not found');
    }

    // Check permissions - only owner or admin can delete
    const canDelete =
      user.role === 'ADMIN' ||
      existingPipeline.project.ownerId === user.id;

    if (!canDelete) {
      throw new AuthenticationAppError('Only project owner or admins can delete pipelines');
    }

    await prisma.pipeline.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      data: { id },
      message: 'Pipeline deleted successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Pipeline deleted', { userId: user.id, pipelineId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipelines/{id}/run:
 *   post:
 *     summary: Trigger a pipeline run
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Pipeline run triggered
 */
router.post('/:id/run', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find pipeline
    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!pipeline) {
      throw new NotFoundAppError('Pipeline not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      pipeline.project.ownerId === user.id ||
      pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to run this pipeline');
    }

    // Create pipeline run
    const pipelineRun = await prisma.pipelineRun.create({
      data: {
        pipelineId: id,
        status: 'PENDING',
        triggeredBy: user.id,
        metadata: JSON.stringify({ triggeredByUser: `${user.firstName} ${user.lastName}` })
      }
    });

    // Update pipeline status and lastRunAt
    await prisma.pipeline.update({
      where: { id },
      data: {
        status: PipelineStatus.RUNNING,
        lastRunAt: new Date()
      }
    });

    // Execute pipeline asynchronously
    const stages = JSON.parse(pipeline.stages as string);
    pipelineExecutor.executePipeline({
      pipelineId: id,
      pipelineRunId: pipelineRun.id,
      projectId: pipeline.projectId,
      repositoryUrl: pipeline.project.repositoryUrl,
      branch: pipeline.project.branch,
      stages,
      triggeredBy: user.id
    }).catch(error => {
      logger.error('Pipeline execution failed', { pipelineRunId: pipelineRun.id, error: error.message });
    });

    const response: ApiResponse = {
      success: true,
      data: pipelineRun,
      message: 'Pipeline run triggered successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    };

    logger.info('Pipeline run triggered', { userId: user.id, pipelineId: id, runId: pipelineRun.id });
    res.status(201).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipelines/{id}/runs:
 *   get:
 *     summary: Get pipeline run history
 *     tags: [Pipelines]
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
 *         description: Pipeline run history
 */
router.get('/:id/runs', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    // Check pipeline exists and user has access
    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!pipeline) {
      throw new NotFoundAppError('Pipeline not found');
    }

    const hasAccess =
      user.role === 'ADMIN' ||
      pipeline.project.ownerId === user.id ||
      pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this pipeline');
    }

    const runs = await prisma.pipelineRun.findMany({
      where: { pipelineId: id },
      include: {
        stages: true
      },
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const runsWithMetadata = runs.map(run => ({
      ...run,
      metadata: JSON.parse(run.metadata as string)
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        runs: runsWithMetadata,
        total: await prisma.pipelineRun.count({ where: { pipelineId: id } }),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      },
      message: 'Pipeline runs retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

export default router;
