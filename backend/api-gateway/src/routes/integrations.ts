import express, { Request, Response } from 'express';
import { GitHubIntegrationService } from '../services/githubIntegrationService';
import { WebhookProcessor } from '../services/webhookProcessor';
import { authenticateToken } from '../middleware/auth';
import { AuditService, AuditAction } from '../services/auditService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   POST /api/integrations/github
 * @desc    Create a new GitHub integration
 * @access  Private
 */
router.post('/github', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { accessToken, name } = req.body;
    const userId = (req as any).user.userId;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required',
      });
    }

    const integration = await GitHubIntegrationService.createIntegration(
      userId,
      accessToken,
      name
    );

    await AuditService.log({
      userId,
      action: AuditAction.INTEGRATION_CREATE,
      resource: 'Integration',
      resourceId: integration.id,
      metadata: { type: 'GITHUB', name: integration.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    logger.error('Failed to create GitHub integration', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create GitHub integration',
    });
  }
});

/**
 * @route   GET /api/integrations
 * @desc    List all integrations for the current user
 * @access  Private
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const integrations = await GitHubIntegrationService.listIntegrations(userId);

    res.json({
      success: true,
      data: integrations,
    });
  } catch (error: any) {
    logger.error('Failed to list integrations', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch integrations',
    });
  }
});

/**
 * @route   GET /api/integrations/:id
 * @desc    Get integration details
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const integration = await GitHubIntegrationService.getIntegration(id);

    res.json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    logger.error('Failed to get integration', { error, integrationId: req.params.id });
    res.status(404).json({
      success: false,
      error: error.message || 'Integration not found',
    });
  }
});

/**
 * @route   GET /api/integrations/:id/repositories
 * @desc    List repositories for a GitHub integration
 * @access  Private
 */
router.get('/:id/repositories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const repositories = await GitHubIntegrationService.listRepositories(id);

    res.json({
      success: true,
      data: repositories,
    });
  } catch (error: any) {
    logger.error('Failed to list repositories', { error, integrationId: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repositories',
    });
  }
});

/**
 * @route   GET /api/integrations/:id/repositories/:owner/:repo/branches
 * @desc    List branches for a repository
 * @access  Private
 */
router.get(
  '/:id/repositories/:owner/:repo/branches',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id, owner, repo } = req.params;

      const branches = await GitHubIntegrationService.listBranches(id, owner, repo);

      res.json({
        success: true,
        data: branches,
      });
    } catch (error: any) {
      logger.error('Failed to list branches', {
        error,
        integrationId: req.params.id,
        owner: req.params.owner,
        repo: req.params.repo,
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch branches',
      });
    }
  }
);

/**
 * @route   GET /api/integrations/:id/repositories/:owner/:repo/commits
 * @desc    List commits for a repository
 * @access  Private
 */
router.get(
  '/:id/repositories/:owner/:repo/commits',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id, owner, repo } = req.params;
      const { branch, limit } = req.query;

      const commits = await GitHubIntegrationService.listCommits(
        id,
        owner,
        repo,
        branch as string,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: commits,
      });
    } catch (error: any) {
      logger.error('Failed to list commits', {
        error,
        integrationId: req.params.id,
        owner: req.params.owner,
        repo: req.params.repo,
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch commits',
      });
    }
  }
);

/**
 * @route   POST /api/integrations/:id/webhooks
 * @desc    Create a webhook for a repository
 * @access  Private
 */
router.post('/:id/webhooks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { projectId, owner, repo, events, callbackUrl, secret } = req.body;
    const userId = (req as any).user.userId;

    if (!projectId || !owner || !repo || !events || !callbackUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, owner, repo, events, callbackUrl',
      });
    }

    const webhook = await GitHubIntegrationService.createWebhook(
      id,
      projectId,
      owner,
      repo,
      events,
      callbackUrl,
      secret || `webhook_${Date.now()}`
    );

    await AuditService.log({
      userId,
      action: AuditAction.INTEGRATION_UPDATE,
      resource: 'Webhook',
      resourceId: webhook.id,
      metadata: { integrationId: id, owner, repo, events },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    logger.error('Failed to create webhook', { error, integrationId: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create webhook',
    });
  }
});

/**
 * @route   POST /api/integrations/:id/test
 * @desc    Test integration connection
 * @access  Private
 */
router.post('/:id/test', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const isConnected = await GitHubIntegrationService.testConnection(id);

    res.json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected
          ? 'Integration is working correctly'
          : 'Integration failed to connect',
      },
    });
  } catch (error: any) {
    logger.error('Failed to test integration', { error, integrationId: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test integration',
    });
  }
});

/**
 * @route   DELETE /api/integrations/:id
 * @desc    Delete an integration
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    await GitHubIntegrationService.deleteIntegration(id);

    await AuditService.log({
      userId,
      action: AuditAction.INTEGRATION_DELETE,
      resource: 'Integration',
      resourceId: id,
      metadata: {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete integration', { error, integrationId: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete integration',
    });
  }
});

/**
 * @route   POST /api/integrations/webhooks/github
 * @desc    GitHub webhook endpoint
 * @access  Public (verified by signature)
 */
router.post('/webhooks/github', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    if (!signature || !event) {
      return res.status(400).json({
        success: false,
        error: 'Missing required headers',
      });
    }

    logger.info('GitHub webhook received', {
      event,
      deliveryId,
      repository: req.body.repository?.full_name,
    });

    // Find matching webhook
    const webhookId = await WebhookProcessor.findWebhookByRepository(
      req.body.repository?.full_name,
      event
    );

    if (!webhookId) {
      logger.warn('No matching webhook found for repository', {
        repository: req.body.repository?.full_name,
        event,
      });
      return res.status(404).json({
        success: false,
        error: 'No matching webhook found',
      });
    }

    // Get webhook secret for verification
    const secret = await WebhookProcessor.getWebhookSecret(webhookId);
    if (!secret) {
      logger.error('Webhook secret not found', { webhookId });
      return res.status(500).json({
        success: false,
        error: 'Webhook configuration error',
      });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const isValid = WebhookProcessor.verifyGitHubSignature(payload, signature, secret);

    if (!isValid) {
      logger.warn('Invalid webhook signature', { webhookId, deliveryId });
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Process webhook based on event type
    if (event === 'push') {
      await WebhookProcessor.processGitHubPush(webhookId, req.body);
    } else if (event === 'pull_request') {
      await WebhookProcessor.processGitHubPullRequest(webhookId, req.body);
    } else {
      logger.info('Webhook event not processed', { event, webhookId });
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    logger.error('Failed to process GitHub webhook', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook',
    });
  }
});

export default router;
