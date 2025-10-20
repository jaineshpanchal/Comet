import { PrismaClient, PipelineTrigger } from '@prisma/client';
import { logger } from '../utils/logger';
import { websocketService } from './websocketService';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface GitHubPushEvent {
  ref: string; // refs/heads/main
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

interface GitHubPullRequestEvent {
  action: string; // opened, closed, synchronize, etc.
  number: number;
  pull_request: {
    id: number;
    number: number;
    state: string;
    title: string;
    html_url: string;
    head: {
      ref: string; // branch name
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
}

export class WebhookProcessor {
  /**
   * Verify GitHub webhook signature
   */
  static verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch (error) {
      logger.error('Signature verification failed', { error });
      return false;
    }
  }

  /**
   * Process GitHub push event
   */
  static async processGitHubPush(webhookId: string, payload: GitHubPushEvent): Promise<void> {
    try {
      logger.info('Processing GitHub push event', {
        webhookId,
        repository: payload.repository.full_name,
        ref: payload.ref,
        commits: payload.commits.length,
      });

      // Extract branch name from ref (refs/heads/main -> main)
      const branch = payload.ref.replace('refs/heads/', '');

      // Find webhook and associated project
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook || !webhook.projectId) {
        logger.warn('Webhook not found or not associated with a project', { webhookId });
        return;
      }

      // Find pipelines for this project that should be triggered on push
      const pipelines = await prisma.pipeline.findMany({
        where: {
          projectId: webhook.projectId,
          isActive: true,
          OR: [
            { trigger: PipelineTrigger.GIT_PUSH },
            { trigger: PipelineTrigger.WEBHOOK },
          ],
        },
        include: {
          project: true,
        },
      });

      if (pipelines.length === 0) {
        logger.info('No pipelines configured for push events', {
          projectId: webhook.projectId,
        });
        return;
      }

      // Trigger each matching pipeline
      for (const pipeline of pipelines) {
        // Check if pipeline's branch matches (if project has default branch set)
        if (pipeline.project.branch && pipeline.project.branch !== branch) {
          logger.debug('Skipping pipeline - branch mismatch', {
            pipelineId: pipeline.id,
            expectedBranch: pipeline.project.branch,
            actualBranch: branch,
          });
          continue;
        }

        await this.triggerPipeline(pipeline.id, {
          trigger: 'webhook',
          branch,
          commitHash: payload.after,
          commitMessage: payload.commits[0]?.message || 'Unknown commit',
          author: payload.pusher.name,
          authorEmail: payload.pusher.email,
          repositoryUrl: payload.repository.html_url,
        });

        logger.info('Pipeline triggered from push event', {
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          branch,
          commit: payload.after.substring(0, 7),
        });
      }

      // Record webhook delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: 'push',
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
    } catch (error: any) {
      logger.error('Failed to process GitHub push event', { error, webhookId });

      // Record failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: 'push',
          payload: JSON.stringify(payload),
          status: 'FAILED',
          response: error.message,
          attempt: 1,
        },
      });

      throw error;
    }
  }

  /**
   * Process GitHub pull request event
   */
  static async processGitHubPullRequest(
    webhookId: string,
    payload: GitHubPullRequestEvent
  ): Promise<void> {
    try {
      logger.info('Processing GitHub pull request event', {
        webhookId,
        repository: payload.repository.full_name,
        action: payload.action,
        prNumber: payload.number,
      });

      // Only trigger on opened and synchronize (new commits) actions
      if (!['opened', 'synchronize'].includes(payload.action)) {
        logger.debug('Skipping PR event - action not relevant', { action: payload.action });
        return;
      }

      // Find webhook and associated project
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook || !webhook.projectId) {
        logger.warn('Webhook not found or not associated with a project', { webhookId });
        return;
      }

      // Find pipelines for this project that should be triggered on PR
      const pipelines = await prisma.pipeline.findMany({
        where: {
          projectId: webhook.projectId,
          isActive: true,
          OR: [
            { trigger: PipelineTrigger.GIT_PR },
            { trigger: PipelineTrigger.WEBHOOK },
          ],
        },
      });

      if (pipelines.length === 0) {
        logger.info('No pipelines configured for PR events', {
          projectId: webhook.projectId,
        });
        return;
      }

      // Trigger each matching pipeline
      for (const pipeline of pipelines) {
        await this.triggerPipeline(pipeline.id, {
          trigger: 'pull_request',
          branch: payload.pull_request.head.ref,
          commitHash: payload.pull_request.head.sha,
          commitMessage: payload.pull_request.title,
          prNumber: payload.number,
          prUrl: payload.pull_request.html_url,
          baseBranch: payload.pull_request.base.ref,
        });

        logger.info('Pipeline triggered from PR event', {
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          prNumber: payload.number,
          branch: payload.pull_request.head.ref,
        });
      }

      // Record webhook delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: 'pull_request',
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
    } catch (error: any) {
      logger.error('Failed to process GitHub PR event', { error, webhookId });

      // Record failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: 'pull_request',
          payload: JSON.stringify(payload),
          status: 'FAILED',
          response: error.message,
          attempt: 1,
        },
      });

      throw error;
    }
  }

  /**
   * Trigger a pipeline run
   */
  private static async triggerPipeline(
    pipelineId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // Create pipeline run
      const pipelineRun = await prisma.pipelineRun.create({
        data: {
          pipelineId,
          status: 'PENDING',
          metadata: JSON.stringify(metadata),
        },
        include: {
          pipeline: {
            include: {
              project: true,
            },
          },
        },
      });

      // Update pipeline status and last run time
      await prisma.pipeline.update({
        where: { id: pipelineId },
        data: {
          status: 'PENDING',
          lastRunAt: new Date(),
        },
      });

      // Broadcast pipeline run event via WebSocket
      websocketService.broadcastPipelineEvent({
        type: 'pipeline_run_created',
        pipelineId,
        pipelineRunId: pipelineRun.id,
        projectId: pipelineRun.pipeline.projectId,
        projectName: pipelineRun.pipeline.project.name,
        pipelineName: pipelineRun.pipeline.name,
        status: 'PENDING',
        trigger: metadata.trigger || 'webhook',
        metadata,
      });

      logger.info('Pipeline run created', {
        pipelineRunId: pipelineRun.id,
        pipelineId,
        trigger: metadata.trigger,
      });

      // Queue pipeline execution job
      const queueService = require('./queueService').default;
      const stages = JSON.parse(pipelineRun.pipeline.stages || '[]');

      try {
        await queueService.addPipelineExecutionJob({
          pipelineId,
          pipelineRunId: pipelineRun.id,
          projectId: pipelineRun.pipeline.projectId,
          repositoryUrl: metadata.repositoryUrl || pipelineRun.pipeline.project.repositoryUrl,
          branch: metadata.branch || pipelineRun.pipeline.project.branch || 'main',
          stages,
          triggeredBy: metadata.author || 'webhook',
        });

        logger.info('Pipeline execution job queued successfully', {
          pipelineRunId: pipelineRun.id,
        });
      } catch (error: any) {
        logger.error('Failed to queue pipeline execution', {
          pipelineRunId: pipelineRun.id,
          error: error.message,
        });
      }
    } catch (error: any) {
      logger.error('Failed to trigger pipeline', { error, pipelineId });
      throw error;
    }
  }

  /**
   * Find webhook by repository URL and event type
   */
  static async findWebhookByRepository(
    repositoryFullName: string,
    event: string
  ): Promise<string | null> {
    try {
      // Find webhooks that match the repository name in their configuration
      const webhooks = await prisma.webhook.findMany({
        where: {
          isActive: true,
        },
      });

      for (const webhook of webhooks) {
        const events = JSON.parse(webhook.events);
        if (
          webhook.name.includes(repositoryFullName) &&
          (events.includes(event) || events.includes('*'))
        ) {
          return webhook.id;
        }
      }

      logger.warn('No matching webhook found', { repositoryFullName, event });
      return null;
    } catch (error: any) {
      logger.error('Failed to find webhook', { error, repositoryFullName, event });
      return null;
    }
  }

  /**
   * Get webhook secret for signature verification
   */
  static async getWebhookSecret(webhookId: string): Promise<string | null> {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
        select: { secret: true },
      });

      if (!webhook || !webhook.secret) {
        return null;
      }

      // Decrypt the secret (assuming it's stored encrypted)
      const EncryptionService = require('./encryptionService').EncryptionService;
      return EncryptionService.decrypt(webhook.secret);
    } catch (error: any) {
      logger.error('Failed to get webhook secret', { error, webhookId });
      return null;
    }
  }
}
