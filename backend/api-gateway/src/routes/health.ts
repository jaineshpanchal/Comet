// Health check and system status routes
import { Router, Request, Response } from 'express';
import { ServiceProxy } from '../services/serviceProxy';
import { checkDatabaseConnection } from '../config/database';
import { checkRedisConnection } from '../config/redis';
import { APP_CONFIG } from '../config/services';
import { SystemHealth, HealthCheck } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Get system uptime
const getUptime = (): number => {
  return process.uptime();
};

// Get memory usage
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
  };
};

// Get CPU usage (simplified)
const getCpuUsage = () => {
  const cpus = require('os').cpus();
  return {
    count: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    speed: cpus[0]?.speed || 0
  };
};

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: APP_CONFIG.NODE_ENV
    };

    res.json({
      success: true,
      data: healthCheck,
      message: 'API Gateway is healthy',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: 'Service is unhealthy',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 503
    });
  }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check including dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed system health information
 *       503:
 *         description: One or more services are unhealthy
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Check core dependencies
    const [dbHealthy, redisHealthy] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection()
    ]);

    // Check microservices
    const serviceHealthChecks = await ServiceProxy.checkAllServicesHealth();

    // Determine overall health
    const allServicesHealthy = serviceHealthChecks.every(service => service.status === 'healthy');
    const overallStatus = dbHealthy && redisHealthy && allServicesHealthy ? 'healthy' : 
                         (dbHealthy && redisHealthy ? 'degraded' : 'unhealthy');

    const systemHealth: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: serviceHealthChecks,
      database: {
        service: 'postgresql',
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { connected: dbHealthy }
      },
      redis: {
        service: 'redis',
        status: redisHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { connected: redisHealthy }
      },
      version: process.env.APP_VERSION || '1.0.0',
      uptime: getUptime()
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: systemHealth,
      message: `System is ${overallStatus}`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode
    });
  } catch (error: any) {
    logger.error('Detailed health check failed', { error: error.message });
    
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: 'Unable to determine system health',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 503
    });
  }
});

/**
 * @swagger
 * /api/health/services:
 *   get:
 *     summary: Check health of all microservices
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health information
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const serviceHealthChecks = await ServiceProxy.checkAllServicesHealth();
    
    const healthyCount = serviceHealthChecks.filter(s => s.status === 'healthy').length;
    const totalCount = serviceHealthChecks.length;
    
    res.json({
      success: true,
      data: {
        services: serviceHealthChecks,
        summary: {
          total: totalCount,
          healthy: healthyCount,
          unhealthy: totalCount - healthyCount,
          healthPercentage: Math.round((healthyCount / totalCount) * 100)
        }
      },
      message: `${healthyCount}/${totalCount} services are healthy`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Service health check failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Service health check failed',
      message: 'Unable to check service health',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
});

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get system metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = {
      system: {
        uptime: getUptime(),
        memory: getMemoryUsage(),
        cpu: getCpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      application: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: APP_CONFIG.NODE_ENV,
        port: APP_CONFIG.PORT,
        pid: process.pid
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: metrics,
      message: 'System metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Failed to get system metrics', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: 'Unable to retrieve system metrics',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
});

/**
 * @swagger
 * /api/health/services/{serviceName}:
 *   get:
 *     summary: Check health of a specific service
 *     tags: [Health]
 *     parameters:
 *       - in: path
 *         name: serviceName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PIPELINE, TESTING, INTEGRATION, CODE_ANALYSIS, MONITORING, AI_SERVICES]
 *     responses:
 *       200:
 *         description: Service health information
 *       404:
 *         description: Service not found
 */
router.get('/services/:serviceName', async (req: Request, res: Response) => {
  try {
    const serviceName = req.params.serviceName.toUpperCase();
    
    // Validate service name
    const validServices = ['PIPELINE', 'TESTING', 'INTEGRATION', 'CODE_ANALYSIS', 'MONITORING', 'AI_SERVICES'];
    if (!validServices.includes(serviceName)) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        message: `Service '${serviceName}' is not a valid service`,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 404
      });
    }

    const healthCheck = await ServiceProxy.checkServiceHealth(serviceName as any);
    
    res.json({
      success: true,
      data: healthCheck,
      message: `Health check for ${serviceName} completed`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Service health check failed', { 
      error: error.message,
      serviceName: req.params.serviceName 
    });
    
    res.status(500).json({
      success: false,
      error: 'Service health check failed',
      message: 'Unable to check service health',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
});

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Readiness probe (for Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    const [dbHealthy, redisHealthy] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection()
    ]);

    if (dbHealthy && redisHealthy) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'healthy',
          redis: 'healthy'
        }
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy'
        }
      });
    }
  } catch (error: any) {
    logger.error('Readiness check failed', { error: error.message });
    
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Liveness probe (for Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/liveness', (req: Request, res: Response) => {
  // Simple liveness check - just return 200 if the process is running
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: getUptime()
  });
});

export default router;