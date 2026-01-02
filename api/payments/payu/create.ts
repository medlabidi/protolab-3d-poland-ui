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

  const data = await response.json();
  console.log('[PAYU-CREATE] Authentication successful');
  return data.access_token;
}

/**
 * Create PayU order
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
  });

  console.log('[PAYU-CREATE] PayU response status:', response.status);
  console.log('[PAYU-CREATE] PayU response URL:', response.url);
  
  // PayU returns 302 for successful order creation with redirectUri in Location header
  if (response.status === 302) {
    const redirectUri = response.headers.get('location');
    console.log('[PAYU-CREATE] Order created successfully, redirect to:', redirectUri);
    return {
      success: true,
      redirectUri: redirectUri,
      statusCode: 'SUCCESS'
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PAYU-CREATE] Order creation failed:', response.status, errorText);
    throw new Error(`PayU order creation failed: ${response.status} ${errorText}`);
  }

  // Check content type to determine how to parse the response
  const contentType = response.headers.get('content-type');
  console.log('[PAYU-CREATE] Response content-type:', contentType);
  
  if (contentType && contentType.includes('application/json')) {
    const result = await response.json();
    console.log('[PAYU-CREATE] Order created:', result);
    return result;
  } else {
    // PayU returned HTML - this IS the payment page
    const htmlContent = await response.text();
    console.log('[PAYU-CREATE] Received HTML payment page from PayU');
    
    // Fix relative URLs in PayU HTML to be absolute
    let fixedHtml = htmlContent;
    
    console.log('[PAYU-CREATE] Original HTML length:', htmlContent.length);
    console.log('[PAYU-CREATE] Sample HTML content:', htmlContent.substring(0, 500));
    
    // Convert ALL relative paths to absolute PayU URLs - more comprehensive approach
    fixedHtml = fixedHtml.replace(
      /href=(["'])\/([^"']+)\1/g,
      'href=$1https://secure.snd.payu.com/$2$1'
    );
    fixedHtml = fixedHtml.replace(
      /src=(["'])\/([^"']+)\1/g, 
      'src=$1https://secure.snd.payu.com/$2$1'
    );
    fixedHtml = fixedHtml.replace(
      /action=(["'])\/([^"']+)\1/g,
      'action=$1https://secure.snd.payu.com/$2$1'
    );
    
    // Also fix any remaining relative paths that might not have quotes
    fixedHtml = fixedHtml.replace(
      /url\(\/([^)]+)\)/g,
      'url(https://secure.snd.payu.com/$1)'
    );
    
    console.log('[PAYU-CREATE] Fixed HTML asset URLs for PayU');
    console.log('[PAYU-CREATE] Fixed HTML length:', fixedHtml.length);
    
    // Return the fixed HTML content for the frontend to display
    return {
      success: true,
      isHtml: true,
      htmlContent: fixedHtml,
      statusCode: 'SUCCESS'
    };
  }
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
    const orderPayload = {
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

    // Add payment method if specified (for BLIK, cards, etc.)
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

    console.log('[PAYU-CREATE] Success! Returning redirect URI');

    // Return response
    return res.status(200).json({
      success: true,
      redirectUri: payuResult.redirectUri,
      statusCode: payuResult.statusCode,
      orderId: payuResult.orderId || 'created',
      isHtml: payuResult.isHtml || false,
      htmlContent: payuResult.htmlContent || null,
    });

  } catch (error) {
    console.error('[PAYU-CREATE] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'PayU order creation failed'
    });
  }
}