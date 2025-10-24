import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { jobQueueManager, QueueName, addEmailJob, addReportJob, EmailJobType, ReportJobType, JobPriority } from '../services/jobQueue';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/jobs/queues:
 *   get:
 *     summary: Get all queue statistics
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics
 */
router.get('/queues', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await jobQueueManager.getAllQueueStats();

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: 'Queue statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get queue stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/queues/{queueName}/stats:
 *   get:
 *     summary: Get specific queue statistics
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [email, report, pipeline, test, deployment, notification, cleanup, analytics]
 *     responses:
 *       200:
 *         description: Queue statistics
 */
router.get('/queues/:queueName/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queueName = req.params.queueName as QueueName;

    const stats = await jobQueueManager.getQueueStats(queueName);

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: `Statistics for ${queueName} queue retrieved successfully`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get queue stats', { error: error.message, queue: req.params.queueName });
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/queues/{queueName}/failed:
 *   get:
 *     summary: Get failed jobs for a queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: end
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Failed jobs
 */
router.get('/queues/:queueName/failed', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queueName = req.params.queueName as QueueName;
    const start = parseInt(req.query.start as string) || 0;
    const end = parseInt(req.query.end as string) || 10;

    const failedJobs = await jobQueueManager.getFailedJobs(queueName, start, end);

    const response: ApiResponse = {
      success: true,
      data: failedJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      })),
      message: `Found ${failedJobs.length} failed jobs`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get failed jobs', { error: error.message, queue: req.params.queueName });
    res.status(500).json({
      success: false,
      error: 'Failed to get failed jobs',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/queues/{queueName}/job/{jobId}/retry:
 *   post:
 *     summary: Retry a failed job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job retried successfully
 */
router.post('/queues/:queueName/job/:jobId/retry', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queueName = req.params.queueName as QueueName;
    const jobId = req.params.jobId;

    await jobQueueManager.retryJob(queueName, jobId);

    const response: ApiResponse = {
      success: true,
      data: { jobId, queueName },
      message: 'Job retried successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to retry job', { error: error.message, queue: req.params.queueName, jobId: req.params.jobId });
    res.status(500).json({
      success: false,
      error: 'Failed to retry job',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/queues/{queueName}/pause:
 *   post:
 *     summary: Pause a queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue paused successfully
 */
router.post('/queues/:queueName/pause', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queueName = req.params.queueName as QueueName;

    await jobQueueManager.pauseQueue(queueName);

    const response: ApiResponse = {
      success: true,
      data: { queueName },
      message: 'Queue paused successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to pause queue', { error: error.message, queue: req.params.queueName });
    res.status(500).json({
      success: false,
      error: 'Failed to pause queue',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/queues/{queueName}/resume:
 *   post:
 *     summary: Resume a paused queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue resumed successfully
 */
router.post('/queues/:queueName/resume', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queueName = req.params.queueName as QueueName;

    await jobQueueManager.resumeQueue(queueName);

    const response: ApiResponse = {
      success: true,
      data: { queueName },
      message: 'Queue resumed successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to resume queue', { error: error.message, queue: req.params.queueName });
    res.status(500).json({
      success: false,
      error: 'Failed to resume queue',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/queues/{queueName}/clean:
 *   post:
 *     summary: Clean old jobs from a queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
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
 *               grace:
 *                 type: number
 *                 description: Grace period in milliseconds (default: 7 days)
 *               status:
 *                 type: string
 *                 enum: [completed, failed]
 *     responses:
 *       200:
 *         description: Queue cleaned successfully
 */
router.post('/queues/:queueName/clean', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queueName = req.params.queueName as QueueName;
    const { grace, status } = req.body;

    const cleanedJobs = await jobQueueManager.cleanQueue(queueName, grace, status);

    const response: ApiResponse = {
      success: true,
      data: {
        queueName,
        removedCount: cleanedJobs.length,
      },
      message: `Cleaned ${cleanedJobs.length} jobs from ${queueName} queue`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to clean queue', { error: error.message, queue: req.params.queueName });
    res.status(500).json({
      success: false,
      error: 'Failed to clean queue',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/email:
 *   post:
 *     summary: Add an email job to the queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - to
 *               - context
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [welcome, password-reset, pipeline-complete, test-results, deployment-notification, alert]
 *               to:
 *                 type: string
 *                 description: Email address or comma-separated list
 *               context:
 *                 type: object
 *                 description: Template context data
 *     responses:
 *       200:
 *         description: Email job added successfully
 */
router.post('/email', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type, to, context } = req.body;

    const job = await addEmailJob(
      type as EmailJobType,
      { to, context },
      JobPriority.NORMAL
    );

    const response: ApiResponse = {
      success: true,
      data: {
        jobId: job.id,
        type,
        to,
      },
      message: 'Email job added to queue',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to add email job', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to add email job',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/jobs/report:
 *   post:
 *     summary: Generate a report
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pipeline-report, test-coverage, security-scan, analytics, audit-log]
 *               data:
 *                 type: object
 *                 description: Report-specific data
 *     responses:
 *       200:
 *         description: Report job added successfully
 */
router.post('/report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type, data } = req.body;

    const job = await addReportJob(
      type as ReportJobType,
      { ...data, userId: user.id },
      JobPriority.NORMAL
    );

    const response: ApiResponse = {
      success: true,
      data: {
        jobId: job.id,
        type,
      },
      message: 'Report generation job added to queue',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to add report job', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to add report job',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

export default router;
