/**
 * Internationalized Email Templates for ProtoLab 3D Poland
 * Supports: Polish (pl), English (en), Russian (ru)
 */

import { t, SupportedLanguage, defaultLanguage } from '../i18n';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@protolab.local';

// Common email styles
const emailStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
  .header-green { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
  .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
  .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
  .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
  .code { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 20px 0; }
  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 1.1em; }
`;

function getFooterHtml(lang: SupportedLanguage): string {
  const year = new Date().getFullYear();
  return `
    <div class="footer">
      <p>${t(lang, 'email.common.footer')}</p>
      <p>${t(lang, 'email.common.copyright', { year: year.toString() })}</p>
    </div>
  `;
}

function getFooterText(lang: SupportedLanguage): string {
  const year = new Date().getFullYear();
  return `
${t(lang, 'email.common.bestRegards')}
${t(lang, 'email.common.teamName')}

${t(lang, 'email.common.footer')}
${t(lang, 'email.common.copyright', { year: year.toString() })}
  `;
}

export function generateRegistrationConfirmationEmail(
  userName: string,
  lang: SupportedLanguage = defaultLanguage
) {
  const subject = t(lang, 'email.registration.subject');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t(lang, 'email.registration.title')}</h1>
        </div>
        <div class="content">
          <h2>${t(lang, 'email.common.hello', { name: userName })}</h2>
          <p>${t(lang, 'email.registration.thankYou')}</p>
          
          <div class="info-box">
            <p><strong>${t(lang, 'email.registration.nextStep')}</strong> ${t(lang, 'email.registration.verifyEmail')}</p>
          </div>

          <p><strong>${t(lang, 'email.registration.whatYouCanDo')}</strong></p>
          <ul>
            <li>${t(lang, 'email.registration.feature1')}</li>
            <li>${t(lang, 'email.registration.feature2')}</li>
            <li>${t(lang, 'email.registration.feature3')}</li>
            <li>${t(lang, 'email.registration.feature4')}</li>
            <li>${t(lang, 'email.registration.feature5')}</li>
          </ul>

          <p>${t(lang, 'email.common.needHelp')} ${t(lang, 'email.common.contactSupport')} <strong>${ADMIN_EMAIL}</strong></p>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.registration.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.registration.thankYou')}

${t(lang, 'email.registration.nextStep')} ${t(lang, 'email.registration.verifyEmail')}

${t(lang, 'email.registration.whatYouCanDo')}
- ${t(lang, 'email.registration.feature1')}
- ${t(lang, 'email.registration.feature2')}
- ${t(lang, 'email.registration.feature3')}
- ${t(lang, 'email.registration.feature4')}
- ${t(lang, 'email.registration.feature5')}

${t(lang, 'email.common.needHelp')} ${t(lang, 'email.common.contactSupport')} ${ADMIN_EMAIL}
${getFooterText(lang)}
  `;

  return { subject, html, text };
}

export function generateVerificationEmail(
  userName: string,
  verificationLink: string,
  lang: SupportedLanguage = defaultLanguage
) {
  const subject = t(lang, 'email.verification.subject');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t(lang, 'email.verification.title')}</h1>
        </div>
        <div class="content">
          <h2>${t(lang, 'email.common.hello', { name: userName })}</h2>
          <p>${t(lang, 'email.verification.thankYou')}</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">${t(lang, 'email.verification.buttonText')}</a>
          </div>

          <p>${t(lang, 'email.verification.orCopyLink')}</p>
          <div class="code">${verificationLink}</div>

          <p><strong>${t(lang, 'email.verification.expiresIn')}</strong></p>
          <p>${t(lang, 'email.verification.afterVerification')}</p>

          <p>${t(lang, 'email.verification.ignore')}</p>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.verification.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.verification.thankYou')}

${t(lang, 'email.verification.buttonText')}: ${verificationLink}

${t(lang, 'email.verification.expiresIn')}

${t(lang, 'email.verification.ignore')}
${getFooterText(lang)}
  `;

  return { subject, html, text };
}

export function generateWelcomeEmail(
  userName: string,
  lang: SupportedLanguage = defaultLanguage
) {
  const subject = t(lang, 'email.welcome.subject');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header-green">
          <h1>${t(lang, 'email.welcome.title')}</h1>
        </div>
        <div class="content">
          <h2>${t(lang, 'email.common.hello', { name: userName })}</h2>
          
          <div class="success-box">
            <p><strong>${t(lang, 'email.welcome.verified')}</strong></p>
            <p>${t(lang, 'email.welcome.accountActive')}</p>
          </div>

          <p>${t(lang, 'email.welcome.youCanNow')}</p>
          <ul>
            <li>${t(lang, 'email.welcome.feature1')}</li>
            <li>${t(lang, 'email.welcome.feature2')}</li>
            <li>${t(lang, 'email.welcome.feature3')}</li>
            <li>${t(lang, 'email.welcome.feature4')}</li>
            <li>${t(lang, 'email.welcome.feature5')}</li>
          </ul>

          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/dashboard" class="button">${t(lang, 'email.welcome.goToDashboard')}</a>
          </div>

          <h3>${t(lang, 'email.common.needHelp')}</h3>
          <p>${t(lang, 'email.common.contactSupport')} ${ADMIN_EMAIL}</p>

          <p>${t(lang, 'email.welcome.thankYou')}</p>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.welcome.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.welcome.verified')}
${t(lang, 'email.welcome.accountActive')}

${t(lang, 'email.welcome.youCanNow')}
- ${t(lang, 'email.welcome.feature1')}
- ${t(lang, 'email.welcome.feature2')}
- ${t(lang, 'email.welcome.feature3')}
- ${t(lang, 'email.welcome.feature4')}
- ${t(lang, 'email.welcome.feature5')}

${t(lang, 'email.welcome.goToDashboard')}: ${FRONTEND_URL}/dashboard

${t(lang, 'email.welcome.thankYou')}
${getFooterText(lang)}
  `;

  return { subject, html, text };
}

export function generatePasswordResetEmail(
  userName: string,
  resetUrl: string,
  lang: SupportedLanguage = defaultLanguage
) {
  const subject = t(lang, 'email.passwordReset.subject');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t(lang, 'email.passwordReset.title')}</h1>
        </div>
        <div class="content">
          <p>${t(lang, 'email.common.hello', { name: userName })}</p>
          
          <p>${t(lang, 'email.passwordReset.received')}</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">${t(lang, 'email.passwordReset.buttonText')}</a>
          </p>
          
          <div class="warning-box">
            <strong>${t(lang, 'email.passwordReset.important')}</strong>
            <ul>
              <li>${t(lang, 'email.passwordReset.expiresIn')}</li>
              <li>${t(lang, 'email.passwordReset.ignore')}</li>
              <li>${t(lang, 'email.passwordReset.unchanged')}</li>
            </ul>
          </div>
          
          <p>${t(lang, 'email.passwordReset.linkNotWorking')}</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.passwordReset.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.passwordReset.received')}

${t(lang, 'email.passwordReset.buttonText')}: ${resetUrl}

${t(lang, 'email.passwordReset.important')}
- ${t(lang, 'email.passwordReset.expiresIn')}
- ${t(lang, 'email.passwordReset.ignore')}
- ${t(lang, 'email.passwordReset.unchanged')}
${getFooterText(lang)}
  `;

  return { subject, html, text };
}

export function generatePaymentConfirmationEmail(
  userName: string,
  orderDetails: {
    orderNumber?: string;
    projectName?: string;
    totalAmount: number;
    itemCount: number;
    paymentMethod: string;
  },
  lang: SupportedLanguage = defaultLanguage
) {
  const orderNumber = orderDetails.orderNumber || orderDetails.projectName || 'N/A';
  const subject = t(lang, 'email.paymentConfirmation.subject', { orderNumber });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header-green">
          <h1>${t(lang, 'email.paymentConfirmation.title')}</h1>
        </div>
        <div class="content">
          <h2>${t(lang, 'email.common.hello', { name: userName })}</h2>
          
          <div class="success-box">
            <p><strong>${t(lang, 'email.paymentConfirmation.thankYou')}</strong></p>
            <p>${t(lang, 'email.paymentConfirmation.confirmed', { orderNumber })}</p>
          </div>

          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${t(lang, 'email.paymentConfirmation.orderDetails')}</h3>
            <div class="summary-row">
              <span>${t(lang, 'email.paymentConfirmation.orderId')}:</span>
              <span>${orderNumber}</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.paymentConfirmation.amount')}:</span>
              <span>${orderDetails.totalAmount.toFixed(2)} PLN</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.paymentConfirmation.paymentMethod')}:</span>
              <span>${orderDetails.paymentMethod}</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.paymentConfirmation.status')}:</span>
              <span style="color: #28a745;">${t(lang, 'email.paymentConfirmation.processing')}</span>
            </div>
          </div>

          <div class="info-box">
            <p><strong>${t(lang, 'email.paymentConfirmation.nextSteps')}</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>${t(lang, 'email.paymentConfirmation.step1')}</li>
              <li>${t(lang, 'email.paymentConfirmation.step2')}</li>
              <li>${t(lang, 'email.paymentConfirmation.step3')}</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/orders" class="button">${t(lang, 'email.paymentConfirmation.trackOrder')}</a>
          </div>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.paymentConfirmation.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.paymentConfirmation.thankYou')}
${t(lang, 'email.paymentConfirmation.confirmed', { orderNumber })}

${t(lang, 'email.paymentConfirmation.orderDetails')}
- ${t(lang, 'email.paymentConfirmation.orderId')}: ${orderNumber}
- ${t(lang, 'email.paymentConfirmation.amount')}: ${orderDetails.totalAmount.toFixed(2)} PLN
- ${t(lang, 'email.paymentConfirmation.paymentMethod')}: ${orderDetails.paymentMethod}
- ${t(lang, 'email.paymentConfirmation.status')}: ${t(lang, 'email.paymentConfirmation.processing')}

${t(lang, 'email.paymentConfirmation.nextSteps')}
- ${t(lang, 'email.paymentConfirmation.step1')}
- ${t(lang, 'email.paymentConfirmation.step2')}
- ${t(lang, 'email.paymentConfirmation.step3')}

${t(lang, 'email.paymentConfirmation.trackOrder')}: ${FRONTEND_URL}/orders
${getFooterText(lang)}
  `;

  return { subject, html, text };
}

export function generateRefundEmail(
  userName: string,
  refundDetails: {
    orderNumber: string;
    refundAmount: number;
    reason: string;
    refundMethod: string;
  },
  lang: SupportedLanguage = defaultLanguage
) {
  const subject = t(lang, 'email.refund.subject', { orderNumber: refundDetails.orderNumber });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t(lang, 'email.refund.title')}</h1>
        </div>
        <div class="content">
          <h2>${t(lang, 'email.common.hello', { name: userName })}</h2>
          
          <div class="info-box">
            <p><strong>${t(lang, 'email.refund.received', { orderNumber: refundDetails.orderNumber })}</strong></p>
          </div>

          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${t(lang, 'email.refund.details')}</h3>
            <div class="summary-row">
              <span>${t(lang, 'email.refund.orderId')}:</span>
              <span>#${refundDetails.orderNumber}</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.refund.refundAmount')}:</span>
              <span style="color: #28a745;">${refundDetails.refundAmount.toFixed(2)} PLN</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.refund.reason')}:</span>
              <span>${refundDetails.reason}</span>
            </div>
          </div>

          <div class="warning-box">
            <p><strong>${t(lang, 'email.refund.whatHappens')}</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>${t(lang, 'email.refund.step1')}</li>
              <li>${t(lang, 'email.refund.step2')}</li>
              <li>${t(lang, 'email.refund.step3')}</li>
            </ul>
          </div>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.refund.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.refund.received', { orderNumber: refundDetails.orderNumber })}

${t(lang, 'email.refund.details')}
- ${t(lang, 'email.refund.orderId')}: #${refundDetails.orderNumber}
- ${t(lang, 'email.refund.refundAmount')}: ${refundDetails.refundAmount.toFixed(2)} PLN
- ${t(lang, 'email.refund.reason')}: ${refundDetails.reason}

${t(lang, 'email.refund.whatHappens')}
- ${t(lang, 'email.refund.step1')}
- ${t(lang, 'email.refund.step2')}
- ${t(lang, 'email.refund.step3')}
${getFooterText(lang)}
  `;

  return { subject, html, text };
}

export function generateInvoiceEmail(
  userName: string,
  invoiceDetails: {
    invoiceNumber: string;
    orderNumber?: string;
    totalAmount: number;
  },
  lang: SupportedLanguage = defaultLanguage
) {
  const orderNumber = invoiceDetails.orderNumber || invoiceDetails.invoiceNumber;
  const subject = t(lang, 'email.invoice.subject', { orderNumber });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t(lang, 'email.invoice.title')}</h1>
        </div>
        <div class="content">
          <h2>${t(lang, 'email.common.hello', { name: userName })}</h2>
          
          <p>${t(lang, 'email.invoice.attached')}</p>

          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${t(lang, 'email.invoice.invoiceDetails')}</h3>
            <div class="summary-row">
              <span>${t(lang, 'email.invoice.invoiceNumber')}:</span>
              <span>${invoiceDetails.invoiceNumber}</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.invoice.orderId')}:</span>
              <span>${orderNumber}</span>
            </div>
            <div class="summary-row">
              <span>${t(lang, 'email.invoice.totalAmount')}:</span>
              <span>${invoiceDetails.totalAmount.toFixed(2)} PLN</span>
            </div>
          </div>

          <p>${t(lang, 'email.invoice.download')}</p>

          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/dashboard" class="button">${t(lang, 'email.invoice.goToDashboard')}</a>
          </div>
        </div>
        ${getFooterHtml(lang)}
      </div>
    </body>
    </html>
  `;

  const text = `
${t(lang, 'email.invoice.title')}

${t(lang, 'email.common.hello', { name: userName })}

${t(lang, 'email.invoice.attached')}

${t(lang, 'email.invoice.invoiceDetails')}
- ${t(lang, 'email.invoice.invoiceNumber')}: ${invoiceDetails.invoiceNumber}
- ${t(lang, 'email.invoice.orderId')}: ${orderNumber}
- ${t(lang, 'email.invoice.totalAmount')}: ${invoiceDetails.totalAmount.toFixed(2)} PLN

${t(lang, 'email.invoice.download')}

${t(lang, 'email.invoice.goToDashboard')}: ${FRONTEND_URL}/dashboard
${getFooterText(lang)}
  `;

  return { subject, html, text };
}
