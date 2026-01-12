/**
 * PayU Configuration for Sandbox Environment
 * 
 * This configuration uses sandbox credentials for testing BLIK payments
 */

export const payuConfig = {
  // PayU Sandbox API endpoints
  apiUrl: 'https://secure.snd.payu.com',
  oauthUrl: 'https://secure.snd.payu.com/pl/standard/user/oauth/authorize',
  
  // Sandbox credentials
  posId: process.env.PAYU_POS_ID || '501885',
  secondKey: process.env.PAYU_SECOND_KEY || '93e0d9536f9d4bb396c47163c3a1692e',
  clientId: process.env.PAYU_CLIENT_ID || '501885',
  clientSecret: process.env.PAYU_CLIENT_SECRET || '81927c33ee2b36ee897bef24ef90a446',
  
  // OAuth settings
  grantType: 'client_credentials',
  
  // Payment settings
  currencyCode: 'PLN',
  customerIp: '127.0.0.1', // Will be replaced with actual customer IP
  
  // Notification settings
  notifyUrl: process.env.PAYU_NOTIFY_URL || 'http://localhost:5000/api/payments/payu/notify',
  continueUrl: process.env.PAYU_CONTINUE_URL || 'http://localhost:8080/orders',
};

export default payuConfig;
