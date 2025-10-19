/**
 * Audit Logs API Routes
 * Provides access to audit logs for administrators
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs (Admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Unauthorized - Admin access required
 */
router.get('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const result = await AuditService.getLogs({
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      resourceId: resourceId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    });
  } catch (error: any) {
    logger.error('Failed to retrieve audit logs', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve audit logs',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/audit-logs/statistics:
 *   get:
 *     summary: Get audit log statistics (Admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       403:
 *         description: Unauthorized
 */
router.get('/statistics', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const statistics = await AuditService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: statistics,
      message: 'Audit log statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    });
  } catch (error: any) {
    logger.error('Failed to retrieve audit log statistics', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve audit log statistics',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/audit-logs/user/{userId}:
 *   get:
 *     summary: Get audit logs for a specific user
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: User audit logs retrieved
 *       403:
 *         description: Unauthorized
 */
router.get('/user/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '20' } = req.query;

    // Users can only view their own logs unless they're admin
    if (req.user?.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own audit logs',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 403,
      });
    }

    const logs = await AuditService.getUserLogs(userId, parseInt(limit as string));

    res.json({
      success: true,
      data: { logs },
      message: 'User audit logs retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    });
  } catch (error: any) {
    logger.error('Failed to retrieve user audit logs', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve user audit logs',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

export default router;
