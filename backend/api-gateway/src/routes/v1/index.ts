import { Router } from 'express';
import authRoutes from '../auth';
import healthRoutes from '../health';
import usersRoutes from '../users';
import teamsRoutes from '../teams';
import permissionsRoutes from '../permissions';
import projectRoutes from '../projects';
import secretsRoutes from '../secrets';
import securityScansRoutes from '../securityScans';
import integrationsRoutes from '../integrations';
import pipelineRoutes from '../pipelines';
import testRoutes from '../tests';
import deploymentRoutes from '../deployments';
import metricsRoutes from '../metrics';
import auditLogsRoutes from '../auditLogs';
import aiRoutes from '../ai';
import proxyRoutes from '../proxy';

const v1Router = Router();

/**
 * API v1 Routes
 * All routes under /api/v1
 */

// Public routes (no CSRF protection needed)
v1Router.use('/auth', authRoutes);
v1Router.use('/health', healthRoutes);

// Protected routes (CSRF protection applied in server.ts)
v1Router.use('/users', usersRoutes);
v1Router.use('/teams', teamsRoutes);
v1Router.use('/permissions', permissionsRoutes);
v1Router.use('/projects', projectRoutes);
v1Router.use('/', secretsRoutes); // Secrets routes are nested under /projects/:projectId/secrets
v1Router.use('/security', securityScansRoutes);
v1Router.use('/integrations', integrationsRoutes);
v1Router.use('/pipelines', pipelineRoutes);
v1Router.use('/tests', testRoutes);
v1Router.use('/deployments', deploymentRoutes);
v1Router.use('/metrics', metricsRoutes);
v1Router.use('/audit-logs', auditLogsRoutes);
v1Router.use('/ai', aiRoutes);

// Microservice proxy routes
v1Router.use('/', proxyRoutes);

export default v1Router;
