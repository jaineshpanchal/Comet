import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './encryptionService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export class SlackNotificationService {
  /**
   * Create Slack integration
   */
  static async createIntegration(
    userId: string,
    webhookUrl: string,
    channel?: string,
    name?: string
  ): Promise<any> {
    try {
      // Encrypt the webhook URL
      const encryptedConfig = EncryptionService.encrypt(
        JSON.stringify({
          webhookUrl,
          channel,
          username: 'GoLive DevOps',
          iconEmoji: ':rocket:',
        } as SlackConfig)
      );

      // Create integration
      const integration = await prisma.integration.create({
        data: {
          userId,
          name: name || `Slack - ${channel || 'Notifications'}`,
          type: 'SLACK',
          configuration: encryptedConfig,
          status: 'ACTIVE',
          isActive: true,
        },
      });

      logger.info('Slack integration created', {
        integrationId: integration.id,
        userId,
        channel,
      });

      return {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        channel,
        createdAt: integration.createdAt,
      };
    } catch (error: any) {
      logger.error('Failed to create Slack integration', { error, userId });
      throw new Error(`Failed to create Slack integration: ${error.message}`);
    }
  }

  /**
   * Send Slack notification
   */
  static async sendNotification(integrationId: string, message: SlackMessage): Promise<void> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId, type: 'SLACK' },
      });

      if (!integration || !integration.isActive) {
        throw new Error('Slack integration not found or inactive');
      }

      // Decrypt configuration
      const decryptedConfig = EncryptionService.decrypt(integration.configuration);
      const config: SlackConfig = JSON.parse(decryptedConfig);

      // Send notification to Slack
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...message,
          channel: message.channel || config.channel,
          username: message.username || config.username,
          icon_emoji: message.icon_emoji || config.iconEmoji,
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      logger.info('Slack notification sent', {
        integrationId,
        channel: message.channel || config.channel,
      });

      // Update last sync time
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });
    } catch (error: any) {
      logger.error('Failed to send Slack notification', { error, integrationId });

      // Update integration status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Send pipeline status notification
   */
  static async notifyPipelineStatus(
    integrationId: string,
    pipelineName: string,
    projectName: string,
    status: string,
    duration?: number,
    branch?: string,
    commitHash?: string
  ): Promise<void> {
    const statusEmoji = {
      SUCCESS: ':white_check_mark:',
      FAILED: ':x:',
      RUNNING: ':arrows_counterclockwise:',
      PENDING: ':hourglass:',
      CANCELLED: ':stop_sign:',
    };

    const statusColor = {
      SUCCESS: '#36a64f',
      FAILED: '#ff0000',
      RUNNING: '#3AA3E3',
      PENDING: '#ffaa00',
      CANCELLED: '#808080',
    };

    const message: SlackMessage = {
      attachments: [
        {
          color: statusColor[status as keyof typeof statusColor] || '#808080',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${statusEmoji[status as keyof typeof statusEmoji] || ':bell:'} Pipeline ${status}`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Project:*\n${projectName}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Pipeline:*\n${pipelineName}`,
                },
              ],
            },
            ...(branch || commitHash
              ? [
                  {
                    type: 'section',
                    fields: [
                      ...(branch
                        ? [
                            {
                              type: 'mrkdwn',
                              text: `*Branch:*\n${branch}`,
                            },
                          ]
                        : []),
                      ...(commitHash
                        ? [
                            {
                              type: 'mrkdwn',
                              text: `*Commit:*\n\`${commitHash.substring(0, 7)}\``,
                            },
                          ]
                        : []),
                    ],
                  },
                ]
              : []),
            ...(duration
              ? [
                  {
                    type: 'section',
                    fields: [
                      {
                        type: 'mrkdwn',
                        text: `*Duration:*\n${this.formatDuration(duration)}`,
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
      ],
    };

    await this.sendNotification(integrationId, message);
  }

  /**
   * Send deployment notification
   */
  static async notifyDeployment(
    integrationId: string,
    projectName: string,
    version: string,
    environment: string,
    status: string,
    deployedBy?: string
  ): Promise<void> {
    const statusEmoji = {
      DEPLOYED: ':rocket:',
      FAILED: ':x:',
      IN_PROGRESS: ':hourglass_flowing_sand:',
      ROLLED_BACK: ':rewind:',
    };

    const statusColor = {
      DEPLOYED: '#36a64f',
      FAILED: '#ff0000',
      IN_PROGRESS: '#ffaa00',
      ROLLED_BACK: '#ff9900',
    };

    const message: SlackMessage = {
      attachments: [
        {
          color: statusColor[status as keyof typeof statusColor] || '#808080',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${statusEmoji[status as keyof typeof statusEmoji] || ':bell:'} Deployment ${status}`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Project:*\n${projectName}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Version:*\n${version}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Environment:*\n${environment.toUpperCase()}`,
                },
                ...(deployedBy
                  ? [
                      {
                        type: 'mrkdwn',
                        text: `*Deployed by:*\n${deployedBy}`,
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
      ],
    };

    await this.sendNotification(integrationId, message);
  }

  /**
   * Send test results notification
   */
  static async notifyTestResults(
    integrationId: string,
    projectName: string,
    suiteName: string,
    totalTests: number,
    passedTests: number,
    failedTests: number,
    skippedTests: number
  ): Promise<void> {
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const color = successRate === 100 ? '#36a64f' : successRate >= 80 ? '#ffaa00' : '#ff0000';

    const message: SlackMessage = {
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: ':test_tube: Test Results',
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Project:*\n${projectName}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Test Suite:*\n${suiteName}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Success Rate:*\n${successRate.toFixed(1)}%`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Results:*\n:white_check_mark: ${passedTests} | :x: ${failedTests} | :fast_forward: ${skippedTests}`,
                },
              ],
            },
          ],
        },
      ],
    };

    await this.sendNotification(integrationId, message);
  }

  /**
   * Format duration in seconds to human-readable format
   */
  private static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * List all Slack integrations for notifications
   */
  static async getActiveIntegrations(): Promise<any[]> {
    const integrations = await prisma.integration.findMany({
      where: {
        type: 'SLACK',
        isActive: true,
      },
      include: {
        notifications: true,
      },
    });

    return integrations;
  }

  /**
   * Test Slack integration
   */
  static async testIntegration(integrationId: string): Promise<boolean> {
    try {
      await this.sendNotification(integrationId, {
        text: ':wave: Test notification from GoLive DevOps Platform',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':white_check_mark: *Slack integration is working!*\n\nYour GoLive DevOps platform is successfully connected to this Slack workspace.',
            },
          },
        ],
      });

      return true;
    } catch (error: any) {
      logger.error('Slack integration test failed', { error, integrationId });
      return false;
    }
  }
}
