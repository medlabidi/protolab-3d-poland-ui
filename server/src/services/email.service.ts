import { Resend } from 'resend';
import { logger } from '../config/logger';
import { SupportedLanguage, defaultLanguage } from '../i18n';
import {
  generateRegistrationConfirmationEmail,
  generateVerificationEmail,
  generateWelcomeEmail,
  generatePasswordResetEmail,
  generatePaymentConfirmationEmail,
  generateRefundEmail,
  generateInvoiceEmail,
} from './email-templates';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dev_key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@protolab.local';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@protolab.local';

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
  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    toEmail: string,
    userName: string,
    lang: SupportedLanguage = defaultLanguage
  ): Promise<void> {
    const { subject, html, text } = generateRegistrationConfirmationEmail(userName, lang);
    
    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 REGISTRATION CONFIRMATION EMAIL (NOT SENT - Email Disabled)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
        console.log(`Subject: ${subject}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      logger.info(`Attempting to send registration confirmation via Resend to ${toEmail}`);
      const result = await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html,
      });
      logger.info({ result }, `Registration confirmation sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send registration confirmation to ${toEmail}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(
    toEmail: string,
    userName: string,
    verificationToken: string,
    lang: SupportedLanguage = defaultLanguage
  ): Promise<void> {
    const API_BASE = process.env.BACKEND_URL || 'http://localhost:5000';
    const verificationLink = `${API_BASE}/api/auth/verify-email?token=${verificationToken}`;
    
    const { subject, html, text } = generateVerificationEmail(userName, verificationLink, lang);

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 VERIFICATION EMAIL (NOT SENT - Email Disabled)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
        console.log(`Subject: ${subject}`);
        console.log(`Verification Link: ${verificationLink}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      logger.info(`Attempting to send verification email via Resend to ${toEmail}`);
      const result = await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html,
      });
      logger.info({ result }, `Verification email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send verification email to ${toEmail}`);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send welcome email after email verification
   */
  async sendWelcomeEmail(
    toEmail: string,
    userName: string,
    lang: SupportedLanguage = defaultLanguage
  ): Promise<void> {
    const { subject, html, text } = generateWelcomeEmail(userName, lang);

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 WELCOME EMAIL (NOT SENT - Email Disabled)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
        console.log(`Subject: ${subject}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html,
      });
      logger.info(`Welcome email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send welcome email to ${toEmail}`);
      // Don't throw - not critical
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    toEmail: string,
    userName: string,
    resetToken: string,
    lang: SupportedLanguage = defaultLanguage
  ): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    const { subject, html, text } = generatePasswordResetEmail(userName, resetUrl, lang);

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 PASSWORD RESET EMAIL (Console Mode)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
        console.log(`Subject: ${subject}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html,
      });
      logger.info(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send password reset email to ${toEmail}`);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    toEmail: string,
    userName: string,
    orderDetails: {
      orderNumber?: string;
      projectName?: string;
      totalAmount: number;
      itemCount: number;
      paymentMethod: string;
    },
    lang: SupportedLanguage = defaultLanguage
  ): Promise<void> {
    const { subject, html, text } = generatePaymentConfirmationEmail(userName, orderDetails, lang);

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 PAYMENT CONFIRMATION EMAIL (Console Mode)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
        console.log(`Subject: ${subject}`);
        console.log(`Order: ${orderDetails.orderNumber || orderDetails.projectName}`);
        console.log(`Amount: ${orderDetails.totalAmount.toFixed(2)} PLN`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html,
      });
      logger.info(`Payment confirmation email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send payment confirmation email to ${toEmail}`);
      // Don't throw - not critical
    }
  }

  /**
   * Send refund request confirmation email
   */
  async sendRefundRequestEmail(
    toEmail: string,
    userName: string,
    refundDetails: {
      orderNumber: string;
      refundAmount: number;
      reason: string;
      refundMethod: string;
    },
    lang: SupportedLanguage = defaultLanguage
  ): Promise<void> {
    const { subject, html, text } = generateRefundEmail(userName, refundDetails, lang);

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 REFUND REQUEST EMAIL (Console Mode)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
        console.log(`Subject: ${subject}`);
        console.log(`Order: #${refundDetails.orderNumber}`);
        console.log(`Refund Amount: ${refundDetails.refundAmount.toFixed(2)} PLN`);
        console.log(`${'='.repeat(80)}\n`);
        return;
      }
      
      await resend!.emails.send({
        from: `ProtoLab 3D Poland <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html,
      });
      logger.info(`Refund request email sent to ${toEmail}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send refund request email to ${toEmail}`);
      // Don't throw - not critical
    }
  }

  /**
   * Send invoice email
   * Note: The invoice email template is simplified. For full invoice functionality,
   * you may want to generate and attach a PDF invoice.
   */
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
    },
    lang: SupportedLanguage = defaultLanguage
  ): Promise<{ invoiceNumber: string; success: boolean }> {
    const { subject, html, text } = generateInvoiceEmail(
      userName,
      {
        invoiceNumber: invoiceDetails.invoiceNumber,
        orderNumber: invoiceDetails.orderNumber,
        totalAmount: invoiceDetails.totalAmount,
      },
      lang
    );

    try {
      if (!isEmailEnabled) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🧾 INVOICE EMAIL (Console Mode)`);
        console.log(`To: ${toEmail} | Lang: ${lang}`);
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
        subject,
        html,
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
