import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Use fallback for environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PayU Configuration - Use same config as working test
const PAYU_CONFIG = {
  clientId: process.env.PAYU_CLIENT_ID || '501885',
  clientSecret: process.env.PAYU_CLIENT_SECRET || '81927c33ee2b36ee897bef24ef90a446',
  posId: process.env.PAYU_POS_ID || '501885',
  baseUrl: 'https://secure.snd.payu.com', // Sandbox for now
};

/**
 * Authenticate with PayU and get OAuth token
 */
async function getPayUToken(): Promise<string> {
  console.log('[PAYU-CREATE] Authenticating with PayU...');
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
    console.error('[PAYU-CREATE] Auth failed:', response.status, errorText);
    throw new Error(`PayU authentication failed: ${response.status} ${errorText}`);
  }

  const data: any = await response.json();
  console.log('[PAYU-CREATE] Authentication successful');
  return data.access_token as string;
}

/**
 * Create PayU order - Standard REST API implementation
 */
async function createPayUOrder(token: string, orderData: any): Promise<any> {
  console.log('[PAYU-CREATE] Creating PayU order...');
  
  const response = await fetch(`${PAYU_CONFIG.baseUrl}/api/v2_1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
    redirect: 'manual', // Don't follow redirects automatically
  });

  console.log('[PAYU-CREATE] PayU response status:', response.status);
  
  // PayU returns 302 with redirectUri in Location header
  if (response.status === 302) {
    const redirectUri = response.headers.get('location');
    console.log('[PAYU-CREATE] Got redirect URI:', redirectUri);
    
    return {
      redirectUri,
      statusCode: 'SUCCESS',
    };
  }

  // PayU may return 200/201 with JSON containing redirectUri
  if (response.ok) {
    const result = await response.json();
    console.log('[PAYU-CREATE] Order created:', result);
    
    return {
      redirectUri: result.redirectUri,
      orderId: result.orderId,
      statusCode: result.status?.statusCode || 'SUCCESS',
    };
  }

  // Error case
  const errorText = await response.text();
  console.error('[PAYU-CREATE] Order creation failed:', response.status, errorText);
  throw new Error(`PayU order creation failed: ${response.status}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[PAYU-CREATE] Starting PayU order creation...');
    const { orderId, amount, description, userId, payMethods } = req.body;
    console.log('[PAYU-CREATE] Request body:', { orderId, amount, description, userId, payMethods });

    if (!orderId || !amount || !description || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, amount, description, userId' 
      });
    }

    // Get user details
    console.log('[PAYU-CREATE] Fetching user details...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[PAYU-CREATE] User not found:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[PAYU-CREATE] User found:', userData.email);

    // Get client IP
    const customerIp = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
      (req.headers['x-real-ip'] as string) || 
      '127.0.0.1';

    // Split name into first and last name
    const nameParts = userData.name?.split(' ') || [];
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Step 1: Authenticate with PayU
    const token = await getPayUToken();

    // Step 2: Prepare order payload
    const orderPayload: any = {
      customerIp,
      merchantPosId: PAYU_CONFIG.posId,
      description,
      currencyCode: 'PLN',
      totalAmount: (parseFloat(amount) * 100).toString(), // Convert to grosz
      extOrderId: orderId,
      products: [
        {
          name: description,
          unitPrice: (parseFloat(amount) * 100).toString(),
          quantity: '1',
        },
      ],
      buyer: {
        email: userData.email,
        firstName,
        lastName,
        language: 'pl',
      },
      notifyUrl: `https://protolab.info/api/payments/payu/notify`,
      continueUrl: `https://protolab.info/payment-success`,
    };
    
    // Add payMethods if provided
    if (payMethods) {
      orderPayload.payMethods = payMethods;
    }

    console.log('[PAYU-CREATE] Order payload:', JSON.stringify(orderPayload, null, 2));

    // Step 3: Create PayU order
    const payuResult = await createPayUOrder(token, orderPayload);
    
    // Step 4: Update database if successful
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid', // Use paid status for PayU orders
        payment_method: payMethods?.payMethod?.value || 'redirect',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[PAYU-CREATE] Database update failed:', updateError);
      // Continue anyway, PayU order was created successfully
    }

    console.log('[PAYU-CREATE] Success! Redirect URI:', payuResult.redirectUri);

    // Return simple response with redirectUri (standard PayU flow)
    return res.status(200).json({
      success: true,
      redirectUri: payuResult.redirectUri,
      statusCode: payuResult.statusCode,
      orderId: payuResult.orderId,
    });

  } catch (error) {
    console.error('[PAYU-CREATE] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'PayU order creation failed'
    });
  }
}