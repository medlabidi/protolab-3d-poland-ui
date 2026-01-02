import { Resend } from 'resend';

// Clean environment variable values
const cleanEnvValue = (value: string | undefined, defaultValue: string): string => {
  if (!value) return defaultValue;
  // Remove quotes, \r\n, and trim
  return value.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\r\\n/g, '')
    .replace(/\r\n/g, '')
    .replace(/\r/g, '')
    .replace(/\n/g, '');
};

const getResendApiKey = () => cleanEnvValue(process.env.RESEND_API_KEY, '');
const getFromEmail = () => cleanEnvValue(process.env.FROM_EMAIL, 'noreply@protolab.info');
const getFrontendUrl = () => cleanEnvValue(process.env.FRONTEND_URL, 'https://protolabb.vercel.app');
const getEmailMode = () => cleanEnvValue(process.env.EMAIL_MODE, 'resend'); // Default to resend

let resendClient: Resend | null = null;

const getResend = (): Resend | null => {
  const apiKey = getResendApiKey();
  const emailMode = getEmailMode();
  
  console.log(`📧 [EMAIL-CONFIG] Mode: "${emailMode}", API Key exists: ${!!apiKey && apiKey.length > 10}, From: ${getFromEmail()}`);
  
  // Allow sending if we have an API key (be more permissive)
  if (!apiKey || apiKey.length < 10) {
    console.log('📧 [EMAIL-DISABLED] No valid API key found');
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(apiKey);
    console.log('📧 [EMAIL-INIT] Resend client initialized');
  }
  
  return resendClient;
};

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  verificationToken: string
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
  
  const subject = 'Zweryfikuj swój adres email - ProtoLab 3D';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖨️ ProtoLab 3D Poland</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName}!</h2>
          <p>Dziękujemy za rejestrację w ProtoLab 3D Poland.</p>
          <p>Aby zweryfikować swój adres email i aktywować konto, kliknij poniższy przycisk:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" class="button">Zweryfikuj Email</a>
          </p>
          <p>Lub skopiuj i wklej ten link w przeglądarce:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationLink}</p>
          <p>Link jest ważny przez 24 godziny.</p>
          <p>Jeśli nie rejestrowałeś się w ProtoLab 3D, zignoruj tę wiadomość.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Verification email for ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Link: ${verificationLink}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    console.log(`📧 [EMAIL-SENDING] To: ${toEmail}, From: ${fromEmail}`);
    
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Verification email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send verification email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetToken: string
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  const subject = 'Resetowanie hasła - ProtoLab 3D';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖨️ ProtoLab 3D Poland</h1>
        </div>
        <div class="content">
          <h2>Resetowanie hasła</h2>
          <p>Witaj ${userName},</p>
          <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
          <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Resetuj Hasło</a>
          </p>
          <p>Lub skopiuj i wklej ten link w przeglądarce:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
          <p>Link jest ważny przez 1 godzinę.</p>
          <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Password reset email for ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Link: ${resetLink}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    console.log(`📧 [EMAIL-SENDING] Password reset to: ${toEmail}, From: ${fromEmail}`);
    
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Password reset email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send password reset email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  
  const subject = 'Witamy w ProtoLab 3D Poland! 🎉';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖨️ ProtoLab 3D Poland</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName}! 🎉</h2>
          <p>Twoje konto zostało pomyślnie zweryfikowane.</p>
          <p>Możesz teraz korzystać ze wszystkich funkcji ProtoLab 3D:</p>
          <ul>
            <li>Zamawiaj profesjonalne wydruki 3D</li>
            <li>Śledź status swoich zamówień</li>
            <li>Kontaktuj się z naszym zespołem</li>
          </ul>
          <p style="text-align: center;">
            <a href="${frontendUrl}/dashboard" class="button">Przejdź do Panelu</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Welcome email for ${toEmail}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Welcome email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send welcome email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  toEmail: string,
  userName: string,
  orderDetails: {
    orderNumber: string;
    totalAmount: number;
    paymentMethod: string;
  }
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  
  const subject = `Potwierdzenie płatności - Zamówienie #${orderDetails.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Płatność Potwierdzona</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName}!</h2>
          <div class="success-box">
            <p><strong>Dziękujemy za płatność!</strong></p>
            <p>Twoja płatność za zamówienie #${orderDetails.orderNumber} została potwierdzona.</p>
          </div>
          <p><strong>Szczegóły:</strong></p>
          <ul>
            <li>Numer zamówienia: #${orderDetails.orderNumber}</li>
            <li>Kwota: ${orderDetails.totalAmount.toFixed(2)} PLN</li>
            <li>Metoda płatności: ${orderDetails.paymentMethod}</li>
          </ul>
          <p>Twoje zamówienie jest teraz w kolejce do druku.</p>
          <p style="text-align: center;">
            <a href="${frontendUrl}/orders" class="button">Śledź Zamówienie</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Payment confirmation for ${toEmail}`);
    console.log(`   Order: #${orderDetails.orderNumber}, Amount: ${orderDetails.totalAmount} PLN`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Payment confirmation sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send payment confirmation to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  toEmail: string,
  userName: string,
  orderDetails: {
    orderNumber: string;
    totalAmount: number;
    reason?: string;
  }
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  
  const subject = `Płatność nieudana - Zamówienie #${orderDetails.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .error-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Płatność Nieudana</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName},</h2>
          <div class="error-box">
            <p><strong>Niestety, płatność nie powiodła się.</strong></p>
            ${orderDetails.reason ? `<p>Powód: ${orderDetails.reason}</p>` : ''}
          </div>
          <p><strong>Szczegóły zamówienia:</strong></p>
          <ul>
            <li>Numer zamówienia: #${orderDetails.orderNumber}</li>
            <li>Kwota: ${orderDetails.totalAmount.toFixed(2)} PLN</li>
          </ul>
          <p>Możesz spróbować ponownie lub wybrać inną metodę płatności.</p>
          <p style="text-align: center;">
            <a href="${frontendUrl}/orders/${orderDetails.orderNumber}" class="button">Spróbuj Ponownie</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Payment failed for ${toEmail}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Payment failed email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send payment failed email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send refund request email
 */
export async function sendRefundRequestEmail(
  toEmail: string,
  userName: string,
  refundDetails: {
    orderNumber: string;
    refundAmount: number;
    reason: string;
  }
): Promise<EmailResult> {
  const subject = `Wniosek o zwrot - Zamówienie #${refundDetails.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Wniosek o Zwrot</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName},</h2>
          <div class="info-box">
            <p><strong>Otrzymaliśmy Twój wniosek o zwrot środków.</strong></p>
          </div>
          <p><strong>Szczegóły:</strong></p>
          <ul>
            <li>Numer zamówienia: #${refundDetails.orderNumber}</li>
            <li>Kwota zwrotu: ${refundDetails.refundAmount.toFixed(2)} PLN</li>
            <li>Powód: ${refundDetails.reason}</li>
          </ul>
          <p><strong>Co dalej?</strong></p>
          <ol>
            <li>Nasz zespół rozpatrzy Twój wniosek w ciągu 2-3 dni roboczych</li>
            <li>Otrzymasz email z decyzją</li>
            <li>W przypadku akceptacji, środki zostaną zwrócone w ciągu 5-10 dni roboczych</li>
          </ol>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Refund request for ${toEmail}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Refund request email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send refund request email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send shipment status email
 */
export async function sendShipmentStatusEmail(
  toEmail: string,
  userName: string,
  shipmentDetails: {
    orderNumber: string;
    status: 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered';
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  
  const statusMessages: Record<string, { title: string; message: string; emoji: string }> = {
    shipped: {
      title: 'Zamówienie Wysłane!',
      message: 'Twoje zamówienie zostało wysłane.',
      emoji: '📦'
    },
    in_transit: {
      title: 'Przesyłka w Drodze',
      message: 'Twoja przesyłka jest w drodze do Ciebie.',
      emoji: '🚚'
    },
    out_for_delivery: {
      title: 'Przesyłka Dostarczana',
      message: 'Kurier jest już w drodze z Twoją przesyłką!',
      emoji: '🏃'
    },
    delivered: {
      title: 'Przesyłka Dostarczona!',
      message: 'Twoja przesyłka została dostarczona.',
      emoji: '✅'
    }
  };

  const statusInfo = statusMessages[shipmentDetails.status];
  const subject = `${statusInfo.emoji} ${statusInfo.title} - Zamówienie #${shipmentDetails.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusInfo.emoji} ${statusInfo.title}</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName}!</h2>
          <p>${statusInfo.message}</p>
          
          <div class="info-box">
            <p><strong>Szczegóły przesyłki:</strong></p>
            <ul>
              <li>Numer zamówienia: #${shipmentDetails.orderNumber}</li>
              ${shipmentDetails.trackingNumber ? `<li>Numer śledzenia: ${shipmentDetails.trackingNumber}</li>` : ''}
              ${shipmentDetails.carrier ? `<li>Przewoźnik: ${shipmentDetails.carrier}</li>` : ''}
              ${shipmentDetails.estimatedDelivery ? `<li>Przewidywana dostawa: ${shipmentDetails.estimatedDelivery}</li>` : ''}
            </ul>
          </div>
          
          <p style="text-align: center;">
            <a href="${frontendUrl}/orders" class="button">Śledź Przesyłkę</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Shipment status (${shipmentDetails.status}) for ${toEmail}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Shipment status email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send shipment status email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
  toEmail: string,
  userName: string,
  orderDetails: {
    orderNumber: string;
    status: string;
    message?: string;
  }
): Promise<EmailResult> {
  const frontendUrl = getFrontendUrl();
  
  const statusLabels: Record<string, string> = {
    submitted: 'Złożone',
    in_queue: 'W kolejce',
    printing: 'W trakcie druku',
    quality_check: 'Kontrola jakości',
    ready_for_shipping: 'Gotowe do wysyłki',
    shipped: 'Wysłane',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
    on_hold: 'Wstrzymane'
  };

  const statusLabel = statusLabels[orderDetails.status] || orderDetails.status;
  const subject = `Aktualizacja zamówienia #${orderDetails.orderNumber} - ${statusLabel}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .status-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Aktualizacja Zamówienia</h1>
        </div>
        <div class="content">
          <h2>Witaj ${userName}!</h2>
          <p>Status Twojego zamówienia został zaktualizowany.</p>
          
          <div class="status-box">
            <p><strong>Zamówienie #${orderDetails.orderNumber}</strong></p>
            <p style="font-size: 1.2em; color: #667eea;"><strong>${statusLabel}</strong></p>
          </div>
          
          ${orderDetails.message ? `<p>${orderDetails.message}</p>` : ''}
          
          <p style="text-align: center;">
            <a href="${frontendUrl}/orders/${orderDetails.orderNumber}" class="button">Zobacz Szczegóły</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ProtoLab 3D Poland. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resend = getResend();
  
  if (!resend) {
    console.log(`📧 [EMAIL-CONSOLE] Order status (${orderDetails.status}) for ${toEmail}`);
    return { success: true, messageId: 'console-mode' };
  }
  
  try {
    const fromEmail = getFromEmail();
    const result = await resend.emails.send({
      from: `ProtoLab 3D Poland <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    });
    
    console.log(`📧 [EMAIL-SENT] Order status email sent to ${toEmail}`, JSON.stringify(result));
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error(`📧 [EMAIL-ERROR] Failed to send order status email to ${toEmail}`, JSON.stringify(error));
    return { success: false, error: error?.message || JSON.stringify(error) };
  }
}
