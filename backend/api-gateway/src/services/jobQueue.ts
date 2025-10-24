import Bull, { Queue, Job, JobOptions } from 'bull';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Job Queue Service using Bull for background job processing
 *
 * Features:
 * - Multiple job queues for different tasks
 * - Automatic retry with exponential backoff
 * - Job progress tracking
 * - Failed job handling
 * - Scheduled/delayed jobs
 * - Rate limiting
 */

// Queue names
export enum QueueName {
  EMAIL = 'email',
  REPORT = 'report',
  PIPELINE = 'pipeline',
  TEST = 'test',
  DEPLOYMENT = 'deployment',
  NOTIFICATION = 'notification',
  CLEANUP = 'cleanup',
  ANALYTICS = 'analytics',
}

// Job types for each queue
export enum EmailJobType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  PIPELINE_COMPLETE = 'pipeline-complete',
  TEST_RESULTS = 'test-results',
  DEPLOYMENT_NOTIFICATION = 'deployment-notification',
  ALERT = 'alert',
}

export enum ReportJobType {
  PIPELINE_REPORT = 'pipeline-report',
  TEST_COVERAGE = 'test-coverage',
  SECURITY_SCAN = 'security-scan',
  ANALYTICS = 'analytics',
  AUDIT_LOG = 'audit-log',
}

export enum CleanupJobType {
  EXPIRED_TOKENS = 'expired-tokens',
  OLD_LOGS = 'old-logs',
  TEMP_FILES = 'temp-files',
  OLD_ARTIFACTS = 'old-artifacts',
}

// Default job options
const DEFAULT_JOB_OPTIONS: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 seconds
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 500,     // Keep last 500 failed jobs
};

// Job priority levels
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

/**
 * Job Queue Manager
 */
class JobQueueManager {
  private queues: Map<QueueName, Queue> = new Map();
  private redisConfig: any;

  constructor() {
    // Extract Redis config from redis client
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    };

    this.initializeQueues();
    this.setupEventHandlers();
  }

  /**
   * Initialize all queues
   */
  private initializeQueues(): void {
    Object.values(QueueName).forEach((queueName) => {
      const queue = new Bull(queueName, {
        redis: this.redisConfig,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });

      this.queues.set(queueName, queue);
      logger.info('Queue initialized', { queue: queueName });
    });
  }

  /**
   * Setup global event handlers for all queues
   */
  private setupEventHandlers(): void {
    this.queues.forEach((queue, queueName) => {
      queue.on('error', (error) => {
        logger.error('Queue error', { queue: queueName, error: error.message });
      });

      queue.on('failed', (job, error) => {
        logger.error('Job failed', {
          queue: queueName,
          jobId: job.id,
          jobType: job.name,
          attempts: job.attemptsMade,
          error: error.message,
          data: job.data,
        });
      });

      queue.on('completed', (job, result) => {
        logger.info('Job completed', {
          queue: queueName,
          jobId: job.id,
          jobType: job.name,
          duration: Date.now() - job.timestamp,
          result,
        });
      });

      queue.on('stalled', (job) => {
        logger.warn('Job stalled', {
          queue: queueName,
          jobId: job.id,
          jobType: job.name,
        });
      });
    });
  }

  /**
   * Get a specific queue
   */
  getQueue(queueName: QueueName): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue;
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobType, data, {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    });

    logger.info('Job added to queue', {
      queue: queueName,
      jobId: job.id,
      jobType,
    });

    return job;
  }

  /**
   * Add a delayed job (run after specified delay)
   */
  async addDelayedJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    delayMs: number,
    options?: JobOptions
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobType, data, {
      ...options,
      delay: delayMs,
    });
  }

  /**
   * Add a scheduled job (run at specific time)
   */
  async addScheduledJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    runAt: Date,
    options?: JobOptions
  ): Promise<Job<T>> {
    const delay = runAt.getTime() - Date.now();
    return this.addDelayedJob(queueName, jobType, data, delay, options);
  }

  /**
   * Add a repeating job (cron-like)
   */
  async addRepeatingJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    cronExpression: string,
    options?: JobOptions
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobType, data, {
      ...options,
      repeat: {
        cron: cronExpression,
      },
    });
  }

  /**
   * Process jobs in a queue
   */
  async processJobs<T = any>(
    queueName: QueueName,
    jobType: string,
    processor: (job: Job<T>) => Promise<any>,
    concurrency: number = 1
  ): Promise<void> {
    const queue = this.getQueue(queueName);

    queue.process(jobType, concurrency, async (job) => {
      logger.info('Processing job', {
        queue: queueName,
        jobId: job.id,
        jobType,
        attempt: job.attemptsMade + 1,
      });

      try {
        const result = await processor(job);
        return result;
      } catch (error: any) {
        logger.error('Job processing error', {
          queue: queueName,
          jobId: job.id,
          jobType,
          error: error.message,
        });
        throw error; // Re-throw to trigger retry
      }
    });

    logger.info('Job processor registered', {
      queue: queueName,
      jobType,
      concurrency,
    });
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

    return { waiting, active, completed, failed, delayed, paused };
  }

  /**
   * Get all queue stats
   */
  async getAllQueueStats(): Promise<Record<QueueName, any>> {
    const stats: any = {};

    for (const queueName of Object.values(QueueName)) {
      stats[queueName] = await this.getQueueStats(queueName as QueueName);
    }

    return stats;
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(queueName: QueueName, start = 0, end = 10): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getFailed(start, end);
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      logger.info('Job retried', { queue: queueName, jobId });
    }
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      logger.info('Job removed', { queue: queueName, jobId });
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info('Queue paused', { queue: queueName });
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info('Queue resumed', { queue: queueName });
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 7 * 24 * 60 * 60 * 1000, // 7 days default
    status: 'completed' | 'failed' = 'completed'
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    const jobs = await queue.clean(grace, status);
    logger.info('Queue cleaned', {
      queue: queueName,
      status,
      removedCount: jobs.length,
    });
    return jobs;
  }

  /**
   * Empty a queue (remove all jobs)
   */
  async emptyQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.empty();
    logger.warn('Queue emptied', { queue: queueName });
  }

  /**
   * Close all queues
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((queue) => queue.close());
    await Promise.all(closePromises);
    logger.info('All queues closed');
  }
}

// Export singleton instance
export const jobQueueManager = new JobQueueManager();

// Helper functions for common job types

/**
 * Add an email job
 */
export async function addEmailJob(
  type: EmailJobType,
  data: {
    to: string | string[];
    subject?: string;
    template?: string;
    context?: any;
  },
  priority: JobPriority = JobPriority.NORMAL
): Promise<Job> {
  return jobQueueManager.addJob(QueueName.EMAIL, type, data, { priority });
}

/**
 * Add a report generation job
 */
export async function addReportJob(
  type: ReportJobType,
  data: {
    reportType: string;
    filters?: any;
    userId: string;
  },
  priority: JobPriority = JobPriority.NORMAL
): Promise<Job> {
  return jobQueueManager.addJob(QueueName.REPORT, type, data, { priority });
}

/**
 * Add a cleanup job
 */
export async function addCleanupJob(
  type: CleanupJobType,
  data: any = {},
  priority: JobPriority = JobPriority.LOW
): Promise<Job> {
  return jobQueueManager.addJob(QueueName.CLEANUP, type, data, { priority });
}

/**
 * Schedule daily cleanup jobs
 */
export async function scheduleDailyCleanup(): Promise<void> {
  // Clean expired refresh tokens daily at 2 AM
  await jobQueueManager.addRepeatingJob(
    QueueName.CLEANUP,
    CleanupJobType.EXPIRED_TOKENS,
    {},
    '0 2 * * *' // Cron: Every day at 2 AM
  );

  // Clean old logs daily at 3 AM
  await jobQueueManager.addRepeatingJob(
    QueueName.CLEANUP,
    CleanupJobType.OLD_LOGS,
    {},
    '0 3 * * *'
  );

  // Clean old artifacts weekly on Sunday at 4 AM
  await jobQueueManager.addRepeatingJob(
    QueueName.CLEANUP,
    CleanupJobType.OLD_ARTIFACTS,
    {},
    '0 4 * * 0'
  );

  logger.info('Daily cleanup jobs scheduled');
}
