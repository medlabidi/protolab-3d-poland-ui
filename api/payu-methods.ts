import { VercelRequest, VercelResponse } from '@vercel/node';

// PayU Configuration
const PAYU_CONFIG = {
  baseUrl: process.env.PAYU_BASE_URL || 'https://secure.snd.payu.com',
  posId: process.env.PAYU_POS_ID || '',
  clientId: process.env.PAYU_CLIENT_ID || '',
  clientSecret: process.env.PAYU_CLIENT_SECRET || '',
};

interface PayUAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  grant_type: string;
}

interface PayMethod {
  value: string;
  name: string;
  brandImageUrl: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
}

interface PayUPayMethodsResponse {
  cardPayMethods: PayMethod[];
  pblPayMethods: PayMethod[];
  installmentPayMethods: PayMethod[];
  payByLinks: PayMethod[];
  status: {
    statusCode: string;
  };
}

/**
 * Authenticate with PayU OAuth
 */
async function authenticatePayU(): Promise<string> {
  console.log('[PAYU-METHODS] Authenticating with PayU...');
  
  const authString = Buffer.from(
    `${PAYU_CONFIG.clientId}:${PAYU_CONFIG.clientSecret}`
  ).toString('base64');

  const response = await fetch(`${PAYU_CONFIG.baseUrl}/pl/standard/user/oauth/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authString}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PAYU-METHODS] OAuth failed:', response.status, errorText);
    throw new Error(`PayU OAuth failed: ${response.status}`);
  }

  const data = await response.json() as PayUAuthResponse;
  console.log('[PAYU-METHODS] OAuth successful');
  
  return data.access_token;
}

/**
 * Retrieve available payment methods from PayU
 */
async function fetchPaymentMethods(token: string, lang: string = 'pl'): Promise<PayUPayMethodsResponse> {
  console.log(`[PAYU-METHODS] Fetching payment methods (lang: ${lang})...`);
  
  const response = await fetch(`${PAYU_CONFIG.baseUrl}/api/v2_1/paymethods/?lang=${lang}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PAYU-METHODS] Failed to fetch payment methods:', response.status, errorText);
    throw new Error(`Failed to fetch payment methods: ${response.status}`);
  }

  const data = await response.json() as PayUPayMethodsResponse;
  console.log(`[PAYU-METHODS] Retrieved ${data.pblPayMethods?.length || 0} payment methods`);
  
  return data;
}

/**
 * Main handler for retrieving PayU payment methods
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    // Get language from query params (default: pl)
    const lang = (req.query.lang as string) || 'pl';

    console.log('[PAYU-METHODS] Starting payment methods retrieval...');
    console.log('[PAYU-METHODS] Language:', lang);

    // Step 1: Authenticate
    const token = await authenticatePayU();

    // Step 2: Fetch payment methods
    const paymentMethods = await fetchPaymentMethods(token, lang);

    console.log('[PAYU-METHODS] Payment methods retrieved successfully');

    // Return organized payment methods
    res.status(200).json({
      success: true,
      data: {
        cardPayMethods: paymentMethods.cardPayMethods || [],
        pblPayMethods: paymentMethods.pblPayMethods || [],
        installmentPayMethods: paymentMethods.installmentPayMethods || [],
        payByLinks: paymentMethods.payByLinks || [],
      },
    });

  } catch (error) {
    console.error('[PAYU-METHODS] Error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve payment methods',
    });
  }
}
