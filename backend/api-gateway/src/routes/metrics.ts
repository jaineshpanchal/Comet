import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse, UserRole } from '../types';
import { logger } from '../utils/logger';
import { ValidationAppError, NotFoundAppError, AuthenticationAppError } from '../middleware/errorHandler';
import metricsCollector from '../services/metricsCollector';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/metrics/overview:
 *   get:
 *     summary: Get metrics overview
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for metrics
 *     responses:
 *       200:
 *         description: Metrics overview
 *       401:
 *         description: Unauthorized
 */
router.get('/overview', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { timeRange = '24h' } = req.query;

    const metrics = await metricsCollector.getOverviewMetrics(timeRange as string, user);

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Metrics overview retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Metrics overview retrieved', { userId: user?.id || 'unauthenticated', timeRange });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching metrics overview', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/pipelines:
 *   get:
 *     summary: Get pipeline metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Pipeline metrics
 */
router.get('/pipelines', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || null; // Allow unauthenticated access for development
    const { projectId, timeRange = '24h' } = req.query;

    const metrics = await metricsCollector.getPipelineMetrics(
      timeRange as string,
      projectId as string | undefined,
      user
    );

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Pipeline metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Pipeline metrics retrieved', { userId: user?.id || 'unauthenticated', projectId, timeRange });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching pipeline metrics', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/tests:
 *   get:
 *     summary: Get test metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Test metrics
 */
router.get('/tests', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, timeRange = '24h' } = req.query;

    const metrics = await metricsCollector.getTestMetrics(
      timeRange as string,
      projectId as string | undefined,
      user
    );

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Test metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test metrics retrieved', { userId: user?.id || 'unauthenticated', projectId, timeRange });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching test metrics', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/deployments:
 *   get:
 *     summary: Get deployment metrics
 *     tags: [Metrics]
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
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Deployment metrics
 */
router.get('/deployments', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, environment, timeRange = '24h' } = req.query;

    const metrics = await metricsCollector.getDeploymentMetrics(
      timeRange as string,
      projectId as string | undefined,
      environment as string | undefined,
      user
    );

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Deployment metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Deployment metrics retrieved', { userId: user?.id || 'unauthenticated', projectId, environment, timeRange });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching deployment metrics', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/project/{projectId}:
 *   get:
 *     summary: Get metrics for a specific project
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Project metrics
 *       404:
 *         description: Project not found
 */
router.get('/project/:projectId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { timeRange = '24h' } = req.query;

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
      throw new AuthenticationAppError('Access denied to view project metrics');
    }

    const metrics = await metricsCollector.getProjectMetrics(projectId, timeRange as string);

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Project metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Project metrics retrieved', { userId: user?.id || 'unauthenticated', projectId, timeRange });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/dashboard:
 *   get:
 *     summary: Get dashboard metrics (KPIs)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || null; // Allow unauthenticated access for development
    const { timeRange = '24h' } = req.query;

    const metrics = await metricsCollector.getDashboardMetrics(timeRange as string, user);

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Dashboard metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Dashboard metrics retrieved', { userId: user?.id || 'unauthenticated', timeRange });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching dashboard metrics', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/activities:
 *   get:
 *     summary: Get recent activities
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pipeline, test, deployment, all]
 *           default: all
 *     responses:
 *       200:
 *         description: Recent activities
 */
router.get('/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || null; // Allow unauthenticated access for development
    const { limit = '20', type = 'all' } = req.query;

    const activities = await metricsCollector.getRecentActivities(
      parseInt(limit as string),
      type as string,
      user
    );

    const response: ApiResponse = {
      success: true,
      data: activities,
      message: `Found ${activities.length} recent activities`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Recent activities retrieved', { userId: user?.id || 'unauthenticated', count: activities.length });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching recent activities', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/trends:
 *   get:
 *     summary: Get metrics trends
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [pipelines, tests, deployments, success_rate]
 *         required: true
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Metrics trends
 */
router.get('/trends', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { metric, timeRange = '30d' } = req.query;

    if (!metric) {
      throw new ValidationAppError('metric parameter is required');
    }

    const trends = await metricsCollector.getMetricTrends(
      metric as string,
      timeRange as string,
      user
    );

    const response: ApiResponse = {
      success: true,
      data: trends,
      message: 'Metrics trends retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Metrics trends retrieved', { userId: user?.id || 'unauthenticated', metric, timeRange });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching metrics trends', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/metrics/health:
 *   get:
 *     summary: Get system health metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health metrics
 */
router.get('/health', authenticateToken, requireRole(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    const healthMetrics = await metricsCollector.getSystemHealthMetrics();

    const response: ApiResponse = {
      success: true,
      data: healthMetrics,
      message: 'System health metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('System health metrics retrieved', { userId: user?.id || 'unauthenticated' });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching system health metrics', { error: error.message });
    next(error);
  }
});

export default router;
