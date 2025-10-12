// Code Quality & Scanning Service
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from '../shared/utils/logger';
import { errorHandler } from '../shared/middleware/errorHandler';
import { authMiddleware } from '../shared/middleware/auth';

const app = express();
const PORT = process.env.QUALITY_SERVICE_PORT || 8005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'quality-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/scans', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Code scan initiated',
    scan: {
      id: Date.now().toString(),
      project_id: req.body.project_id,
      type: req.body.type || 'full',
      status: 'running',
      started_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 600000).toISOString()
    }
  });
});

app.get('/api/scans', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Code scans list',
    scans: [
      {
        id: '1',
        project_id: '1',
        type: 'security',
        status: 'completed',
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3300000).toISOString(),
        results: {
          vulnerabilities: {
            critical: 0,
            high: 2,
            medium: 5,
            low: 12
          },
          code_quality: {
            score: 8.5,
            coverage: 85,
            duplication: 3.2
          }
        }
      }
    ]
  });
});

app.get('/api/scans/:id', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Scan details',
    scan: {
      id: req.params.id,
      project_id: '1',
      type: 'security',
      status: 'completed',
      results: {
        vulnerabilities: [
          {
            id: 'vuln-1',
            severity: 'high',
            type: 'SQL Injection',
            file: 'src/db/queries.ts',
            line: 45,
            description: 'Potential SQL injection vulnerability'
          }
        ],
        code_smells: [
          {
            id: 'smell-1',
            severity: 'medium',
            type: 'Code Duplication',
            file: 'src/utils/helpers.ts',
            description: 'Duplicated code block detected'
          }
        ]
      }
    }
  });
});

// Integration endpoints
app.post('/api/integrations/sonarqube/webhook', (req, res) => {
  logger.info('SonarQube webhook received', req.body);
  res.json({ success: true, message: 'Webhook processed' });
});

app.get('/api/quality-gates/:projectId', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Quality gate status',
    quality_gate: {
      project_id: req.params.projectId,
      status: 'passed',
      conditions: [
        { metric: 'coverage', value: 85, threshold: 80, status: 'passed' },
        { metric: 'duplicated_lines_density', value: 3.2, threshold: 5, status: 'passed' },
        { metric: 'vulnerabilities', value: 2, threshold: 0, status: 'failed' }
      ]
    }
  });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Quality Service running on port ${PORT}`);
});

export default app;