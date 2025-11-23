import * as nodemailer from 'nodemailer';
import { logger } from '../config/logger';

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER || 'protolablogin@proton.me';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'iMperea&41@518';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

// Create transporter for Proton Mail
const transporter = nodemailer.createTransport({
  host: 'mail.protonmail.ch',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export class EmailService {
  async sendVerificationEmail(
    toEmail: string,
    userName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${EMAIL_USER}>`,
      to: toEmail,
      subject: 'Verify Your ProtoLab Account',
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
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .code { background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 16px; letter-spacing: 2px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔧 Welcome to ProtoLab 3D Poland!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for registering with ProtoLab 3D Poland. We're excited to have you on board!</p>
              <p>To complete your registration and start using our 3D printing services, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <div class="code">${verificationLink}</div>

              <p><strong>This verification link will expire in 24 hours.</strong></p>

              <p>If you didn't create an account with ProtoLab, please ignore this email.</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

              <p><strong>What's next?</strong></p>
              <ul>
                <li>📦 Upload your 3D models</li>
                <li>🎨 Choose materials and colors</li>
                <li>🚀 Track your orders in real-time</li>
                <li>📍 Flexible delivery options</li>
              </ul>
            </div>
            <div class="footer">
              <p>ProtoLab 3D Poland - Professional 3D Printing Services</p>
              <p>If you have any questions, reply to this email or contact our support team.</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ProtoLab 3D Poland!

        Hello ${userName}!

        Thank you for registering. To complete your registration, please verify your email address by visiting:

        ${verificationLink}

        This link will expire in 24 hours.

        If you didn't create an account, please ignore this email.

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send verification email to ${toEmail}`);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(toEmail: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${EMAIL_USER}>`,
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
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Aboard!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Your email has been verified successfully! You're all set to start using ProtoLab 3D Poland.</p>
              
              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>

              <h3>Getting Started:</h3>
              <ol>
                <li>Upload your 3D model files (STL, OBJ)</li>
                <li>Select material, color, and print settings</li>
                <li>Choose your delivery method</li>
                <li>Track your order in real-time</li>
              </ol>

              <p>Need help? Our team is here to assist you every step of the way!</p>
            </div>
            <div class="footer">
              <p>ProtoLab 3D Poland - Professional 3D Printing Services</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send welcome email to ${toEmail}`);
    }
  }
}

export const emailService = new EmailService();
