import { Resend } from 'resend';
import { logger } from '../config/logger';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_5uvYahPi_CXKRTzv5UWZMMG7r7zsHsC44';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'protolablogin@proton.me';

// Create Resend client
const resend = new Resend(RESEND_API_KEY);

export class EmailService {
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
                <a href="${verificationLink}" class="button">✅ Verify Email Address</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <div class="code">${verificationLink}</div>

              <p><strong>⏰ This verification link will expire in 24 hours.</strong></p>
              <p>Once verified, you'll be automatically logged in to your dashboard.</p>

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
      await resend.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: 'Verify Your ProtoLab Account',
        html: mailOptions.html,
      });
      logger.info(`Verification email sent to ${toEmail} via Resend`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send verification email to ${toEmail}`);
      throw new Error('Failed to send verification email');
    }
  }

  async sendSubmissionConfirmation(toEmail: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Registration Request Submitted - ProtoLab 3D Poland',
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
              <h1>📝 Registration Submitted</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Your registration request has been <strong>submitted successfully</strong>.</p>
              
              <div class="info-box">
                <p><strong>⏳ What happens next?</strong></p>
                <p>Your account is currently under review by our admin team. You will receive an email confirmation once your account is approved.</p>
              </div>

              <p>This process typically takes <strong>24-48 hours</strong>. We appreciate your patience!</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

              <p><strong>Registration Details:</strong></p>
              <ul>
                <li>📧 Email: ${toEmail}</li>
                <li>👤 Name: ${userName}</li>
                <li>📅 Submitted: ${new Date().toLocaleString()}</li>
              </ul>

              <p>If you have any questions, feel free to contact us at ${ADMIN_EMAIL}</p>
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
        Registration Submitted - ProtoLab 3D Poland

        Hello ${userName}!

        Your registration request has been submitted successfully.

        Your account is currently under review by our admin team. You will receive an email confirmation once your account is approved.

        This process typically takes 24-48 hours.

        Registration Details:
        - Email: ${toEmail}
        - Name: ${userName}
        - Submitted: ${new Date().toLocaleString()}

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      await resend.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Submission confirmation sent to ${toEmail} via Resend`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send submission confirmation to ${toEmail}`);
      throw new Error('Failed to send submission confirmation');
    }
  }

  async sendAdminNotification(
    userName: string,
    userEmail: string,
    phone: string | undefined,
    address: string | undefined,
    city: string | undefined,
    zipCode: string | undefined,
    country: string | undefined,
    approvalToken: string
  ): Promise<void> {
    const approveLink = `${FRONTEND_URL}/api/auth/approve-user?token=${approvalToken}`;
    const rejectLink = `${FRONTEND_URL}/api/auth/reject-user?token=${approvalToken}`;
    const API_BASE = process.env.BACKEND_URL || 'http://localhost:5000';
    const apiApproveLink = `${API_BASE}/api/auth/approve-user?token=${approvalToken}`;
    const apiRejectLink = `${API_BASE}/api/auth/reject-user?token=${approvalToken}`;

    const mailOptions = {
      from: `"ProtoLab Registration System" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🔔 New Registration: ${userName} - Action Required`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 650px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .user-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; display: inline-block; width: 120px; }
            .button { display: inline-block; padding: 15px 40px; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; }
            .approve-btn { background: #4CAF50; }
            .reject-btn { background: #f44336; }
            .actions { text-align: center; margin: 30px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New User Registration</h1>
              <p>Action Required - Approve or Reject</p>
            </div>
            <div class="content">
              <h2>Registration Details</h2>
              
              <div class="user-details">
                <div class="detail-row">
                  <span class="detail-label">👤 Name:</span>
                  <span>${userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📧 Email:</span>
                  <span>${userEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📱 Phone:</span>
                  <span>${phone || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏠 Address:</span>
                  <span>${address || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏙️ City:</span>
                  <span>${city || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📮 Zip Code:</span>
                  <span>${zipCode || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🌍 Country:</span>
                  <span>${country || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Submitted:</span>
                  <span>${new Date().toLocaleString()}</span>
                </div>
              </div>

              <div class="actions">
                <h3>Take Action:</h3>
                <a href="${apiApproveLink}" class="button approve-btn">✅ Approve User</a>
                <a href="${apiRejectLink}" class="button reject-btn">❌ Reject User</a>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

              <p style="font-size: 12px; color: #666;">
                <strong>Note:</strong> Clicking the buttons above will immediately approve or reject this user's registration.
                The user will be notified automatically via email.
              </p>
            </div>
            <div class="footer">
              <p>ProtoLab 3D Poland - Admin Notification System</p>
              <p>&copy; ${new Date().getFullYear()} ProtoLab 3D Poland. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        NEW USER REGISTRATION - ACTION REQUIRED

        Registration Details:
        - Name: ${userName}
        - Email: ${userEmail}
        - Phone: ${phone || 'Not provided'}
        - Address: ${address || 'Not provided'}
        - City: ${city || 'Not provided'}
        - Zip Code: ${zipCode || 'Not provided'}
        - Country: ${country || 'Not provided'}
        - Submitted: ${new Date().toLocaleString()}

        To approve this user, visit:
        ${apiApproveLink}

        To reject this user, visit:
        ${apiRejectLink}

        ProtoLab 3D Poland Admin Team
      `,
    };

    try {
      await resend.emails.send({
        from: `ProtoLab Registration System <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Admin notification sent for user: ${userEmail} via Resend`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send admin notification for ${userEmail}`);
      throw new Error('Failed to send admin notification');
    }
  }

  async sendApprovalEmail(toEmail: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: '✅ Account Approved - Welcome to ProtoLab 3D Poland!',
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
            .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account Approved!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${userName}!</h2>
              
              <div class="success-box">
                <p><strong>✅ Your account has been approved by our admin team!</strong></p>
                <p>You can now log in and start using ProtoLab 3D Poland's services.</p>
              </div>

              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/login" class="button">Login to Dashboard</a>
              </div>

              <h3>Getting Started:</h3>
              <ol>
                <li>Log in with your registered email and password</li>
                <li>Upload your 3D model files (STL, OBJ, etc.)</li>
                <li>Select material, color, and print settings</li>
                <li>Choose your delivery method</li>
                <li>Track your order in real-time</li>
              </ol>

              <p>Need help? Our team is here to assist you every step of the way!</p>
              <p>Contact us at: ${ADMIN_EMAIL}</p>
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
        Account Approved - ProtoLab 3D Poland

        Congratulations, ${userName}!

        Your account has been approved by our admin team!

        You can now log in and start using ProtoLab 3D Poland's services.

        Login at: ${FRONTEND_URL}/login

        Getting Started:
        1. Log in with your registered email and password
        2. Upload your 3D model files
        3. Select material and print settings
        4. Track your order in real-time

        Need help? Contact us at: ${ADMIN_EMAIL}

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      await resend.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Approval email sent to ${toEmail} via Resend`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send approval email to ${toEmail}`);
      throw new Error('Failed to send approval email');
    }
  }

  async sendRejectionEmail(toEmail: string, userName: string, reason?: string): Promise<void> {
    const mailOptions = {
      from: `"ProtoLab 3D Poland" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Registration Status - ProtoLab 3D Poland',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for your interest in ProtoLab 3D Poland.</p>
              
              <div class="info-box">
                <p>After careful review, we are unable to approve your registration at this time.</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>

              <p>If you believe this is an error or would like to provide additional information, please contact us at:</p>
              <p><strong>${ADMIN_EMAIL}</strong></p>

              <p>We appreciate your understanding.</p>
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
        Registration Status - ProtoLab 3D Poland

        Hello ${userName},

        Thank you for your interest in ProtoLab 3D Poland.

        After careful review, we are unable to approve your registration at this time.
        ${reason ? `\nReason: ${reason}` : ''}

        If you believe this is an error or would like to provide additional information, please contact us at: ${ADMIN_EMAIL}

        Best regards,
        ProtoLab 3D Poland Team
      `,
    };

    try {
      await resend.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Rejection email sent to ${toEmail} via Resend`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send rejection email to ${toEmail}`);
      throw new Error('Failed to send rejection email');
    }
  }

  async sendWelcomeEmail(toEmail: string, userName: string): Promise<void> {
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
      await resend.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      logger.info(`Welcome email sent to ${toEmail} via Resend`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send welcome email to ${toEmail}`);
    }
  }
}

export const emailService = new EmailService();
