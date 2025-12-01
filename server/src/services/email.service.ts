import { Resend } from 'resend';
import { logger } from '../config/logger';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dev_key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@protolab.local';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@protolab.local';
const NODE_ENV = process.env.NODE_ENV || 'development';

// DEVELOPMENT MODE: Set to 'console' to log emails instead of sending them
// PRODUCTION MODE: Set to 'resend' to actually send emails via Resend API
const EMAIL_MODE = process.env.EMAIL_MODE || 'console'; // 'console' or 'resend'

// Create Resend client only if email mode is 'resend' and we have a valid API key
const resend = EMAIL_MODE === 'resend' && RESEND_API_KEY && !RESEND_API_KEY.includes('_dev_key')
  ? new Resend(RESEND_API_KEY) 
  : null;

// Enable actual email sending only if resend client is initialized
const isEmailEnabled = resend !== null;

// Log email configuration on startup
console.log(`\n📧 Email Service Configuration:`);
console.log(`   MODE: ${EMAIL_MODE}`);
console.log(`   FROM: ${FROM_EMAIL}`);
console.log(`   ADMIN: ${ADMIN_EMAIL}`);
console.log(`   ENABLED: ${isEmailEnabled ? '✓ YES (emails will be sent)' : '✗ NO (console only)'}\n`);

export class EmailService {
  async sendRegistrationConfirmation(toEmail: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Welcome to ProtoLab 3D Poland! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ProtoLab 3D Poland!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for registering with us. We're excited to have you join our community of 3D printing enthusiasts!</p>
              
              <div class="info-box">
                <p><strong>Next Step:</strong> Check your email for a verification link to complete your registration.</p>
              </div>

              <p><strong>What you can do:</strong></p>
              <ul>
                <li>📦 Upload your 3D model files (STL, OBJ, 3MF)</li>
                <li>🎨 Choose materials and colors</li>
                <li>📊 Customize layer height and infill</li>
                <li>🚀 Track your orders in real-time</li>
                <li>📍 Choose from multiple delivery options</li>
              </ul>

              <p>If you have any questions, feel free to contact our support team at <strong>${ADMIN_EMAIL}</strong></p>
            </div>
            <div class="footer">
              <p>ProtoLab 3D Poland - Professional 3D Printing Services</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ProtoLab 3D Poland!

        Hello ${userName}!

        Thank you for registering with us. Check your email for a verification link to complete your registration.

        What you can do:
        - Upload your 3D model files
        - Choose materials and colors
        - Customize print settings
        - Track your orders in real-time
        - Choose from multiple delivery options

        Need help? Contact us at ${ADMIN_EMAIL}

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 REGISTRATION CONFIRMATION EMAIL (NOT SENT - Email Disabled)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`\nThis is a registration confirmation email.`);
        console.log(`User will receive a separate email with the verification link.`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      logger.info(`Attempting to send registration confirmation via Resend to ${toEmail}`);
      const result = await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info({ result }, `Registration confirmation sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send registration confirmation to ${toEmail}`);
      // Don't throw - this is not critical
    }
  }

  async sendVerificationEmail(
    toEmail: string,
    userName: string,
    verificationToken: string
  ): Promise<void> {
    const API_BASE = process.env.BACKEND_URL || 'http://localhost:5000';
    const verificationLink = `${API_BASE}/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Verify Your Email Address - ProtoLab 3D Poland',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .code { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for signing up with ProtoLab 3D Poland. To complete your registration, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <div class="code">${verificationLink}</div>

              <p><strong>⏰ This verification link will expire in 24 hours.</strong></p>
              <p>Once verified, you'll be automatically logged in to your account and can start uploading your 3D models.</p>

              <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>ProtoLab 3D Poland - Professional 3D Printing Services</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address - ProtoLab 3D Poland

        Hello ${userName}!

        To complete your registration, please visit this link:

        ${verificationLink}

        This link will expire in 24 hours.

        If you didn't create this account, please ignore this email.

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 VERIFICATION EMAIL (NOT SENT - Email Disabled)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Verification Link: ${verificationLink}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      logger.info(`Attempting to send verification email via Resend to ${toEmail}`);
      const result = await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info({ result }, `Verification email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send verification email to ${toEmail}`);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(toEmail: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Congratulations! Your Account is Ready 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <div class="success-box">
                <p><strong>✅ Your email has been verified successfully!</strong></p>
                <p>Your account is now active and ready to use.</p>
              </div>

              <p>You can now:</p>
              <ul>
                <li>📤 Upload your 3D model files</li>
                <li>🎨 Select materials and colors</li>
                <li>⚙️ Configure print settings (layer height, infill, etc.)</li>
                <li>📦 Place orders and track them in real-time</li>
                <li>💬 Chat with our support team</li>
              </ul>

              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/dashboard" class="button">Go to Your Dashboard</a>
              </div>

              <h3>Need Help?</h3>
              <p>Check out our guides or contact our support team at ${ADMIN_EMAIL}</p>

              <p>Thank you for choosing ProtoLab 3D Poland. We're here to bring your ideas to life! 🚀</p>
            </div>
            <div class="footer">
              <p>ProtoLab 3D Poland - Professional 3D Printing Services</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Congratulations! Your Account is Ready

        Hello ${userName}!

        Your email has been verified successfully and your account is now active.

        You can now:
        - Upload your 3D model files
        - Select materials and colors
        - Configure print settings
        - Place orders and track them
        - Chat with support

        Go to your dashboard: ${FRONTEND_URL}/dashboard

        Thank you for choosing ProtoLab 3D Poland!

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 WELCOME/CONGRATULATIONS EMAIL (NOT SENT - Email Disabled)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`This email is sent after successful email verification.`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Welcome email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send welcome email to ${toEmail}`);
      // Don't throw - not critical
    }
  }

  async sendPasswordResetEmail(toEmail: string, userName: string, resetToken: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Reset Your Password - ProtoLab 3D Poland',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>We received a request to reset your password for your ProtoLab 3D Poland account.</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
              
              <div class="footer">
                <p>This email was sent by ProtoLab 3D Poland</p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - ProtoLab 3D Poland

        Hello ${userName},

        We received a request to reset your password for your ProtoLab 3D Poland account.

        Click the link below to reset your password:
        ${resetUrl}

        This link will expire in 1 hour.

        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 PASSWORD RESET EMAIL (Console Mode)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`Token: ${resetToken}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send password reset email to ${toEmail}`);
      throw new Error('Failed to send password reset email');
    }
  }
}

export const emailService = new EmailService();
