// Pipeline Management Service
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from '../shared/utils/logger';
import { errorHandler } from '../shared/middleware/errorHandler';
import { authMiddleware } from '../shared/middleware/auth';

const app = express();
const PORT = process.env.PIPELINE_SERVICE_PORT || 8003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pipeline-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/pipelines', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Pipelines list endpoint',
    pipelines: [
      {
        id: '1',
        name: 'CI/CD Pipeline',
        project_id: '1',
        status: 'running',
        stages: ['build', 'test', 'deploy'],
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/pipelines', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Pipeline created',
    pipeline: {
      id: Date.now().toString(),
      ...req.body,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  });
});

app.post('/api/pipelines/:id/run', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Pipeline execution started',
    execution: {
      id: Date.now().toString(),
      pipeline_id: req.params.id,
      status: 'running',
      started_at: new Date().toISOString()
    }
  });
});

app.get('/api/pipelines/:id/executions', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Pipeline executions',
    executions: [
      {
        id: '1',
        pipeline_id: req.params.id,
        status: 'completed',
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date().toISOString()
      }
    ]
  });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Pipeline Service running on port ${PORT}`);
});

export default app;