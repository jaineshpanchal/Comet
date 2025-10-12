import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageInMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };
    
    // Get system uptime
    const uptime = process.uptime();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'user-management-service',
      version: '1.0.0',
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      memory: memoryUsageInMB,
      nodeVersion: process.version,
      pid: process.pid
    };

    res.status(200).json({
      success: true,
      data: healthData,
      message: 'User Management Service is healthy',
      timestamp: new Date().toISOString(),
      statusCode: 200
    });

  } catch (error: any) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'user-management-service',
        version: '1.0.0',
        error: error.message
      },
      message: 'User Management Service is unhealthy',
      error: 'Service health check failed',
      timestamp: new Date().toISOString(),
      statusCode: 503
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks = [];
    let overallStatus = 'healthy';
    
    // Database connectivity check
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - dbStart;
      
      checks.push({
        name: 'database',
        status: 'healthy',
        responseTime: `${dbTime}ms`,
        details: 'PostgreSQL connection successful'
      });
    } catch (dbError: any) {
      overallStatus = 'unhealthy';
      checks.push({
        name: 'database',
        status: 'unhealthy',
        error: dbError.message,
        details: 'Failed to connect to PostgreSQL'
      });
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    checks.push({
      name: 'memory',
      status: heapUsedPercent > 90 ? 'unhealthy' : heapUsedPercent > 70 ? 'degraded' : 'healthy',
      details: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsedPercent: `${heapUsedPercent.toFixed(1)}%`
      }
    });

    if (heapUsedPercent > 90) overallStatus = 'unhealthy';
    else if (heapUsedPercent > 70 && overallStatus === 'healthy') overallStatus = 'degraded';

    // CPU usage check (simplified)
    const cpuUsage = process.cpuUsage();
    checks.push({
      name: 'cpu',
      status: 'healthy', // Simplified for now
      details: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    });

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'user-management-service',
      version: '1.0.0',
      checks,
      uptime: process.uptime(),
      nodeVersion: process.version,
      pid: process.pid
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: healthData,
      message: `User Management Service is ${overallStatus}`,
      timestamp: new Date().toISOString(),
      statusCode
    });

  } catch (error: any) {
    logger.error('Detailed health check failed:', error);
    
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      statusCode: 503
    });
  }
});

export default router;