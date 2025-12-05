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

  async sendPaymentConfirmationEmail(
    toEmail: string,
    userName: string,
    orderDetails: {
      orderNumber?: string;
      projectName?: string;
      totalAmount: number;
      itemCount: number;
      paymentMethod: string;
    }
  ): Promise<void> {
    const isProject = orderDetails.itemCount > 1;
    const orderIdentifier = orderDetails.projectName || orderDetails.orderNumber || 'your order';
    
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: `Payment Confirmed - ${isProject ? orderDetails.projectName : 'Order'} | ProtoLab 3D Poland`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .order-summary { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 1.1em; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Successful!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <div class="success-box">
                <p><strong>Your payment has been confirmed!</strong></p>
                <p>We've received your payment and your ${isProject ? 'project' : 'order'} is now being processed.</p>
              </div>

              <div class="order-summary">
                <h3 style="margin-top: 0;">Order Summary</h3>
                <div class="summary-row">
                  <span>${isProject ? 'Project' : 'Order'}:</span>
                  <span>${orderIdentifier}</span>
                </div>
                <div class="summary-row">
                  <span>Items:</span>
                  <span>${orderDetails.itemCount} ${orderDetails.itemCount === 1 ? 'file' : 'files'}</span>
                </div>
                <div class="summary-row">
                  <span>Payment Method:</span>
                  <span>${orderDetails.paymentMethod}</span>
                </div>
                <div class="summary-row">
                  <span>Total Amount:</span>
                  <span>${orderDetails.totalAmount.toFixed(2)} PLN</span>
                </div>
              </div>

              <div class="info-box">
                <p><strong>📦 What's Next?</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Our team will review your order and prepare it for printing</li>
                  <li>You'll receive updates as your order progresses</li>
                  <li>Track your order status anytime in your dashboard</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/orders" class="button">Track Your Order</a>
              </div>

              <p>If you have any questions, feel free to contact us at <strong>${ADMIN_EMAIL}</strong></p>
            </div>
            <div class="footer">
              <p>Thank you for choosing ProtoLab 3D Poland!</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Payment Confirmed - ProtoLab 3D Poland

        Hello ${userName}!

        Your payment has been confirmed! We've received your payment and your ${isProject ? 'project' : 'order'} is now being processed.

        Order Summary:
        - ${isProject ? 'Project' : 'Order'}: ${orderIdentifier}
        - Items: ${orderDetails.itemCount} ${orderDetails.itemCount === 1 ? 'file' : 'files'}
        - Payment Method: ${orderDetails.paymentMethod}
        - Total Amount: ${orderDetails.totalAmount.toFixed(2)} PLN

        What's Next?
        - Our team will review your order and prepare it for printing
        - You'll receive updates as your order progresses
        - Track your order status anytime: ${FRONTEND_URL}/orders

        Questions? Contact us at ${ADMIN_EMAIL}

        Thank you for choosing ProtoLab 3D Poland!
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 PAYMENT CONFIRMATION EMAIL (Console Mode)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Order: ${orderIdentifier}`);
        console.log(`Amount: ${orderDetails.totalAmount.toFixed(2)} PLN`);
        console.log(`Items: ${orderDetails.itemCount}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Payment confirmation email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send payment confirmation email to ${toEmail}`);
      // Don't throw - not critical
    }
  }

  async sendRefundRequestEmail(
    toEmail: string,
    userName: string,
    refundDetails: {
      orderNumber: string;
      refundAmount: number;
      reason: string;
      refundMethod: string;
    }
  ): Promise<void> {
    const reasonText = refundDetails.reason === 'cancellation' 
      ? 'Order Cancellation' 
      : refundDetails.reason === 'price_reduction' 
        ? 'Order Modification (Price Reduction)' 
        : 'Order Modification';

    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: `Refund Request Received - Order #${refundDetails.orderNumber} | ProtoLab 3D Poland`,
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
            .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .refund-summary { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 1.1em; color: #28a745; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💸 Refund Request Received</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <div class="info-box">
                <p><strong>We've received your refund request!</strong></p>
                <p>Our team is processing your request and you'll receive your refund soon.</p>
              </div>

              <div class="refund-summary">
                <h3 style="margin-top: 0;">Refund Details</h3>
                <div class="summary-row">
                  <span>Order Number:</span>
                  <span>#${refundDetails.orderNumber}</span>
                </div>
                <div class="summary-row">
                  <span>Reason:</span>
                  <span>${reasonText}</span>
                </div>
                <div class="summary-row">
                  <span>Refund Method:</span>
                  <span>${refundDetails.refundMethod === 'original' ? 'Original Payment Method' : refundDetails.refundMethod === 'bank' ? 'Bank Transfer' : 'Store Credit (+5% bonus)'}</span>
                </div>
                <div class="summary-row">
                  <span>Refund Amount:</span>
                  <span>${refundDetails.refundAmount.toFixed(2)} PLN</span>
                </div>
              </div>

              <div class="warning-box">
                <p><strong>⏰ Processing Time:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Original Payment Method:</strong> 3-5 business days</li>
                  <li><strong>Bank Transfer:</strong> 2-3 business days</li>
                  <li><strong>Store Credit:</strong> Instant (added to your account)</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/orders" class="button">View Your Orders</a>
              </div>

              <p>If you have any questions about your refund, please contact us at <strong>${ADMIN_EMAIL}</strong></p>
            </div>
            <div class="footer">
              <p>Thank you for your patience!</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Refund Request Received - ProtoLab 3D Poland

        Hello ${userName}!

        We've received your refund request and our team is processing it.

        Refund Details:
        - Order Number: #${refundDetails.orderNumber}
        - Reason: ${reasonText}
        - Refund Method: ${refundDetails.refundMethod === 'original' ? 'Original Payment Method' : refundDetails.refundMethod === 'bank' ? 'Bank Transfer' : 'Store Credit (+5% bonus)'}
        - Refund Amount: ${refundDetails.refundAmount.toFixed(2)} PLN

        Processing Time:
        - Original Payment Method: 3-5 business days
        - Bank Transfer: 2-3 business days
        - Store Credit: Instant

        View your orders: ${FRONTEND_URL}/orders

        Questions? Contact us at ${ADMIN_EMAIL}

        Thank you for your patience!
        ProtoLab 3D Poland Team
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 REFUND REQUEST EMAIL (Console Mode)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Order: #${refundDetails.orderNumber}`);
        console.log(`Refund Amount: ${refundDetails.refundAmount.toFixed(2)} PLN`);
        console.log(`Reason: ${reasonText}`);
        console.log(`Method: ${refundDetails.refundMethod}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Refund request email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send refund request email to ${toEmail}`);
      // Don't throw - not critical
    }
  }

  async sendInvoiceEmail(
    toEmail: string,
    userName: string,
    invoiceDetails: {
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      orderNumber?: string;
      projectName?: string;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }>;
      subtotal: number;
      vatRate: number;
      vatAmount: number;
      totalAmount: number;
      paymentMethod: string;
      billingInfo: {
        companyName: string;
        taxId: string;
        vatNumber?: string;
        address: string;
        city: string;
        zipCode: string;
        country: string;
      };
    }
  ): Promise<{ invoiceNumber: string; success: boolean }> {
    const itemsHtml = invoiceDetails.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toFixed(2)} PLN</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.total.toFixed(2)} PLN</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: `Invoice ${invoiceDetails.invoiceNumber} - ProtoLab 3D Poland`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .invoice-box { background: white; padding: 30px; border: 1px solid #ddd; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
            .company-info { text-align: right; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .billing-info, .invoice-info { width: 48%; }
            .billing-info h4, .invoice-info h4 { color: #667eea; margin-bottom: 10px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
            .totals { text-align: right; margin-top: 20px; }
            .totals-row { display: flex; justify-content: flex-end; padding: 8px 0; }
            .totals-label { width: 150px; text-align: right; margin-right: 20px; }
            .totals-value { width: 120px; text-align: right; }
            .grand-total { font-size: 1.3em; font-weight: bold; color: #667eea; border-top: 2px solid #667eea; padding-top: 15px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            .payment-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .stamp { color: #28a745; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🧾 INVOICE</h1>
            </div>
            <div class="invoice-box">
              <div class="invoice-header">
                <div>
                  <h2 style="margin: 0; color: #667eea;">ProtoLab 3D Poland</h2>
                  <p style="margin: 5px 0; color: #666;">Professional 3D Printing Services</p>
                  <p style="margin: 5px 0; font-size: 14px;">Zielonogórska 13</p>
                  <p style="margin: 5px 0; font-size: 14px;">30-406 Kraków, Poland</p>
                  <p style="margin: 5px 0; font-size: 14px;">NIP: PL1234567890</p>
                </div>
                <div class="company-info">
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Invoice No:</strong> ${invoiceDetails.invoiceNumber}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${invoiceDetails.invoiceDate}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Due Date:</strong> ${invoiceDetails.dueDate}</p>
                  <p class="stamp" style="margin-top: 15px;">✓ PAID</p>
                </div>
              </div>

              <div class="invoice-details">
                <div class="billing-info">
                  <h4>Bill To</h4>
                  <p style="margin: 5px 0;"><strong>${invoiceDetails.billingInfo.companyName}</strong></p>
                  <p style="margin: 5px 0; font-size: 14px;">${invoiceDetails.billingInfo.address}</p>
                  <p style="margin: 5px 0; font-size: 14px;">${invoiceDetails.billingInfo.zipCode} ${invoiceDetails.billingInfo.city}</p>
                  <p style="margin: 5px 0; font-size: 14px;">${invoiceDetails.billingInfo.country}</p>
                  <p style="margin: 5px 0; font-size: 14px;">NIP: ${invoiceDetails.billingInfo.taxId}</p>
                  ${invoiceDetails.billingInfo.vatNumber ? `<p style="margin: 5px 0; font-size: 14px;">VAT: ${invoiceDetails.billingInfo.vatNumber}</p>` : ''}
                </div>
                <div class="invoice-info">
                  <h4>Order Details</h4>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>${invoiceDetails.projectName ? 'Project' : 'Order'}:</strong> ${invoiceDetails.projectName || invoiceDetails.orderNumber || 'N/A'}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Method:</strong> ${invoiceDetails.paymentMethod}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #28a745;">Paid</span></p>
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="totals">
                <div class="totals-row">
                  <span class="totals-label">Subtotal:</span>
                  <span class="totals-value">${invoiceDetails.subtotal.toFixed(2)} PLN</span>
                </div>
                <div class="totals-row">
                  <span class="totals-label">VAT (${invoiceDetails.vatRate}%):</span>
                  <span class="totals-value">${invoiceDetails.vatAmount.toFixed(2)} PLN</span>
                </div>
                <div class="totals-row grand-total">
                  <span class="totals-label">Total:</span>
                  <span class="totals-value">${invoiceDetails.totalAmount.toFixed(2)} PLN</span>
                </div>
              </div>

              <div class="payment-info">
                <p style="margin: 0;"><strong>Payment received on ${invoiceDetails.invoiceDate}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Thank you for your business!</p>
              </div>
            </div>

            <div class="footer">
              <p>ProtoLab 3D Poland - Professional 3D Printing Services</p>
              <p>Questions? Contact us at ${ADMIN_EMAIL}</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        INVOICE - ProtoLab 3D Poland
        ============================

        Invoice No: ${invoiceDetails.invoiceNumber}
        Date: ${invoiceDetails.invoiceDate}
        Due Date: ${invoiceDetails.dueDate}
        Status: PAID

        BILL TO:
        ${invoiceDetails.billingInfo.companyName}
        ${invoiceDetails.billingInfo.address}
        ${invoiceDetails.billingInfo.zipCode} ${invoiceDetails.billingInfo.city}
        ${invoiceDetails.billingInfo.country}
        NIP: ${invoiceDetails.billingInfo.taxId}
        ${invoiceDetails.billingInfo.vatNumber ? `VAT: ${invoiceDetails.billingInfo.vatNumber}` : ''}

        ORDER DETAILS:
        ${invoiceDetails.projectName ? 'Project' : 'Order'}: ${invoiceDetails.projectName || invoiceDetails.orderNumber || 'N/A'}
        Payment Method: ${invoiceDetails.paymentMethod}

        ITEMS:
        ${invoiceDetails.items.map(item => `- ${item.description} x${item.quantity}: ${item.total.toFixed(2)} PLN`).join('\n')}

        TOTALS:
        Subtotal: ${invoiceDetails.subtotal.toFixed(2)} PLN
        VAT (${invoiceDetails.vatRate}%): ${invoiceDetails.vatAmount.toFixed(2)} PLN
        Total: ${invoiceDetails.totalAmount.toFixed(2)} PLN

        Payment received on ${invoiceDetails.invoiceDate}
        Thank you for your business!

        Questions? Contact us at ${ADMIN_EMAIL}
        ProtoLab 3D Poland
      `,
    };

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🧾 INVOICE EMAIL (Console Mode)`);
        console.log(`To: ${toEmail}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Invoice No: ${invoiceDetails.invoiceNumber}`);
        console.log(`Date: ${invoiceDetails.invoiceDate}`);
        console.log(`Company: ${invoiceDetails.billingInfo.companyName}`);
        console.log(`NIP: ${invoiceDetails.billingInfo.taxId}`);
        console.log(`Total: ${invoiceDetails.totalAmount.toFixed(2)} PLN`);
        console.log(`${'='.repeat(80)}\n`);
        return { invoiceNumber: invoiceDetails.invoiceNumber, success: true };
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Invoice email sent to ${toEmail}, Invoice: ${invoiceDetails.invoiceNumber}`);
      return { invoiceNumber: invoiceDetails.invoiceNumber, success: true };
    } catch (error) {
      logger.error({ err: error }, `Failed to send invoice email to ${toEmail}`);
      return { invoiceNumber: invoiceDetails.invoiceNumber, success: false };
    }
  }
}

export const emailService = new EmailService();
