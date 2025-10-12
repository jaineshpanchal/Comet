// Project Management Service
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from '../shared/utils/logger';
import { errorHandler } from '../shared/middleware/errorHandler';
import { authMiddleware } from '../shared/middleware/auth';

const app = express();
const PORT = process.env.PROJECT_SERVICE_PORT || 8002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'project-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/projects', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Projects list endpoint',
    projects: [
      {
        id: '1',
        name: 'Comet Platform',
        description: 'DevOps Platform Project',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/projects', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Project created',
    project: {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString()
    }
  });
});

app.get('/api/projects/:id', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Project details',
    project: {
      id: req.params.id,
      name: 'Sample Project',
      description: 'Sample project description',
      status: 'active'
    }
  });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Project Service running on port ${PORT}`);
});

export default app;