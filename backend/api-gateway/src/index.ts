import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3030',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Comet DevOps Platform API',
      version: '1.0.0',
      description: 'Enterprise DevOps Platform API Gateway'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/middleware/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0'
  });
});

// Service proxy routes
const services = {
  pipeline: process.env.PIPELINE_SERVICE_URL || 'http://localhost:3001',
  testing: process.env.TESTING_SERVICE_URL || 'http://localhost:3002',
  integration: process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3003',
  analysis: process.env.ANALYSIS_SERVICE_URL || 'http://localhost:3004',
  monitoring: process.env.MONITORING_SERVICE_URL || 'http://localhost:3005',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:8001'
};

// Pipeline Service Routes
app.use('/api/v1/pipelines', 
  authMiddleware,
  createProxyMiddleware({
    target: services.pipeline,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/pipelines': ''
    },
    onError: (err, req, res) => {
      logger.error('Pipeline service proxy error:', err);
      res.status(502).json({ error: 'Pipeline service unavailable' });
    }
  })
);

// Testing Service Routes
app.use('/api/v1/testing',
  authMiddleware,
  createProxyMiddleware({
    target: services.testing,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/testing': ''
    },
    onError: (err, req, res) => {
      logger.error('Testing service proxy error:', err);
      res.status(502).json({ error: 'Testing service unavailable' });
    }
  })
);

// Integration Service Routes
app.use('/api/v1/integrations',
  authMiddleware,
  createProxyMiddleware({
    target: services.integration,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/integrations': ''
    },
    onError: (err, req, res) => {
      logger.error('Integration service proxy error:', err);
      res.status(502).json({ error: 'Integration service unavailable' });
    }
  })
);

// Code Analysis Service Routes
app.use('/api/v1/analysis',
  authMiddleware,
  createProxyMiddleware({
    target: services.analysis,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/analysis': ''
    },
    onError: (err, req, res) => {
      logger.error('Analysis service proxy error:', err);
      res.status(502).json({ error: 'Analysis service unavailable' });
    }
  })
);

// Monitoring Service Routes
app.use('/api/v1/monitoring',
  authMiddleware,
  createProxyMiddleware({
    target: services.monitoring,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/monitoring': ''
    },
    onError: (err, req, res) => {
      logger.error('Monitoring service proxy error:', err);
      res.status(502).json({ error: 'Monitoring service unavailable' });
    }
  })
);

// AI Service Routes
app.use('/api/v1/ai',
  authMiddleware,
  createProxyMiddleware({
    target: services.ai,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/ai': ''
    },
    onError: (err, req, res) => {
      logger.error('AI service proxy error:', err);
      res.status(502).json({ error: 'AI service unavailable' });
    }
  })
);

// WebSocket proxy for real-time features
app.use('/ws',
  createProxyMiddleware({
    target: services.monitoring,
    ws: true,
    changeOrigin: true,
    pathRewrite: {
      '^/ws': '/ws'
    }
  })
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
});

export default app;