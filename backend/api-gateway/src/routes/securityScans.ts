/**
 * Security Scans API Routes
 */

import { Router, Response } from 'express';
import { Permission } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { SecurityScanService } from '../services/securityScanService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/security/scans/projects/:projectId
 * Run security scan for a project
 */
router.post(
  '/scans/projects/:projectId',
  authenticateToken,
  requirePermission(Permission.PROJECT_MANAGE_SETTINGS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const { projectPath } = req.body;

      if (!projectPath) {
        return res.status(400).json({
          success: false,
          error: 'Project path is required',
        });
      }

      const scanId = await SecurityScanService.runNpmAudit(
        projectId,
        projectPath,
        req.user!.id
      );

      res.json({
        success: true,
        data: { scanId },
        message: 'Security scan initiated',
      });
    } catch (error: any) {
      logger.error('Error initiating security scan', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to initiate security scan',
      });
    }
  }
);

/**
 * GET /api/security/scans/:scanId
 * Get security scan results
 */
router.get(
  '/scans/:scanId',
  authenticateToken,
  requirePermission(Permission.PROJECT_VIEW),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const { scanId } = _req.params;

      const results = await SecurityScanService.getScanResults(scanId);

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Error retrieving scan results', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve scan results',
      });
    }
  }
);

/**
 * GET /api/security/projects/:projectId/scans
 * Get all scans for a project
 */
router.get(
  '/projects/:projectId/scans',
  authenticateToken,
  requirePermission(Permission.PROJECT_VIEW),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const scans = await SecurityScanService.getProjectScans(projectId, limit);

      res.json({
        success: true,
        data: scans,
      });
    } catch (error: any) {
      logger.error('Error retrieving project scans', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve project scans',
      });
    }
  }
);

/**
 * GET /api/security/statistics
 * Get security statistics
 */
router.get(
  '/statistics',
  authenticateToken,
  requirePermission(Permission.SYSTEM_VIEW_METRICS),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.query;

      const statistics = await SecurityScanService.getSecurityStatistics(
        projectId as string | undefined
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      logger.error('Error retrieving security statistics', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security statistics',
      });
    }
  }
);

export default router;
