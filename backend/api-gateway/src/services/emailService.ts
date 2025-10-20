/**
 * Email Service
 * Handles sending emails for verification, password reset, etc.
 *
 * NOTE: This is a mock implementation for development.
 * In production, integrate with a real email service like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Postmark
 */

import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send an email
   * Currently logs to console for development
   * TODO: Integrate with real email service in production
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In development, just log the email content
      if (process.env.NODE_ENV === 'development') {
        logger.info('📧 Email would be sent (development mode):', {
          to: options.to,
          subject: options.subject,
        });
        console.log('\n' + '='.repeat(80));
        console.log(`📧 EMAIL TO: ${options.to}`);
        console.log(`📝 SUBJECT: ${options.subject}`);
        console.log('='.repeat(80));
        console.log(options.text || 'See HTML content in logs');
        console.log('='.repeat(80) + '\n');
        return true;
      }

      // TODO: In production, integrate with real email service
      // Example with SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: options.to,
      //   from: process.env.FROM_EMAIL,
      //   subject: options.subject,
      //   text: options.text,
      //   html: options.html,
      // });

      logger.warn('Email service not configured for production');
      return false;
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      return false;
    }
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3030'}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to GoLive DevOps!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for registering with GoLive DevOps Platform! To complete your registration and start using our platform, please verify your email address.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with GoLive DevOps, you can safely ignore this email.</p>
            <p>Best regards,<br>The GoLive DevOps Team</p>
          </div>
          <div class="footer">
            <p>© 2025 GoLive DevOps Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

Thank you for registering with GoLive DevOps Platform!

To complete your registration and start using our platform, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with GoLive DevOps, you can safely ignore this email.

Best regards,
The GoLive DevOps Team
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: '🚀 Verify your email - GoLive DevOps Platform',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3030'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your GoLive DevOps Platform account.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This password reset link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            <p>Best regards,<br>The GoLive DevOps Team</p>
          </div>
          <div class="footer">
            <p>© 2025 GoLive DevOps Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

We received a request to reset your password for your GoLive DevOps Platform account.

To reset your password, click the link below:

${resetUrl}

This password reset link will expire in 1 hour.

If you didn't request this reset, please ignore this email. Your password will remain unchanged.

Best regards,
The GoLive DevOps Team
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: '🔐 Password Reset Request - GoLive DevOps Platform',
      html,
      text,
    });
  }

  /**
   * Send welcome email after email verification
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3030'}/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature { margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to GoLive DevOps!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your email has been verified successfully! Welcome to the GoLive DevOps Platform.</p>
            <div class="features">
              <h2>🚀 Get Started:</h2>
              <div class="feature">✅ Create your first project</div>
              <div class="feature">✅ Set up CI/CD pipelines</div>
              <div class="feature">✅ Configure automated testing</div>
              <div class="feature">✅ Deploy with confidence</div>
            </div>
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </p>
            <p>If you have any questions or need assistance, our support team is here to help!</p>
            <p>Best regards,<br>The GoLive DevOps Team</p>
          </div>
          <div class="footer">
            <p>© 2025 GoLive DevOps Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

Your email has been verified successfully! Welcome to the GoLive DevOps Platform.

Get Started:
- Create your first project
- Set up CI/CD pipelines
- Configure automated testing
- Deploy with confidence

Visit your dashboard: ${dashboardUrl}

If you have any questions or need assistance, our support team is here to help!

Best regards,
The GoLive DevOps Team
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: '🎉 Welcome to GoLive DevOps Platform!',
      html,
      text,
    });
  }
}
