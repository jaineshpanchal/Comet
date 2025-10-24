# Background Jobs Guide

## Table of Contents
- [Overview](#overview)
- [Job Queues](#job-queues)
- [Job Types](#job-types)
- [Adding Jobs](#adding-jobs)
- [Job Processors](#job-processors)
- [Job Monitoring](#job-monitoring)
- [Scheduled Jobs](#scheduled-jobs)
- [Error Handling & Retries](#error-handling--retries)
- [Best Practices](#best-practices)

---

## Overview

The GoLive platform uses **Bull** for background job processing, built on Redis for reliable, distributed job queuing.

**Why Background Jobs?**
- **Async Processing** - Don't block HTTP requests for slow operations
- **Retry Logic** - Automatic retries with exponential backoff
- **Scheduled Tasks** - Cron-like job scheduling
- **Scalability** - Distribute jobs across multiple workers
- **Monitoring** - Track job status, failures, and performance

**Technologies:**
- **Bull** - Redis-based queue for Node.js
- **Redis** - Job storage and pub/sub
- **Nodemailer** - Email sending
- **Prisma** - Database access for reports

---

## Job Queues

The platform uses **8 specialized queues** for different types of work:

| Queue | Purpose | Concurrency | Priority |
|-------|---------|-------------|----------|
| **email** | Send emails | 5 | NORMAL |
| **report** | Generate reports | 2 | NORMAL |
| **pipeline** | Pipeline execution | 10 | HIGH |
| **test** | Test execution | 5 | NORMAL |
| **deployment** | Deployments | 3 | HIGH |
| **notification** | Push notifications | 10 | NORMAL |
| **cleanup** | Data cleanup | 1 | LOW |
| **analytics** | Analytics processing | 2 | LOW |

### Queue Configuration

Each queue has default settings:

```typescript
{
  attempts: 3,                    // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 2000,                 // Start with 2s, double each retry
  },
  removeOnComplete: 100,          // Keep last 100 completed jobs
  removeOnFail: 500,              // Keep last 500 failed jobs
}
```

---

## Job Types

### Email Jobs

Send transactional emails:

| Type | Description | Priority |
|------|-------------|----------|
| `welcome` | Welcome new users | NORMAL |
| `password-reset` | Password reset emails | HIGH |
| `pipeline-complete` | Pipeline completion notifications | NORMAL |
| `test-results` | Test result summaries | NORMAL |
| `deployment-notification` | Deployment alerts | HIGH |
| `alert` | System alerts | CRITICAL |

### Report Jobs

Generate data reports:

| Type | Description | Duration |
|------|-------------|----------|
| `pipeline-report` | Pipeline execution analytics | ~30s |
| `test-coverage` | Test coverage reports | ~20s |
| `security-scan` | Security vulnerability reports | ~15s |
| `analytics` | Platform analytics | ~60s |
| `audit-log` | Audit log exports | ~45s |

### Cleanup Jobs

Scheduled maintenance:

| Type | Description | Schedule |
|------|-------------|----------|
| `expired-tokens` | Remove expired refresh tokens | Daily 2 AM |
| `old-logs` | Archive old system logs | Daily 3 AM |
| `temp-files` | Clean temporary files | Daily 4 AM |
| `old-artifacts` | Remove old build artifacts | Weekly Sun 4 AM |

---

## Adding Jobs

### Email Job Example

```typescript
import { addEmailJob, EmailJobType, JobPriority } from '../services/jobQueue';

// Send welcome email
await addEmailJob(
  EmailJobType.WELCOME,
  {
    to: 'user@example.com',
    context: {
      username: 'John Doe',
      dashboardUrl: 'https://app.golive.dev/dashboard',
    },
  },
  JobPriority.NORMAL
);

// Send pipeline notification
await addEmailJob(
  EmailJobType.PIPELINE_COMPLETE,
  {
    to: ['user@example.com', 'admin@example.com'],
    context: {
      pipelineName: 'Production Deploy',
      projectName: 'My App',
      status: 'SUCCESS',
      duration: '5m 23s',
      triggeredBy: 'John Doe',
      pipelineUrl: 'https://app.golive.dev/pipelines/123',
    },
  },
  JobPriority.HIGH
);
```

### Report Job Example

```typescript
import { addReportJob, ReportJobType } from '../services/jobQueue';

// Generate pipeline report
await addReportJob(
  ReportJobType.PIPELINE_REPORT,
  {
    pipelineId: 'pipeline-id',
    startDate: '2025-10-01',
    endDate: '2025-10-23',
    userId: 'user-id',
  }
);

// Generate test coverage report
await addReportJob(
  ReportJobType.TEST_COVERAGE,
  {
    projectId: 'project-id',
    startDate: '2025-10-01',
    endDate: '2025-10-23',
    userId: 'user-id',
  }
);
```

### Using Job Queue Manager Directly

```typescript
import { jobQueueManager, QueueName } from '../services/jobQueue';

// Add a job
const job = await jobQueueManager.addJob(
  QueueName.EMAIL,
  'custom-email',
  {
    to: 'user@example.com',
    subject: 'Custom Email',
    body: 'Hello World',
  },
  {
    priority: 1,
    attempts: 5,
  }
);

console.log(`Job added: ${job.id}`);
```

### Delayed Jobs

```typescript
// Send email after 1 hour
await jobQueueManager.addDelayedJob(
  QueueName.EMAIL,
  EmailJobType.WELCOME,
  emailData,
  60 * 60 * 1000 // 1 hour in ms
);
```

### Scheduled Jobs

```typescript
// Send email at specific time
const runAt = new Date('2025-10-24T10:00:00Z');
await jobQueueManager.addScheduledJob(
  QueueName.EMAIL,
  EmailJobType.ALERT,
  emailData,
  runAt
);
```

### Repeating Jobs (Cron)

```typescript
// Send weekly report every Monday at 9 AM
await jobQueueManager.addRepeatingJob(
  QueueName.REPORT,
  ReportJobType.ANALYTICS,
  reportData,
  '0 9 * * 1' // Cron expression
);
```

**Cron Expression Examples:**
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 9 * * 1-5` - Weekdays at 9 AM
- `*/15 * * * *` - Every 15 minutes
- `0 0 1 * *` - First day of every month

---

## Job Processors

### Creating a Custom Processor

```typescript
import { Job } from 'bull';
import { jobQueueManager, QueueName } from '../services/jobQueue';

// Define processor function
async function processCustomJob(job: Job): Promise<any> {
  const { data } = job;

  // Update progress
  await job.progress(25);

  // Do work
  const result = await doSomeWork(data);

  await job.progress(75);

  // More work
  const finalResult = await doMoreWork(result);

  await job.progress(100);

  return finalResult;
}

// Register processor
jobQueueManager.processJobs(
  QueueName.ANALYTICS,
  'custom-job',
  processCustomJob,
  5 // Process 5 jobs concurrently
);
```

### Email Processor

The email processor is located at: `backend/api-gateway/src/jobs/emailProcessor.ts`

**Features:**
- HTML email templates
- Dynamic context rendering
- Nodemailer integration
- Concurrent processing (5 jobs at once)

**Initializing:**
```typescript
import { initializeEmailProcessor } from '../jobs/emailProcessor';

// In your application startup
initializeEmailProcessor();
```

### Report Processor

The report processor is located at: `backend/api-gateway/src/jobs/reportProcessor.ts`

**Features:**
- Pipeline execution reports
- Test coverage analysis
- Security scan summaries
- Analytics aggregation
- Audit log exports

**Initializing:**
```typescript
import { initializeReportProcessor } from '../jobs/reportProcessor';

// In your application startup
initializeReportProcessor();
```

---

## Job Monitoring

### API Endpoints

All job monitoring endpoints require **ADMIN** role.

#### Get All Queue Stats

```bash
GET /api/v1/jobs/queues
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": {
      "waiting": 5,
      "active": 2,
      "completed": 1234,
      "failed": 12,
      "delayed": 3,
      "paused": 0
    },
    "report": {
      "waiting": 1,
      "active": 1,
      "completed": 456,
      "failed": 3,
      "delayed": 0,
      "paused": 0
    }
  }
}
```

#### Get Specific Queue Stats

```bash
GET /api/v1/jobs/queues/email/stats
Authorization: Bearer <token>
```

#### Get Failed Jobs

```bash
GET /api/v1/jobs/queues/email/failed?start=0&end=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "name": "welcome",
      "data": {
        "to": "user@example.com"
      },
      "failedReason": "SMTP connection timeout",
      "attemptsMade": 3,
      "timestamp": 1698067200000
    }
  ]
}
```

#### Retry Failed Job

```bash
POST /api/v1/jobs/queues/email/job/12345/retry
Authorization: Bearer <token>
```

#### Pause Queue

```bash
POST /api/v1/jobs/queues/email/pause
Authorization: Bearer <token>
```

#### Resume Queue

```bash
POST /api/v1/jobs/queues/email/resume
Authorization: Bearer <token>
```

#### Clean Old Jobs

```bash
POST /api/v1/jobs/queues/email/clean
Authorization: Bearer <token>
Content-Type: application/json

{
  "grace": 604800000,  // 7 days in ms
  "status": "completed"
}
```

### Programmatic Monitoring

```typescript
import { jobQueueManager, QueueName } from '../services/jobQueue';

// Get queue stats
const stats = await jobQueueManager.getQueueStats(QueueName.EMAIL);
console.log(stats);

// Get all queue stats
const allStats = await jobQueueManager.getAllQueueStats();

// Get failed jobs
const failedJobs = await jobQueueManager.getFailedJobs(
  QueueName.EMAIL,
  0,
  10
);

// Get specific job
const job = await jobQueueManager.getJob(QueueName.EMAIL, 'job-id');
console.log(job?.data);
console.log(job?.progress());
```

---

## Scheduled Jobs

### Setup Scheduled Cleanup

```typescript
import { scheduleDailyCleanup } from '../services/jobQueue';

// In your application startup
await scheduleDailyCleanup();
```

This creates the following recurring jobs:

1. **Expired Tokens Cleanup** - Daily at 2 AM
   - Removes expired refresh tokens
   - Frees up database space

2. **Old Logs Cleanup** - Daily at 3 AM
   - Archives logs older than 30 days
   - Maintains log database performance

3. **Old Artifacts Cleanup** - Weekly on Sunday at 4 AM
   - Removes build artifacts older than 7 days
   - Frees up storage space

### Custom Scheduled Jobs

```typescript
import { jobQueueManager, QueueName } from '../services/jobQueue';

// Daily backup at 1 AM
await jobQueueManager.addRepeatingJob(
  QueueName.ANALYTICS,
  'daily-backup',
  { type: 'full' },
  '0 1 * * *'
);

// Hourly health check
await jobQueueManager.addRepeatingJob(
  QueueName.ANALYTICS,
  'health-check',
  {},
  '0 * * * *'
);
```

---

## Error Handling & Retries

### Automatic Retries

Jobs automatically retry on failure with **exponential backoff**:

```
Attempt 1: Immediate
Attempt 2: 2 seconds delay
Attempt 3: 4 seconds delay
```

### Retry Configuration

```typescript
await jobQueueManager.addJob(
  QueueName.EMAIL,
  'custom-email',
  emailData,
  {
    attempts: 5,              // Retry up to 5 times
    backoff: {
      type: 'exponential',
      delay: 5000,            // Start with 5s
    },
  }
);
```

### Custom Retry Logic

```typescript
async function processJobWithCustomRetry(job: Job): Promise<any> {
  try {
    return await riskyOperation();
  } catch (error: any) {
    if (error.code === 'TRANSIENT_ERROR') {
      // Let Bull retry
      throw error;
    } else {
      // Don't retry, mark as failed
      logger.error('Permanent failure', { error: error.message });
      return { failed: true, reason: error.message };
    }
  }
}
```

### Failed Job Handling

```typescript
// Get failed jobs
const failed = await jobQueueManager.getFailedJobs(QueueName.EMAIL, 0, 50);

for (const job of failed) {
  // Inspect failure
  console.log(`Job ${job.id} failed: ${job.failedReason}`);
  console.log(`Attempts: ${job.attemptsMade}`);

  // Retry manually
  if (shouldRetry(job)) {
    await jobQueueManager.retryJob(QueueName.EMAIL, job.id);
  }

  // Or remove
  if (shouldRemove(job)) {
    await jobQueueManager.removeJob(QueueName.EMAIL, job.id);
  }
}
```

---

## Best Practices

### 1. **Use Appropriate Queues**

Put jobs in the right queue based on their purpose:

```typescript
// ✅ Good
await jobQueueManager.addJob(QueueName.EMAIL, 'welcome', data);
await jobQueueManager.addJob(QueueName.REPORT, 'analytics', data);

// ❌ Bad - all jobs in one queue
await jobQueueManager.addJob(QueueName.EMAIL, 'all-jobs', data);
```

### 2. **Set Correct Priorities**

```typescript
// Critical alerts
await addEmailJob(EmailJobType.ALERT, data, JobPriority.CRITICAL);

// Normal operations
await addEmailJob(EmailJobType.WELCOME, data, JobPriority.NORMAL);

// Background cleanup
await addCleanupJob(CleanupJobType.OLD_LOGS, data, JobPriority.LOW);
```

### 3. **Keep Job Data Small**

```typescript
// ✅ Good - store reference
await jobQueueManager.addJob(QueueName.REPORT, 'generate', {
  reportId: 'report-123',
  userId: 'user-456',
});

// ❌ Bad - large payload
await jobQueueManager.addJob(QueueName.REPORT, 'generate', {
  allData: [...huge array...],
});
```

### 4. **Update Progress**

```typescript
async function processLongJob(job: Job): Promise<any> {
  await job.progress(0);

  const step1 = await doStep1();
  await job.progress(33);

  const step2 = await doStep2(step1);
  await job.progress(66);

  const result = await doStep3(step2);
  await job.progress(100);

  return result;
}
```

### 5. **Log Important Events**

```typescript
async function processJobWithLogging(job: Job): Promise<any> {
  logger.info('Job started', {
    jobId: job.id,
    type: job.name,
    data: job.data,
  });

  try {
    const result = await doWork(job.data);

    logger.info('Job completed', {
      jobId: job.id,
      result,
    });

    return result;
  } catch (error: any) {
    logger.error('Job failed', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

### 6. **Clean Up Old Jobs**

```typescript
// Clean completed jobs older than 7 days
await jobQueueManager.cleanQueue(
  QueueName.EMAIL,
  7 * 24 * 60 * 60 * 1000,
  'completed'
);

// Clean failed jobs older than 30 days
await jobQueueManager.cleanQueue(
  QueueName.EMAIL,
  30 * 24 * 60 * 60 * 1000,
  'failed'
);
```

### 7. **Monitor Queue Health**

```typescript
// Regular health checks
setInterval(async () => {
  const stats = await jobQueueManager.getAllQueueStats();

  for (const [queue, queueStats] of Object.entries(stats)) {
    if (queueStats.failed > 100) {
      logger.warn('High failure rate', { queue, failed: queueStats.failed });
    }

    if (queueStats.waiting > 1000) {
      logger.warn('Queue backing up', { queue, waiting: queueStats.waiting });
    }
  }
}, 60000); // Every minute
```

### 8. **Use Idempotent Jobs**

Make jobs safe to retry:

```typescript
async function processIdempotentJob(job: Job): Promise<any> {
  const { orderId } = job.data;

  // Check if already processed
  const existingResult = await db.result.findUnique({
    where: { orderId },
  });

  if (existingResult) {
    logger.info('Job already processed', { orderId });
    return existingResult;
  }

  // Process
  const result = await processOrder(orderId);

  // Store result
  await db.result.create({
    data: { orderId, result },
  });

  return result;
}
```

---

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@golive.dev
```

### Queue Settings

Adjust queue concurrency based on your infrastructure:

```typescript
// High-throughput queue
jobQueueManager.processJobs(
  QueueName.NOTIFICATION,
  'push',
  processNotification,
  20 // 20 concurrent jobs
);

// Resource-intensive queue
jobQueueManager.processJobs(
  QueueName.REPORT,
  'heavy-report',
  processReport,
  1 // 1 job at a time
);
```

---

## Troubleshooting

### Jobs Not Processing

**Check Redis connection:**
```bash
redis-cli ping
```

**Check queue status:**
```typescript
const stats = await jobQueueManager.getQueueStats(QueueName.EMAIL);
console.log('Paused:', stats.paused);
```

**Resume if paused:**
```typescript
await jobQueueManager.resumeQueue(QueueName.EMAIL);
```

### High Failure Rate

**Inspect failed jobs:**
```typescript
const failed = await jobQueueManager.getFailedJobs(QueueName.EMAIL, 0, 10);
failed.forEach(job => {
  console.log('Failed:', job.failedReason);
  console.log('Data:', job.data);
});
```

**Common causes:**
- Invalid email addresses
- SMTP configuration issues
- Missing required data fields
- External service downtime

### Memory Issues

**Clean old jobs regularly:**
```typescript
// Remove completed jobs older than 1 day
await jobQueueManager.cleanQueue(
  QueueName.EMAIL,
  24 * 60 * 60 * 1000,
  'completed'
);
```

**Reduce retained jobs:**
```typescript
const job = await jobQueueManager.addJob(
  QueueName.EMAIL,
  'welcome',
  data,
  {
    removeOnComplete: 10,  // Keep only 10 completed
    removeOnFail: 50,      // Keep only 50 failed
  }
);
```

---

## Resources

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Queue UI](https://github.com/vcapretz/bull-board)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Cron Expression Generator](https://crontab.guru/)

---

**Last Updated:** October 23, 2025
**Maintained By:** GoLive Platform Team
