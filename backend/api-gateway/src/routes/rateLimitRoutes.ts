import express, { Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getRateLimitStatus, resetRateLimit } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Rate Limit Management Routes
 * Admin-only endpoints for managing rate limits
 */

/**
 * GET /api/v1/rate-limits/status
 * Get current rate limit status for the authenticated user
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const status = await getRateLimitStatus(req);

    if (!status) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get rate limit status',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        limit: status.limit,
        current: status.current,
        remaining: status.remaining,
        resetTime: new Date(status.resetTime).toISOString(),
        resetIn: Math.ceil((status.resetTime - Date.now()) / 1000),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting rate limit status', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/v1/rate-limits/reset
 * Reset rate limit for a user (admin only)
 * Body: { userId: string, path?: string }
 */
router.post('/reset', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, path } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        timestamp: new Date().toISOString(),
      });
    }

    const success = await resetRateLimit(userId, path);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reset rate limit',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Rate limit reset by admin', {
      adminId: (req as any).user?.id,
      targetUserId: userId,
      path,
    });

    res.json({
      success: true,
      message: 'Rate limit reset successfully',
      data: {
        userId,
        path: path || 'all endpoints',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error resetting rate limit', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/rate-limits/config
 * Get rate limit configuration (admin only)
 */
router.get('/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const config = {
      presets: {
        auth: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 5,
          description: 'Authentication endpoints (login, register)',
        },
        api: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 100,
          description: 'General API endpoints',
        },
        heavy: {
          windowMs: 60 * 60 * 1000,
          maxRequests: 10,
          description: 'Heavy operations (builds, deployments)',
        },
        public: {
          windowMs: 60 * 1000,
          maxRequests: 20,
          description: 'Public endpoints',
        },
        admin: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 500,
          description: 'Admin endpoints',
        },
        write: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 30,
          description: 'Write operations',
        },
        read: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 200,
          description: 'Read operations',
        },
      },
      roleMultipliers: {
        ADMIN: 5,
        MANAGER: 3,
        DEVELOPER: 2,
        TESTER: 1.5,
        VIEWER: 1,
      },
      features: [
        'Redis-based distributed rate limiting',
        'Per-endpoint configuration',
        'User-specific and IP-based limiting',
        'Sliding window algorithm',
        'Tiered limits based on user role',
        'Rate limit headers (X-RateLimit-*)',
        'Automatic cleanup of expired keys',
      ],
    };

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting rate limit config', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
