import { VercelRequest, VercelResponse } from '@vercel/node';

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
}

interface PayUOrderResponse {
  status: {
    statusCode: string;
  };
  redirectUri?: string;
  orderId: string;
  extOrderId?: string;
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

    const data: PayUAuthResponse = await response.json();

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
}): Promise<{ redirectUri: string; payuOrderId: string }> {
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

    console.log('Creating PayU order:', JSON.stringify(payuOrder, null, 2));

    // Create order
    const response = await fetch(`${PAYU_CONFIG.baseUrl}/api/v2_1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payuOrder),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayU order creation failed:', errorText);
      throw new Error(`PayU order creation failed: ${response.status} ${errorText}`);
    }

    const result: PayUOrderResponse = await response.json();

    if (result.status.statusCode !== 'SUCCESS') {
      throw new Error(`PayU order creation failed: ${result.status.statusCode}`);
    }

    if (!result.redirectUri) {
      throw new Error('PayU did not return redirect URI');
    }

    return {
      redirectUri: result.redirectUri,
      payuOrderId: result.orderId,
    };
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
  signature: string | undefined
): boolean {
  if (!signature) {
    return false;
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHash('md5')
    .update(body + PAYU_CONFIG.md5Key)
    .digest('hex');

  return signature === expectedSignature;
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
