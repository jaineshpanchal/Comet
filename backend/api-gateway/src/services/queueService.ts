import Bull, { Queue, Job, JobOptions } from 'bull';
import { logger } from '../utils/logger';
import PipelineExecutor, { PipelineExecutionContext } from './pipelineExecutor';

/**
 * Queue Service for managing background jobs
 * Uses Bull (Redis-backed queue) for reliable job processing
 */
class QueueService {
  private pipelineQueue: Queue | null = null;
  private readonly redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  };

  /**
   * Initialize the queue service
   */
  async initialize(): Promise<void> {
    try {
      // Create pipeline execution queue
      this.pipelineQueue = new Bull('pipeline-execution', {
        redis: this.redisConfig,
        defaultJobOptions: {
          attempts: 3, // Retry failed jobs up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 second delay
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
        },
      });

      // Setup job processors
      this.setupProcessors();

      // Setup event listeners
      this.setupEventListeners();

      logger.info('Queue service initialized successfully', {
        redis: `${this.redisConfig.host}:${this.redisConfig.port}`,
      });
    } catch (error: any) {
      logger.error('Failed to initialize queue service', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup job processors
   */
  private setupProcessors(): void {
    if (!this.pipelineQueue) return;

    // Process pipeline execution jobs
    this.pipelineQueue.process('execute-pipeline', 5, async (job: Job<PipelineExecutionContext>) => {
      logger.info('Processing pipeline execution job', {
        jobId: job.id,
        pipelineRunId: job.data.pipelineRunId,
        attempt: job.attemptsMade + 1,
      });

      try {
        await PipelineExecutor.executePipeline(job.data);

        logger.info('Pipeline execution job completed', {
          jobId: job.id,
          pipelineRunId: job.data.pipelineRunId,
        });

        return { success: true, pipelineRunId: job.data.pipelineRunId };
      } catch (error: any) {
        logger.error('Pipeline execution job failed', {
          jobId: job.id,
          pipelineRunId: job.data.pipelineRunId,
          error: error.message,
          attempt: job.attemptsMade + 1,
        });

        throw error; // Will trigger retry logic
      }
    });

    logger.info('Job processors setup complete');
  }

  /**
   * Setup event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    if (!this.pipelineQueue) return;

    this.pipelineQueue.on('completed', (job: Job, result: any) => {
      logger.info('Job completed', {
        jobId: job.id,
        queueName: job.queue.name,
        processingTime: Date.now() - job.processedOn!,
      });
    });

    this.pipelineQueue.on('failed', (job: Job, error: Error) => {
      logger.error('Job failed', {
        jobId: job.id,
        queueName: job.queue.name,
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });
    });

    this.pipelineQueue.on('stalled', (job: Job) => {
      logger.warn('Job stalled', {
        jobId: job.id,
        queueName: job.queue.name,
        attemptsMade: job.attemptsMade,
      });
    });

    this.pipelineQueue.on('error', (error: Error) => {
      logger.error('Queue error', {
        queueName: 'pipeline-execution',
        error: error.message,
      });
    });

    logger.info('Queue event listeners setup complete');
  }

  /**
   * Add pipeline execution job to queue
   */
  async addPipelineExecutionJob(
    context: PipelineExecutionContext,
    options?: JobOptions
  ): Promise<Job<PipelineExecutionContext>> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    const job = await this.pipelineQueue.add('execute-pipeline', context, {
      jobId: context.pipelineRunId, // Use pipeline run ID as job ID for idempotency
      priority: options?.priority || 1, // Lower number = higher priority
      ...options,
    });

    logger.info('Pipeline execution job added to queue', {
      jobId: job.id,
      pipelineRunId: context.pipelineRunId,
      priority: job.opts.priority,
    });

    return job;
  }

  /**
   * Get job status by pipeline run ID
   */
  async getJobStatus(pipelineRunId: string): Promise<any> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    const job = await this.pipelineQueue.getJob(pipelineRunId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      jobId: job.id,
      state,
      progress,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      data: job.data,
    };
  }

  /**
   * Cancel a job by pipeline run ID
   */
  async cancelJob(pipelineRunId: string): Promise<boolean> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    const job = await this.pipelineQueue.getJob(pipelineRunId);

    if (!job) {
      logger.warn('Job not found for cancellation', { pipelineRunId });
      return false;
    }

    try {
      await job.remove();

      logger.info('Job cancelled successfully', {
        jobId: job.id,
        pipelineRunId,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to cancel job', {
        jobId: job.id,
        pipelineRunId,
        error: error.message,
      });

      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    const [
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      delayedCount,
      pausedCount,
    ] = await Promise.all([
      this.pipelineQueue.getWaitingCount(),
      this.pipelineQueue.getActiveCount(),
      this.pipelineQueue.getCompletedCount(),
      this.pipelineQueue.getFailedCount(),
      this.pipelineQueue.getDelayedCount(),
      this.pipelineQueue.getPausedCount(),
    ]);

    return {
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      delayed: delayedCount,
      paused: pausedCount,
      total: waitingCount + activeCount + completedCount + failedCount + delayedCount,
    };
  }

  /**
   * Get active jobs
   */
  async getActiveJobs(): Promise<Job[]> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    return await this.pipelineQueue.getActive();
  }

  /**
   * Get waiting jobs
   */
  async getWaitingJobs(): Promise<Job[]> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    return await this.pipelineQueue.getWaiting();
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(start = 0, end = 10): Promise<Job[]> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    return await this.pipelineQueue.getFailed(start, end);
  }

  /**
   * Retry a failed job
   */
  async retryJob(pipelineRunId: string): Promise<boolean> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    const job = await this.pipelineQueue.getJob(pipelineRunId);

    if (!job) {
      logger.warn('Job not found for retry', { pipelineRunId });
      return false;
    }

    try {
      await job.retry();

      logger.info('Job retried successfully', {
        jobId: job.id,
        pipelineRunId,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to retry job', {
        jobId: job.id,
        pipelineRunId,
        error: error.message,
      });

      return false;
    }
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    grace: number = 24 * 60 * 60 * 1000, // 24 hours
    status: 'completed' | 'failed' = 'completed'
  ): Promise<number> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    const removedJobs = await this.pipelineQueue.clean(grace, status);

    logger.info('Queue cleaned', {
      status,
      grace: `${grace}ms`,
      removedCount: removedJobs.length,
    });

    return removedJobs.length;
  }

  /**
   * Pause queue processing
   */
  async pauseQueue(): Promise<void> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    await this.pipelineQueue.pause();
    logger.warn('Queue paused');
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(): Promise<void> {
    if (!this.pipelineQueue) {
      throw new Error('Queue service not initialized');
    }

    await this.pipelineQueue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Close queue connections
   */
  async close(): Promise<void> {
    if (this.pipelineQueue) {
      await this.pipelineQueue.close();
      logger.info('Queue service closed');
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
export default queueService;
