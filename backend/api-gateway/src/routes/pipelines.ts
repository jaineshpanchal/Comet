import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, PipelineTrigger, PipelineStatus, StageType } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { ValidationAppError, NotFoundAppError, AuthenticationAppError } from '../middleware/errorHandler';
import pipelineExecutor from '../services/pipelineExecutor';
import { queueService } from '../services/queueService';

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
 * /api/pipelines/{id}/trigger:
 *   post:
 *     summary: Trigger a manual pipeline execution
 *     tags: [Pipelines]
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
 *               branch:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Pipeline triggered successfully
 */
router.post('/:id/trigger', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { branch, metadata } = req.body;

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
      throw new AuthenticationAppError('Access denied to trigger this pipeline');
    }

    // Check if pipeline is active
    if (!pipeline.isActive) {
      throw new ValidationAppError('Pipeline is not active');
    }

    // Create pipeline run
    const pipelineRun = await prisma.pipelineRun.create({
      data: {
        pipelineId: id,
        status: 'PENDING',
        triggeredBy: user.id,
        metadata: JSON.stringify(metadata || {})
      }
    });

    // Parse stages
    const stages = JSON.parse(pipeline.stages as string);

    // Queue pipeline execution job
    await queueService.addPipelineExecutionJob({
      pipelineId: id,
      pipelineRunId: pipelineRun.id,
      projectId: pipeline.projectId,
      repositoryUrl: pipeline.project.repositoryUrl,
      branch: branch || pipeline.project.branch || 'main',
      stages,
      triggeredBy: `${user.firstName} ${user.lastName}`,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        pipelineId: id,
        pipelineRunId: pipelineRun.id,
        status: 'PENDING'
      },
      message: 'Pipeline triggered successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    };

    logger.info('Pipeline triggered', { userId: user.id, pipelineId: id, pipelineRunId: pipelineRun.id });
    res.status(201).json(response);
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

/**
 * @swagger
 * /api/pipeline-runs/{id}:
 *   get:
 *     summary: Get pipeline run details
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
 *         description: Pipeline run details
 */
router.get('/runs/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const pipelineRun = await prisma.pipelineRun.findUnique({
      where: { id },
      include: {
        pipeline: {
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
        },
        stages: {
          orderBy: {
            startedAt: 'asc'
          }
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!pipelineRun) {
      throw new NotFoundAppError('Pipeline run not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      pipelineRun.pipeline.project.ownerId === user.id ||
      pipelineRun.pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this pipeline run');
    }

    const runWithMetadata = {
      ...pipelineRun,
      metadata: JSON.parse(pipelineRun.metadata as string),
      stages: pipelineRun.stages.map(stage => ({
        ...stage,
        metadata: JSON.parse(stage.metadata as string),
        artifacts: JSON.parse(stage.artifacts as string)
      }))
    };

    const response: ApiResponse = {
      success: true,
      data: runWithMetadata,
      message: 'Pipeline run retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipeline-runs/{id}/logs:
 *   get:
 *     summary: Get pipeline run logs
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
 *         description: Pipeline run logs
 */
router.get('/runs/:id/logs', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const pipelineRun = await prisma.pipelineRun.findUnique({
      where: { id },
      include: {
        pipeline: {
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
        },
        stages: {
          orderBy: {
            startedAt: 'asc'
          },
          select: {
            id: true,
            stageName: true,
            stageType: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            duration: true,
            logs: true
          }
        }
      }
    });

    if (!pipelineRun) {
      throw new NotFoundAppError('Pipeline run not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      pipelineRun.pipeline.project.ownerId === user.id ||
      pipelineRun.pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this pipeline run');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        pipelineRunId: pipelineRun.id,
        pipelineName: pipelineRun.pipeline.name,
        status: pipelineRun.status,
        startedAt: pipelineRun.startedAt,
        finishedAt: pipelineRun.finishedAt,
        duration: pipelineRun.duration,
        globalLogs: pipelineRun.logs,
        stages: pipelineRun.stages
      },
      message: 'Pipeline logs retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipeline-runs/{id}/cancel:
 *   post:
 *     summary: Cancel a running pipeline
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
 *         description: Pipeline cancelled
 */
router.post('/runs/:id/cancel', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const pipelineRun = await prisma.pipelineRun.findUnique({
      where: { id },
      include: {
        pipeline: {
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
        }
      }
    });

    if (!pipelineRun) {
      throw new NotFoundAppError('Pipeline run not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      pipelineRun.pipeline.project.ownerId === user.id ||
      pipelineRun.pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to cancel this pipeline run');
    }

    // Check if pipeline is running
    if (pipelineRun.status !== 'RUNNING' && pipelineRun.status !== 'PENDING') {
      throw new ValidationAppError('Can only cancel running or pending pipelines');
    }

    // Cancel pipeline execution
    await pipelineExecutor.cancelPipelineRun(id);

    const response: ApiResponse = {
      success: true,
      data: { id, status: 'CANCELLED' },
      message: 'Pipeline run cancelled successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Pipeline run cancelled', { userId: user.id, pipelineRunId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipeline-runs/{id}/retry:
 *   post:
 *     summary: Retry a failed pipeline run
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
 *         description: Pipeline retry initiated
 */
router.post('/runs/:id/retry', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const originalRun = await prisma.pipelineRun.findUnique({
      where: { id },
      include: {
        pipeline: {
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
        }
      }
    });

    if (!originalRun) {
      throw new NotFoundAppError('Pipeline run not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      originalRun.pipeline.project.ownerId === user.id ||
      originalRun.pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to retry this pipeline run');
    }

    // Check if pipeline can be retried
    if (originalRun.status === 'RUNNING' || originalRun.status === 'PENDING') {
      throw new ValidationAppError('Cannot retry a running or pending pipeline');
    }

    // Create new pipeline run
    const metadata = JSON.parse(originalRun.metadata as string);
    const newPipelineRun = await prisma.pipelineRun.create({
      data: {
        pipelineId: originalRun.pipelineId,
        status: 'PENDING',
        triggeredBy: user.id,
        metadata: JSON.stringify({
          ...metadata,
          retriedFrom: id,
          retriedByUser: `${user.firstName} ${user.lastName}`
        })
      }
    });

    // Update pipeline status
    await prisma.pipeline.update({
      where: { id: originalRun.pipelineId },
      data: {
        status: PipelineStatus.PENDING,
        lastRunAt: new Date()
      }
    });

    // Queue pipeline execution
    const stages = JSON.parse(originalRun.pipeline.stages as string);
    await queueService.addPipelineExecutionJob({
      pipelineId: originalRun.pipelineId,
      pipelineRunId: newPipelineRun.id,
      projectId: originalRun.pipeline.projectId,
      repositoryUrl: originalRun.pipeline.project.repositoryUrl,
      branch: originalRun.pipeline.project.branch,
      stages,
      triggeredBy: user.id
    });

    const response: ApiResponse = {
      success: true,
      data: {
        originalRunId: id,
        newRunId: newPipelineRun.id,
        status: 'PENDING'
      },
      message: 'Pipeline retry initiated successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    };

    logger.info('Pipeline run retried', {
      userId: user.id,
      originalRunId: id,
      newRunId: newPipelineRun.id
    });

    res.status(201).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pipeline-runs/{id}/stages:
 *   get:
 *     summary: Get pipeline run stages with detailed logs
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
 *         description: Pipeline run stages
 */
router.get('/runs/:id/stages', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const pipelineRun = await prisma.pipelineRun.findUnique({
      where: { id },
      include: {
        pipeline: {
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
        }
      }
    });

    if (!pipelineRun) {
      throw new NotFoundAppError('Pipeline run not found');
    }

    // Check access
    const hasAccess =
      user.role === 'ADMIN' ||
      pipelineRun.pipeline.project.ownerId === user.id ||
      pipelineRun.pipeline.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this pipeline run');
    }

    const stages = await prisma.stageRun.findMany({
      where: { pipelineRunId: id },
      orderBy: { startedAt: 'asc' }
    });

    const stagesWithMetadata = stages.map(stage => ({
      ...stage,
      metadata: JSON.parse(stage.metadata as string),
      artifacts: JSON.parse(stage.artifacts as string)
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        pipelineRunId: id,
        stages: stagesWithMetadata
      },
      message: 'Pipeline stages retrieved successfully',
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
