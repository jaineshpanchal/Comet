import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../utils/logger';

const router = Router();

// Service discovery configuration
const services = {
  'user-service': {
    target: `http://localhost:${process.env.USER_SERVICE_PORT || 8001}`,
    pathPrefix: '/api/users'
  },
  'project-service': {
    target: `http://localhost:${process.env.PROJECT_SERVICE_PORT || 8002}`,
    pathPrefix: '/api/projects'
  },
  'pipeline-service': {
    target: `http://localhost:${process.env.PIPELINE_SERVICE_PORT || 8003}`,
    pathPrefix: '/api/pipelines'
  },
  'testing-service': {
    target: `http://localhost:${process.env.TESTING_SERVICE_PORT || 8004}`,
    pathPrefix: '/api/test'
  },
  'quality-service': {
    target: `http://localhost:${process.env.QUALITY_SERVICE_PORT || 8005}`,
    pathPrefix: '/api/scans'
  }
};

// Create proxy middleware for each service
Object.entries(services).forEach(([serviceName, config]) => {
  const proxyMiddleware = createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: {
      [`^${config.pathPrefix}`]: '/api'
    },
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      logger.info(`Proxying request to ${serviceName}`, {
        originalUrl: req.originalUrl,
        target: config.target,
        method: req.method
      });
    },
    onProxyRes: (proxyRes: any, req: any, res: any) => {
      logger.info(`Response from ${serviceName}`, {
        statusCode: proxyRes.statusCode,
        originalUrl: req.originalUrl
      });
    },
    onError: (err: any, req: any, res: any) => {
      logger.error(`Proxy error for ${serviceName}`, {
        error: err.message,
        originalUrl: req.originalUrl
      });
      
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: `Service ${serviceName} is currently unavailable`,
          error: 'Service Unavailable',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Register the proxy middleware
  router.use(config.pathPrefix, proxyMiddleware);
});

// Service health check aggregation
router.get('/services/health', async (req, res) => {
  const healthChecks = await Promise.allSettled(
    Object.entries(services).map(async ([serviceName, config]) => {
      try {
        const response = await fetch(`${config.target}/health`);
        const data = await response.json() as any;
        return {
          service: serviceName,
          status: 'healthy',
          version: data.version,
          timestamp: data.timestamp
        };
      } catch (error) {
        return {
          service: serviceName,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const results = healthChecks.map((result, index) => {
    const serviceName = Object.keys(services)[index];
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: serviceName,
        status: 'unhealthy',
        error: result.reason
      };
    }
  });

  const overallHealth = results.every(r => r.status === 'healthy');

  res.status(overallHealth ? 200 : 503).json({
    success: overallHealth,
    overall_status: overallHealth ? 'healthy' : 'degraded',
    services: results,
    timestamp: new Date().toISOString()
  });
});

export default router;