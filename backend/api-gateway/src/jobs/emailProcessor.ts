import { Job } from 'bull';
import { jobQueueManager, QueueName, EmailJobType } from '../services/jobQueue';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';

/**
 * Email Job Processor
 *
 * Handles sending various types of emails:
 * - Welcome emails
 * - Password resets
 * - Pipeline notifications
 * - Test results
 * - Deployment notifications
 * - Alerts
 */

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  [EmailJobType.WELCOME]: {
    subject: 'Welcome to GoLive DevOps Platform!',
    html: (context: any) => `
      <h1>Welcome, ${context.username}!</h1>
      <p>Your account has been successfully created.</p>
      <p>Get started by creating your first project and pipeline.</p>
      <a href="${context.dashboardUrl}">Go to Dashboard</a>
    `,
  },
  [EmailJobType.PASSWORD_RESET]: {
    subject: 'Password Reset Request',
    html: (context: any) => `
      <h1>Password Reset</h1>
      <p>You requested a password reset for your GoLive account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${context.resetUrl}">Reset Password</a>
      <p>This link expires in ${context.expiresIn} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  },
  [EmailJobType.PIPELINE_COMPLETE]: {
    subject: (context: any) => `Pipeline ${context.pipelineName} - ${context.status}`,
    html: (context: any) => `
      <h1>Pipeline ${context.status}</h1>
      <p><strong>Pipeline:</strong> ${context.pipelineName}</p>
      <p><strong>Project:</strong> ${context.projectName}</p>
      <p><strong>Status:</strong> ${context.status}</p>
      <p><strong>Duration:</strong> ${context.duration}</p>
      <p><strong>Triggered by:</strong> ${context.triggeredBy}</p>
      <a href="${context.pipelineUrl}">View Pipeline Run</a>
    `,
  },
  [EmailJobType.TEST_RESULTS]: {
    subject: (context: any) => `Test Results: ${context.testSuiteName} - ${context.status}`,
    html: (context: any) => `
      <h1>Test Suite Results</h1>
      <p><strong>Test Suite:</strong> ${context.testSuiteName}</p>
      <p><strong>Status:</strong> ${context.status}</p>
      <p><strong>Total Tests:</strong> ${context.totalTests}</p>
      <p><strong>Passed:</strong> ${context.passedTests}</p>
      <p><strong>Failed:</strong> ${context.failedTests}</p>
      <p><strong>Coverage:</strong> ${context.coverage}%</p>
      <a href="${context.testRunUrl}">View Test Results</a>
    `,
  },
  [EmailJobType.DEPLOYMENT_NOTIFICATION]: {
    subject: (context: any) => `Deployment to ${context.environment} - ${context.status}`,
    html: (context: any) => `
      <h1>Deployment ${context.status}</h1>
      <p><strong>Project:</strong> ${context.projectName}</p>
      <p><strong>Environment:</strong> ${context.environment}</p>
      <p><strong>Version:</strong> ${context.version}</p>
      <p><strong>Status:</strong> ${context.status}</p>
      <p><strong>Deployed by:</strong> ${context.deployedBy}</p>
      <a href="${context.deploymentUrl}">View Deployment</a>
    `,
  },
  [EmailJobType.ALERT]: {
    subject: (context: any) => `Alert: ${context.alertTitle}`,
    html: (context: any) => `
      <h1>System Alert</h1>
      <p><strong>Title:</strong> ${context.alertTitle}</p>
      <p><strong>Severity:</strong> ${context.severity}</p>
      <p><strong>Message:</strong> ${context.message}</p>
      <p><strong>Time:</strong> ${context.timestamp}</p>
      ${context.actionUrl ? `<a href="${context.actionUrl}">Take Action</a>` : ''}
    `,
  },
};

/**
 * Process email job
 */
async function processEmailJob(job: Job): Promise<any> {
  const { to, subject, template, context } = job.data;
  const emailType = job.name as EmailJobType;

  logger.info('Processing email job', {
    jobId: job.id,
    type: emailType,
    to,
  });

  // Get template
  const templateConfig = emailTemplates[emailType];
  if (!templateConfig) {
    throw new Error(`Unknown email type: ${emailType}`);
  }

  // Build email
  const emailSubject = subject ||
    (typeof templateConfig.subject === 'function'
      ? templateConfig.subject(context)
      : templateConfig.subject);

  const emailHtml = typeof templateConfig.html === 'function'
    ? templateConfig.html(context)
    : templateConfig.html;

  // Send email
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@golive.dev',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: emailSubject,
    html: emailHtml,
  });

  logger.info('Email sent successfully', {
    jobId: job.id,
    messageId: info.messageId,
    to,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

/**
 * Initialize email processor
 */
export function initializeEmailProcessor(): void {
  // Register processor for all email job types
  Object.values(EmailJobType).forEach((emailType) => {
    jobQueueManager.processJobs(
      QueueName.EMAIL,
      emailType,
      processEmailJob,
      5 // Process up to 5 emails concurrently
    );
  });

  logger.info('Email processor initialized');
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email configuration verified');
    return true;
  } catch (error: any) {
    logger.error('Email configuration verification failed', {
      error: error.message,
    });
    return false;
  }
}
