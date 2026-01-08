import { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

// PayU Configuration
const PAYU_CONFIG = {
  clientId: process.env.PAYU_CLIENT_ID || '501885',
  clientSecret: process.env.PAYU_CLIENT_SECRET || '81927c33ee2b36ee897bef24ef90a446',
  posId: process.env.PAYU_POS_ID || '501885',
  md5Key: process.env.PAYU_MD5_KEY || '93e0d9536f9d4bb396c47163c3a1692e',
  baseUrl: process.env.PAYU_ENV === 'production' 
    ? 'https://secure.payu.com' 
    : 'https://secure.snd.payu.com', // sandbox for testing
  notifyUrl: process.env.PAYU_NOTIFY_URL || `${process.env.FRONTEND_URL}/api/payments/payu/notify`,
  continueUrl: process.env.PAYU_CONTINUE_URL || `${process.env.FRONTEND_URL}/payment-success`,
};

interface PayUAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  grant_type: string;
}

interface PayUProduct {
  name: string;
  unitPrice: string; // in grosz (1 PLN = 100 grosz)
  quantity: string;
}

interface PayUBuyer {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
}

interface PayUOrderRequest {
  customerIp: string;
  merchantPosId: string;
  description: string;
  currencyCode: string;
  totalAmount: string; // in grosz
  extOrderId?: string; // your internal order ID
  buyer?: PayUBuyer;
  products: PayUProduct[];
  notifyUrl?: string;
  continueUrl?: string;
  payMethods?: {
    payMethod: {
      type: string;
      value: string;
      authorizationCode?: string;
      specificData?: any[];
    };
  };
}

interface PayUOrderResponse {
  status: {
    statusCode: string;
    statusDesc?: string;
  };
  redirectUri?: string;
  orderId: string;
  extOrderId?: string;
  iframeAllowed?: boolean;
}

// Cache for OAuth token
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get PayU OAuth token (with caching)
 */
export async function getPayUToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const response = await fetch(`${PAYU_CONFIG.baseUrl}/pl/standard/user/oauth/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: PAYU_CONFIG.clientId,
        client_secret: PAYU_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayU authentication failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as PayUAuthResponse;

    // Cache token (expires_in is in seconds, convert to milliseconds)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // 1 min buffer
    };

    return data.access_token;
  } catch (error) {
    console.error('PayU authentication error:', error);
    throw new Error('Failed to authenticate with PayU');
  }
}

/**
 * Create PayU order and get payment URL
 */
export async function createPayUOrder(orderData: {
  orderId: string;
  amount: number; // in PLN
  description: string;
  customerEmail: string;
  customerIp: string;
  products: Array<{ name: string; unitPrice: number; quantity: number }>;
  buyer?: Partial<PayUBuyer>;
  payMethods?: {
    payMethod: {
      type: string;
      value: string;
      authorizationCode?: string;
      specificData?: any[];
    };
  };
}): Promise<{ redirectUri?: string; orderId: string; statusCode: string; status?: string; statusDesc?: string }> {
  try {
    // Get OAuth token
    const token = await getPayUToken();

    // Convert amounts to grosz (PayU uses smallest currency unit)
    const totalAmount = Math.round(orderData.amount * 100).toString();
    const products: PayUProduct[] = orderData.products.map(p => ({
      name: p.name,
      unitPrice: Math.round(p.unitPrice * 100).toString(),
      quantity: p.quantity.toString(),
    }));

    // Prepare order request
    const payuOrder: PayUOrderRequest = {
      customerIp: orderData.customerIp,
      merchantPosId: PAYU_CONFIG.posId,
      description: orderData.description,
      currencyCode: 'PLN',
      totalAmount,
      extOrderId: orderData.orderId, // Your internal order ID
      products,
      notifyUrl: PAYU_CONFIG.notifyUrl,
      continueUrl: `${PAYU_CONFIG.continueUrl}?orderId=${orderData.orderId}`,
      buyer: {
        email: orderData.customerEmail,
        firstName: orderData.buyer?.firstName,
        lastName: orderData.buyer?.lastName,
        phone: orderData.buyer?.phone,
        language: orderData.buyer?.language || 'pl',
      },
    };

    // Add payMethods if provided (for white label integration)
    if (orderData.payMethods) {
      payuOrder.payMethods = orderData.payMethods;
    }

    console.log('Creating PayU order:', JSON.stringify(payuOrder, null, 2));

    // Use native https module for better redirect control
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payuOrder);
      
      const options = {
        hostname: PAYU_CONFIG.baseUrl.replace('https://', ''),
        port: 443,
        path: '/api/v2_1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${token}`,
        },
      };

      const req = https.request(options, (response) => {
        console.log(`[PAYU] Response Status: ${response.statusCode}`);

        // Handle 302 redirect (PBL methods)
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUri = response.headers.location;
          console.log(`[PAYU] Got redirect:`, redirectUri);

          // Try to extract order ID from response body if available
          let responseData = '';
          response.on('data', (chunk) => {
            responseData += chunk;
          });

          response.on('end', () => {
            try {
              const data = JSON.parse(responseData);
              console.log('[PAYU] 302 redirect response data:', JSON.stringify(data, null, 2));
              resolve({
                redirectUri: redirectUri,
                orderId: data.orderId || redirectUri?.match(/orderId=([^&]+)/)?.[1] || '',
                statusCode: 'SUCCESS',
                status: 'SUCCESS',
              });
            } catch (e) {
              // No JSON body, use redirect URL
              console.log('[PAYU] 302 redirect with no JSON body, redirectUri:', redirectUri);
              resolve({
                redirectUri: redirectUri,
                orderId: redirectUri?.match(/orderId=([^&]+)/)?.[1] || '',
                statusCode: 'SUCCESS',
                status: 'SUCCESS',
              });
            }
          });
          return;
        }

        // Handle 201 (BLIK with code, card tokenization)
        let responseData = '';

        response.on('data', (chunk) => {
          responseData += chunk;
        });

        response.on('end', () => {
          try {
            const result = JSON.parse(responseData) as PayUOrderResponse;

            console.log('[PAYU] Order creation response:', JSON.stringify(result, null, 2));

            // Don't reject on non-SUCCESS - let frontend handle the error status
            // This allows proper error messages to be shown to the user
            resolve({
              redirectUri: result.redirectUri,
              orderId: result.orderId,
              statusCode: result.status.statusCode,
              status: result.status.statusCode, // Same as statusCode for now
              statusDesc: result.status.statusDesc,
            });
          } catch (parseError) {
            console.error('[PAYU] Failed to parse response:', responseData);
            reject(new Error('Invalid PayU response format'));
          }
        });
      });

      req.on('error', (error) => {
        console.error('[PAYU] Request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('Create PayU order error:', error);
    throw error;
  }
}

/**
 * Verify PayU notification signature
 */
export function verifyPayUSignature(
  body: string,
  signatureHeader: string | undefined
): boolean {
  if (!signatureHeader) {
    return false;
  }

  // Parse PayU signature header format: "sender=checkout;signature=XXX;algorithm=MD5;content=DOCUMENT"
  const signatureMatch = signatureHeader.match(/signature=([a-f0-9]+)/);
  if (!signatureMatch) {
    console.error('[PAYU] Could not parse signature from header:', signatureHeader);
    return false;
  }

  const receivedSignature = signatureMatch[1];

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHash('md5')
    .update(body + PAYU_CONFIG.md5Key)
    .digest('hex');

  console.log('[PAYU] Signature comparison:', {
    received: receivedSignature,
    expected: expectedSignature,
    match: receivedSignature === expectedSignature,
  });

  return receivedSignature === expectedSignature;
}

/**
 * Parse PayU notification
 */
export interface PayUNotification {
  order: {
    orderId: string;
    extOrderId?: string;
    orderCreateDate: string;
    notifyUrl: string;
    customerIp: string;
    merchantPosId: string;
    description: string;
    currencyCode: string;
    totalAmount: string;
    status: 'NEW' | 'PENDING' | 'WAITING_FOR_CONFIRMATION' | 'COMPLETED' | 'CANCELED';
    products: Array<{
      name: string;
      unitPrice: string;
      quantity: string;
    }>;
  };
  localReceiptDateTime?: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

export function getPayUConfig() {
  return PAYU_CONFIG;
}
