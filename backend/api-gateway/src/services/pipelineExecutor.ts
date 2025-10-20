import { PrismaClient, PipelineRunStatus, StageRunStatus, StageType } from '@prisma/client';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { websocketService } from './websocketService';
import { dockerExecutor, type DockerExecutionOptions } from './dockerExecutor';

const prisma = new PrismaClient();

export interface StageConfig {
  name: string;
  type: StageType;
  commands?: string[];
  script?: string;
  environment?: Record<string, string>;
  timeout?: number;
  continueOnError?: boolean;
  dockerImage?: string; // Optional custom Docker image
  workDir?: string; // Working directory inside container
}

export interface PipelineExecutionContext {
  pipelineId: string;
  pipelineRunId: string;
  projectId: string;
  repositoryUrl: string;
  branch: string;
  stages: StageConfig[];
  triggeredBy: string;
}

export class PipelineExecutor extends EventEmitter {
  private static instance: PipelineExecutor;
  private executionQueue: Map<string, PipelineExecutionContext>;
  private activeExecutions: Set<string>;

  private constructor() {
    super();
    this.executionQueue = new Map();
    this.activeExecutions = new Set();
  }

  public static getInstance(): PipelineExecutor {
    if (!PipelineExecutor.instance) {
      PipelineExecutor.instance = new PipelineExecutor();
    }
    return PipelineExecutor.instance;
  }

  /**
   * Execute a pipeline run
   */
  public async executePipeline(context: PipelineExecutionContext): Promise<void> {
    const { pipelineRunId, pipelineId, stages } = context;

    try {
      logger.info('Starting pipeline execution', {
        pipelineId,
        pipelineRunId,
        stageCount: stages.length
      });

      this.activeExecutions.add(pipelineRunId);

      // Update pipeline run status to RUNNING
      const updatedRun = await prisma.pipelineRun.update({
        where: { id: pipelineRunId },
        data: { status: PipelineRunStatus.RUNNING },
        include: {
          pipeline: true
        }
      });

      // Broadcast pipeline run started via WebSocket
      websocketService.broadcastPipelineRunUpdate(pipelineId, {
        type: 'started',
        pipelineRun: updatedRun,
        timestamp: new Date().toISOString()
      });

      // Execute stages sequentially
      let allStagesSucceeded = true;
      const stageResults: any[] = [];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        logger.info(`Executing stage ${i + 1}/${stages.length}`, {
          pipelineRunId,
          stageName: stage.name,
          stageType: stage.type
        });

        const stageResult = await this.executeStage(pipelineRunId, stage, i);
        stageResults.push(stageResult);

        // Check if stage failed
        if (stageResult.status === StageRunStatus.FAILED) {
          if (!stage.continueOnError) {
            allStagesSucceeded = false;
            logger.warn('Stage failed, stopping pipeline execution', {
              pipelineRunId,
              stageName: stage.name
            });
            break;
          } else {
            logger.warn('Stage failed but continuing due to continueOnError', {
              pipelineRunId,
              stageName: stage.name
            });
          }
        }

        // Emit progress event
        this.emit('stage:completed', {
          pipelineRunId,
          stageIndex: i,
          totalStages: stages.length,
          stageName: stage.name,
          status: stageResult.status
        });

        // Broadcast stage progress via WebSocket
        websocketService.broadcastPipelineRunUpdate(pipelineId, {
          type: 'stage_completed',
          pipelineRunId,
          stageIndex: i,
          totalStages: stages.length,
          stageName: stage.name,
          stageStatus: stageResult.status,
          progress: Math.round(((i + 1) / stages.length) * 100),
          timestamp: new Date().toISOString()
        });
      }

      // Determine final status
      const finalStatus = allStagesSucceeded ? PipelineRunStatus.SUCCESS : PipelineRunStatus.FAILED;
      const finishedAt = new Date();

      // Calculate duration
      const pipelineRun = await prisma.pipelineRun.findUnique({
        where: { id: pipelineRunId }
      });

      const duration = pipelineRun
        ? Math.floor((finishedAt.getTime() - pipelineRun.startedAt.getTime()) / 1000)
        : 0;

      // Update pipeline run with final status
      const completedRun = await prisma.pipelineRun.update({
        where: { id: pipelineRunId },
        data: {
          status: finalStatus,
          finishedAt,
          duration
        },
        include: {
          pipeline: true,
          stages: true
        }
      });

      // Update pipeline status
      await prisma.pipeline.update({
        where: { id: pipelineId },
        data: {
          status: finalStatus,
          lastRunAt: finishedAt
        }
      });

      logger.info('Pipeline execution completed', {
        pipelineId,
        pipelineRunId,
        status: finalStatus,
        duration
      });

      // Emit completion event
      this.emit('pipeline:completed', {
        pipelineId,
        pipelineRunId,
        status: finalStatus,
        duration
      });

      // Broadcast pipeline completion via WebSocket
      websocketService.broadcastPipelineRunUpdate(pipelineId, {
        type: 'completed',
        pipelineRun: completedRun,
        status: finalStatus,
        duration,
        timestamp: new Date().toISOString()
      });

      this.activeExecutions.delete(pipelineRunId);

    } catch (error: any) {
      logger.error('Pipeline execution error', {
        pipelineRunId,
        error: error.message,
        stack: error.stack
      });

      // Update to failed status
      const failedRun = await prisma.pipelineRun.update({
        where: { id: pipelineRunId },
        data: {
          status: PipelineRunStatus.FAILED,
          finishedAt: new Date(),
          logs: `Pipeline execution error: ${error.message}`
        },
        include: {
          pipeline: true,
          stages: true
        }
      });

      await prisma.pipeline.update({
        where: { id: pipelineId },
        data: { status: 'FAILED' }
      });

      // Broadcast pipeline failure via WebSocket
      websocketService.broadcastPipelineRunUpdate(pipelineId, {
        type: 'failed',
        pipelineRun: failedRun,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      this.activeExecutions.delete(pipelineRunId);
      throw error;
    }
  }

  /**
   * Get Docker image for a stage type
   */
  private getDockerImageForStage(stage: StageConfig): string {
    // Use custom image if specified
    if (stage.dockerImage) {
      return stage.dockerImage;
    }

    // Default images for each stage type
    const imageMap: Record<StageType, string> = {
      [StageType.BUILD]: 'node:18-alpine',
      [StageType.TEST]: 'node:18-alpine',
      [StageType.SECURITY_SCAN]: 'alpine:latest',
      [StageType.CODE_ANALYSIS]: 'alpine:latest',
      [StageType.DEPLOY]: 'alpine:latest',
      [StageType.NOTIFICATION]: 'alpine:latest',
      [StageType.APPROVAL]: 'alpine:latest',
      [StageType.ROLLBACK]: 'alpine:latest',
    };

    return imageMap[stage.type] || 'alpine:latest';
  }

  /**
   * Execute a single pipeline stage using Docker
   */
  private async executeStage(
    pipelineRunId: string,
    stage: StageConfig,
    stageIndex: number
  ): Promise<any> {
    const startedAt = new Date();

    // Create stage run record
    const stageRun = await prisma.stageRun.create({
      data: {
        pipelineRunId,
        stageName: stage.name,
        stageType: stage.type,
        status: StageRunStatus.RUNNING,
        startedAt,
        metadata: JSON.stringify({
          commands: stage.commands,
          environment: stage.environment
        })
      }
    });

    try {
      // Execute stage in Docker container
      const dockerImage = this.getDockerImageForStage(stage);
      const commands = stage.commands || ['echo "No commands specified"'];

      logger.info('Executing stage in Docker', {
        pipelineRunId,
        stageName: stage.name,
        dockerImage,
        commands
      });

      // Execute in Docker container
      const result = await dockerExecutor.executeInContainer(stage.name, {
        image: dockerImage,
        commands,
        environment: stage.environment,
        workDir: stage.workDir || '/workspace',
        timeout: stage.timeout || 300, // Default 5 minutes
      });

      let stageOutput = '';
      let artifacts: string[] = [];

      // Format output based on execution result
      if (result.success) {
        stageOutput = `=== ${stage.name} (${stage.type}) ===\n`;
        stageOutput += `Docker Image: ${dockerImage}\n`;
        stageOutput += `Commands: ${commands.join(' && ')}\n`;
        stageOutput += `Duration: ${result.duration}s\n\n`;
        stageOutput += `--- Output ---\n${result.stdout}\n`;

        if (result.stderr) {
          stageOutput += `\n--- Warnings/Errors ---\n${result.stderr}\n`;
        }

        // Set artifacts based on stage type
        switch (stage.type) {
          case StageType.BUILD:
            artifacts = ['build/output.zip'];
            break;
          case StageType.TEST:
            artifacts = ['test-results.xml', 'coverage-report.html'];
            break;
          case StageType.SECURITY_SCAN:
            artifacts = ['security-report.json'];
            break;
          case StageType.CODE_ANALYSIS:
            artifacts = ['code-quality-report.json'];
            break;
        }
      } else {
        // Execution failed
        stageOutput = `=== ${stage.name} FAILED ===\n`;
        stageOutput += `Docker Image: ${dockerImage}\n`;
        stageOutput += `Error: ${result.error || 'Command failed'}\n`;
        stageOutput += `Exit Code: ${result.exitCode}\n\n`;
        stageOutput += `--- Output ---\n${result.stdout}\n`;
        stageOutput += `\n--- Error Output ---\n${result.stderr}\n`;

        throw new Error(`Stage ${stage.name} failed with exit code ${result.exitCode}`);
      }

      const finishedAt = new Date();
      const duration = Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000);

      // Update stage run with success
      await prisma.stageRun.update({
        where: { id: stageRun.id },
        data: {
          status: StageRunStatus.SUCCESS,
          finishedAt,
          duration,
          logs: stageOutput,
          artifacts: JSON.stringify(artifacts)
        }
      });

      logger.info('Stage execution completed', {
        pipelineRunId,
        stageName: stage.name,
        status: 'SUCCESS',
        duration
      });

      return {
        id: stageRun.id,
        status: StageRunStatus.SUCCESS,
        duration,
        logs: stageOutput,
        artifacts
      };

    } catch (error: any) {
      const finishedAt = new Date();
      const duration = Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000);

      // Update stage run with failure
      await prisma.stageRun.update({
        where: { id: stageRun.id },
        data: {
          status: StageRunStatus.FAILED,
          finishedAt,
          duration,
          logs: `Stage failed: ${error.message}\n${error.stack}`
        }
      });

      logger.error('Stage execution failed', {
        pipelineRunId,
        stageName: stage.name,
        error: error.message
      });

      return {
        id: stageRun.id,
        status: StageRunStatus.FAILED,
        duration,
        logs: error.message
      };
    }
  }

  /**
   * Execute BUILD stage
   */
  private async executeBuildStage(stage: StageConfig): Promise<string> {
    logger.info('Executing BUILD stage', { stageName: stage.name });

    // Simulate build process
    await this.simulateWork(3000); // 3 seconds

    return `
BUILD STAGE: ${stage.name}
====================================
✅ Dependencies installed
✅ Source code compiled
✅ Build artifacts created
✅ Build completed successfully

Build output:
- Compiled 156 files
- Generated bundle: 2.5 MB
- Time taken: 2.8s
`;
  }

  /**
   * Execute TEST stage
   */
  private async executeTestStage(stage: StageConfig): Promise<string> {
    logger.info('Executing TEST stage', { stageName: stage.name });

    await this.simulateWork(4000); // 4 seconds

    return `
TEST STAGE: ${stage.name}
====================================
✅ Unit tests executed
✅ Integration tests executed
✅ All tests passed

Test Results:
- Total: 247 tests
- Passed: 245 tests
- Failed: 0 tests
- Skipped: 2 tests
- Coverage: 87.3%
- Duration: 3.9s
`;
  }

  /**
   * Execute SECURITY_SCAN stage
   */
  private async executeSecurityScanStage(stage: StageConfig): Promise<string> {
    logger.info('Executing SECURITY_SCAN stage', { stageName: stage.name });

    await this.simulateWork(5000); // 5 seconds

    return `
SECURITY SCAN STAGE: ${stage.name}
====================================
✅ Vulnerability scan completed
✅ Dependency audit completed
✅ SAST analysis completed

Security Report:
- Critical: 0 issues
- High: 0 issues
- Medium: 2 issues
- Low: 5 issues
- Info: 12 issues
- Overall Status: PASS
`;
  }

  /**
   * Execute CODE_ANALYSIS stage
   */
  private async executeCodeAnalysisStage(stage: StageConfig): Promise<string> {
    logger.info('Executing CODE_ANALYSIS stage', { stageName: stage.name });

    await this.simulateWork(3500); // 3.5 seconds

    return `
CODE ANALYSIS STAGE: ${stage.name}
====================================
✅ Static analysis completed
✅ Code quality metrics calculated
✅ Technical debt assessed

Quality Metrics:
- Code Smells: 23
- Bugs: 0
- Vulnerabilities: 0
- Duplications: 3.2%
- Maintainability: A
- Reliability: A
- Security: A
`;
  }

  /**
   * Execute DEPLOY stage
   */
  private async executeDeployStage(stage: StageConfig): Promise<string> {
    logger.info('Executing DEPLOY stage', { stageName: stage.name });

    await this.simulateWork(6000); // 6 seconds

    return `
DEPLOY STAGE: ${stage.name}
====================================
✅ Environment prepared
✅ Application deployed
✅ Health checks passed
✅ Deployment completed successfully

Deployment Details:
- Environment: production
- Version: v1.2.3
- Instances: 3
- Load Balancer: healthy
- Status: RUNNING
- URL: https://app.example.com
`;
  }

  /**
   * Execute NOTIFICATION stage
   */
  private async executeNotificationStage(stage: StageConfig): Promise<string> {
    logger.info('Executing NOTIFICATION stage', { stageName: stage.name });

    await this.simulateWork(1000); // 1 second

    return `
NOTIFICATION STAGE: ${stage.name}
====================================
✅ Notifications sent

Channels:
- Slack: #deployments (sent)
- Email: team@example.com (sent)
- Webhook: https://api.example.com/hooks (sent)
`;
  }

  /**
   * Execute APPROVAL stage
   */
  private async executeApprovalStage(stage: StageConfig): Promise<string> {
    logger.info('Executing APPROVAL stage', { stageName: stage.name });

    // Auto-approve for demo purposes
    await this.simulateWork(500);

    return `
APPROVAL STAGE: ${stage.name}
====================================
✅ Auto-approved (demo mode)

In production, this stage would:
- Wait for manual approval
- Send approval requests
- Track approval status
`;
  }

  /**
   * Simulate work with delay
   */
  private simulateWork(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel a pipeline run
   */
  public async cancelPipelineRun(pipelineRunId: string): Promise<void> {
    logger.info('Cancelling pipeline run', { pipelineRunId });

    // Update pipeline run status
    await prisma.pipelineRun.update({
      where: { id: pipelineRunId },
      data: {
        status: PipelineRunStatus.CANCELLED,
        finishedAt: new Date()
      }
    });

    // Update any running stages
    await prisma.stageRun.updateMany({
      where: {
        pipelineRunId,
        status: StageRunStatus.RUNNING
      },
      data: {
        status: StageRunStatus.CANCELLED,
        finishedAt: new Date()
      }
    });

    this.activeExecutions.delete(pipelineRunId);
    this.emit('pipeline:cancelled', { pipelineRunId });
  }

  /**
   * Get active executions count
   */
  public getActiveExecutionsCount(): number {
    return this.activeExecutions.size;
  }

  /**
   * Check if pipeline run is active
   */
  public isExecutionActive(pipelineRunId: string): boolean {
    return this.activeExecutions.has(pipelineRunId);
  }
}

export default PipelineExecutor.getInstance();
