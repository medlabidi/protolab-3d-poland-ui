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
    const result: any = await response.json();
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
  console.error('[PAYU-CREATE] Failed request payload:', JSON.stringify(orderData, null, 2));
  
  // Try to parse error details
  try {
    const errorJson = JSON.parse(errorText);
    console.error('[PAYU-CREATE] PayU error details:', JSON.stringify(errorJson, null, 2));
    throw new Error(`PayU error: ${errorJson.status?.statusDesc || errorJson.message || errorText}`);
  } catch (e) {
    throw new Error(`PayU order creation failed: ${response.status} - ${errorText}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[PAYU-CREATE] Starting PayU order creation...');
    const { 
      orderId, 
      amount, 
      description, 
      userId, 
      payMethods,
      shippingAddress,
      requestInvoice,
      businessInfo
    } = req.body;
    console.log('[PAYU-CREATE] Request body:', { 
      orderId, 
      amount, 
      description, 
      userId, 
      payMethods,
      shippingAddress,
      requestInvoice,
      businessInfo
    });

    if (!orderId || !amount || !description || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, amount, description, userId' 
      });
    }

    // Get user details
    console.log('[PAYU-CREATE] Fetching user details...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, first_name, last_name, phone')
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

    // Use first_name and last_name directly from database
    const firstName = userData.first_name || 'Customer';
    const lastName = userData.last_name || firstName;

    // Get phone from user profile or shipping address and format for PayU
    let phone = userData.phone || shippingAddress?.phone || '';
    // Ensure phone is in international format (+48XXXXXXXXX) if provided
    if (phone && !phone.startsWith('+')) {
      phone = '+48' + phone.replace(/\D/g, ''); // Remove non-digits and add +48
    }
    // Validate phone format (must be +48 followed by 9 digits)
    if (phone && !phone.match(/^\+48\d{9}$/)) {
      console.warn('[PAYU-CREATE] Invalid phone format, removing:', phone);
      phone = ''; // Remove invalid phone
    }

    // Step 1: Authenticate with PayU
    const token = await getPayUToken();

    // Step 2: Prepare buyer object with full data
    const buyer: any = {
      email: userData.email,
      firstName,
      lastName,
      language: 'pl',
    };

    // Add phone if available
    if (phone) {
      buyer.phone = phone;
    }

    // Add delivery address for courier/DPD delivery - only if we have complete data
    if (shippingAddress && shippingAddress.street && shippingAddress.city) {
      const postalCode = shippingAddress.postalCode || shippingAddress.postal_code || '';
      
      // Only add delivery if all required fields are present
      if (postalCode) {
        buyer.delivery = {
          street: shippingAddress.street,
          postalCode: postalCode,
          city: shippingAddress.city,
          countryCode: 'PL',
        };
        
        // Add recipient info if available
        if (shippingAddress.fullName) {
          buyer.delivery.recipientName = shippingAddress.fullName;
          buyer.delivery.recipientEmail = userData.email;
          
          // Format and validate recipient phone
          if (shippingAddress.phone) {
            let recipientPhone = shippingAddress.phone;
            if (!recipientPhone.startsWith('+')) {
              recipientPhone = '+48' + recipientPhone.replace(/\D/g, '');
            }
            if (recipientPhone.match(/^\+48\d{9}$/)) {
              buyer.delivery.recipientPhone = recipientPhone;
            }
          }
        }
      }
    }

    // Step 3: Prepare order payload
    const orderPayload: any = {
      customerIp,
      merchantPosId: PAYU_CONFIG.posId,
      description,
      currencyCode: 'PLN',
      totalAmount: Math.round(parseFloat(amount) * 100).toString(), // Convert to grosz, round to avoid floating point issues
      extOrderId: orderId,
      products: [
        {
          name: description,
          unitPrice: Math.round(parseFloat(amount) * 100).toString(),
          quantity: '1',
        },
      ],
      buyer,
      notifyUrl: `https://protolab.info/api/payments/payu/notify`,
      continueUrl: `https://protolab.info/payment-success?orderId=${orderId}`,
    };
    
    // Add payMethods if provided
    if (payMethods) {
      orderPayload.payMethods = payMethods;
    }

    console.log('[PAYU-CREATE] Order payload:', JSON.stringify(orderPayload, null, 2));

    // Step 3: Create PayU order
    const payuResult = await createPayUOrder(token, orderPayload);
    
    // Step 4: Update database - set to 'pending' until webhook confirms payment
    const updateData: any = { 
      payment_status: 'pending', // Will be updated to 'paid' by webhook when COMPLETED
      payment_method: payMethods?.payMethod?.value || 'redirect',
    };

    // Add invoice info if requested
    if (requestInvoice && businessInfo) {
      updateData.invoice_required = true;
      updateData.invoice_business_info = JSON.stringify(businessInfo);
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[PAYU-CREATE] Database update failed:', updateError);
      // Continue anyway, PayU order was created successfully
    }

    console.log('========== PAYU CREATE ORDER - RESPONSE ==========');
    console.log('Full PayU Result:', JSON.stringify(payuResult, null, 2));
    console.log('Parsed fields:', {
      status: payuResult.status,
      statusCode: payuResult.statusCode,
      statusDesc: payuResult.statusDesc,
      redirectUri: payuResult.redirectUri,
      orderId: payuResult.orderId,
      iframeAllowed: payuResult.iframeAllowed
    });
    console.log('===============================================');

    // Extract orderId from redirect URL if not provided directly
    let finalOrderId = payuResult.orderId;
    if (!finalOrderId && payuResult.redirectUri) {
      const match = payuResult.redirectUri.match(/orderId=([^&]+)/);
      if (match) {
        finalOrderId = match[1];
        console.log('[PAYU-CREATE] Extracted orderId from redirectUri:', finalOrderId);
      }
    }

    // Return full PayU response including status (needed for BLIK)
    return res.status(200).json({
      success: true,
      redirectUri: payuResult.redirectUri,
      status: payuResult.status || payuResult.statusCode, // Fallback to statusCode if status is undefined
      statusDesc: payuResult.statusDesc,
      statusCode: payuResult.statusCode,
      orderId: finalOrderId,
    });

  } catch (error) {
    console.error('[PAYU-CREATE] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'PayU order creation failed'
    });
  }
}