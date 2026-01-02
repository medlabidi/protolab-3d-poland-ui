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

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayU order
 */
async function createPayUOrder(token: string, orderData: any): Promise<any> {
  const response = await fetch(`${PAYU_CONFIG.baseUrl}/api/v2_1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  // PayU returns 302 for successful order creation
  if (response.status === 302) {
    return {
      success: true,
      redirectUri: response.headers.get('location'),
      statusCode: 'SUCCESS'
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayU order creation failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, amount, description, userId, payMethods } = req.body;

    if (!orderId || !amount || !description || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, amount, description, userId' 
      });
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get client IP
    const customerIp = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
      (req.headers['x-real-ip'] as string) || 
      '127.0.0.1';

    // Split full name into first and last name
    const nameParts = userData.full_name?.split(' ') || [];
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create PayU order
    const payuResult = await createPayUOrder({
      orderId: orderId,
      amount: parseFloat(amount),
      description: description,
      customerEmail: userData.email,
      customerIp: customerIp,
      products: [
        {
          name: description,
          unitPrice: parseFloat(amount),
          quantity: 1,
        },
      ],
      buyer: {
        firstName,
        lastName,
        language: 'pl',
      },
      payMethods: payMethods, // Include payment method selection
    });

    // Store PayU order ID in database (only for real orders, not credit purchases)
    if (!orderId.startsWith('credit_')) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payu_order_id: payuResult.payuOrderId,
          payment_status: 'pending',
          payment_method: payMethods?.payMethod?.value || 'redirect',
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order with PayU ID:', updateError);
        // Continue anyway - payment URL is more important
      }
    }

    return res.status(200).json({
      success: true,
      redirectUri: payuResult.redirectUri,
      payuOrderId: payuResult.payuOrderId,
      statusCode: payuResult.statusCode,
    });
  } catch (error) {
    console.error('PayU payment creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
