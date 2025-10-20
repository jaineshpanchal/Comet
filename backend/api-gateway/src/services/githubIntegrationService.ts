import { Octokit } from '@octokit/rest';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './encryptionService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface GitHubConfig {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
  language: string | null;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

interface Branch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
    url: string;
  };
}

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export class GitHubIntegrationService {
  /**
   * Create a new GitHub integration
   */
  static async createIntegration(userId: string, accessToken: string, integrationName?: string): Promise<any> {
    try {
      // Verify token is valid by fetching user info
      const octokit = new Octokit({ auth: accessToken });
      const { data: githubUser } = await octokit.users.getAuthenticated();

      // Encrypt the access token
      const encryptedConfig = EncryptionService.encrypt(
        JSON.stringify({
          accessToken,
          scope: 'repo,admin:repo_hook',
        } as GitHubConfig)
      );

      // Create integration in database
      const integration = await prisma.integration.create({
        data: {
          userId,
          name: integrationName || `GitHub - ${githubUser.login}`,
          type: 'GITHUB',
          configuration: encryptedConfig,
          status: 'ACTIVE',
          isActive: true,
          lastSyncAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });

      logger.info('GitHub integration created', {
        integrationId: integration.id,
        userId,
        githubUser: githubUser.login,
      });

      return {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        githubUser: githubUser.login,
        createdAt: integration.createdAt,
      };
    } catch (error: any) {
      logger.error('Failed to create GitHub integration', { error, userId });
      throw new Error(`Failed to create GitHub integration: ${error.message}`);
    }
  }

  /**
   * Get Octokit instance for an integration
   */
  static async getOctokit(integrationId: string): Promise<Octokit> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.type !== 'GITHUB') {
      throw new Error('GitHub integration not found');
    }

    if (!integration.isActive) {
      throw new Error('GitHub integration is not active');
    }

    try {
      const decryptedConfig = EncryptionService.decrypt(integration.configuration);
      const config: GitHubConfig = JSON.parse(decryptedConfig);

      return new Octokit({ auth: config.accessToken });
    } catch (error: any) {
      logger.error('Failed to decrypt GitHub configuration', { error, integrationId });
      throw new Error('Failed to access GitHub integration');
    }
  }

  /**
   * List repositories for a GitHub integration
   */
  static async listRepositories(integrationId: string): Promise<Repository[]> {
    try {
      const octokit = await this.getOctokit(integrationId);

      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        language: repo.language,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
        },
      }));
    } catch (error: any) {
      logger.error('Failed to list GitHub repositories', { error, integrationId });
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  /**
   * List branches for a repository
   */
  static async listBranches(integrationId: string, owner: string, repo: string): Promise<Branch[]> {
    try {
      const octokit = await this.getOctokit(integrationId);

      const { data: branches } = await octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });

      return branches.map(branch => ({
        name: branch.name,
        protected: branch.protected,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url,
        },
      }));
    } catch (error: any) {
      logger.error('Failed to list GitHub branches', { error, integrationId, owner, repo });
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  /**
   * List commits for a repository
   */
  static async listCommits(
    integrationId: string,
    owner: string,
    repo: string,
    branch?: string,
    limit: number = 20
  ): Promise<Commit[]> {
    try {
      const octokit = await this.getOctokit(integrationId);

      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: limit,
      });

      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || 'unknown@unknown.com',
          date: commit.commit.author?.date || new Date().toISOString(),
        },
        url: commit.html_url,
      }));
    } catch (error: any) {
      logger.error('Failed to list GitHub commits', { error, integrationId, owner, repo, branch });
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  /**
   * Create a webhook for a repository
   */
  static async createWebhook(
    integrationId: string,
    projectId: string,
    owner: string,
    repo: string,
    events: string[],
    callbackUrl: string,
    secret: string
  ): Promise<any> {
    try {
      const octokit = await this.getOctokit(integrationId);

      // Create webhook on GitHub
      const { data: hook } = await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: callbackUrl,
          content_type: 'json',
          secret: secret,
          insecure_ssl: '0',
        },
        events: events,
        active: true,
      });

      // Store webhook in database
      const webhook = await prisma.webhook.create({
        data: {
          integrationId,
          projectId,
          name: `${owner}/${repo} - ${events.join(', ')}`,
          url: callbackUrl,
          secret: EncryptionService.encrypt(secret),
          events: JSON.stringify(events),
          isActive: true,
        },
      });

      logger.info('GitHub webhook created', {
        webhookId: webhook.id,
        integrationId,
        projectId,
        owner,
        repo,
        events,
        githubHookId: hook.id,
      });

      return {
        id: webhook.id,
        githubHookId: hook.id,
        name: webhook.name,
        events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      };
    } catch (error: any) {
      logger.error('Failed to create GitHub webhook', { error, integrationId, owner, repo });
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  /**
   * Handle webhook delivery
   */
  static async handleWebhookDelivery(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<void> {
    try {
      // Store delivery record
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: JSON.stringify(payload),
          status: 'SUCCESS',
          statusCode: 200,
          attempt: 1,
        },
      });

      // Update webhook last triggered time
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { lastTriggeredAt: new Date() },
      });

      logger.info('Webhook delivery recorded', { webhookId, event });
    } catch (error: any) {
      logger.error('Failed to record webhook delivery', { error, webhookId, event });

      // Record failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: JSON.stringify(payload),
          status: 'FAILED',
          response: error.message,
          attempt: 1,
        },
      });
    }
  }

  /**
   * Get integration details
   */
  static async getIntegration(integrationId: string): Promise<any> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        webhooks: true,
        notifications: true,
      },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    return {
      id: integration.id,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      isActive: integration.isActive,
      lastSyncAt: integration.lastSyncAt,
      lastSyncStatus: integration.lastSyncStatus,
      webhooks: integration.webhooks.map(webhook => ({
        id: webhook.id,
        name: webhook.name,
        events: JSON.parse(webhook.events),
        isActive: webhook.isActive,
        lastTriggeredAt: webhook.lastTriggeredAt,
      })),
      notifications: integration.notifications,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  /**
   * List all integrations for a user
   */
  static async listIntegrations(userId: string): Promise<any[]> {
    const integrations = await prisma.integration.findMany({
      where: {
        OR: [
          { userId },
          { userId: null, teamId: null }, // Global integrations
        ],
      },
      include: {
        webhooks: {
          select: {
            id: true,
            name: true,
            isActive: true,
            lastTriggeredAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return integrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      isActive: integration.isActive,
      lastSyncAt: integration.lastSyncAt,
      lastSyncStatus: integration.lastSyncStatus,
      webhookCount: integration.webhooks.length,
      activeWebhookCount: integration.webhooks.filter(w => w.isActive).length,
      createdAt: integration.createdAt,
    }));
  }

  /**
   * Delete an integration
   */
  static async deleteIntegration(integrationId: string): Promise<void> {
    try {
      await prisma.integration.delete({
        where: { id: integrationId },
      });

      logger.info('GitHub integration deleted', { integrationId });
    } catch (error: any) {
      logger.error('Failed to delete GitHub integration', { error, integrationId });
      throw new Error(`Failed to delete integration: ${error.message}`);
    }
  }

  /**
   * Test integration connection
   */
  static async testConnection(integrationId: string): Promise<boolean> {
    try {
      const octokit = await this.getOctokit(integrationId);
      await octokit.users.getAuthenticated();

      // Update integration status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'SUCCESS',
          status: 'ACTIVE',
          errorMessage: null,
        },
      });

      return true;
    } catch (error: any) {
      logger.error('GitHub integration test failed', { error, integrationId });

      // Update integration status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'FAILED',
          status: 'ERROR',
          errorMessage: error.message,
        },
      });

      return false;
    }
  }
}
