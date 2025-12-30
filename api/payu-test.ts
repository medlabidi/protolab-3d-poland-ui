/**
 * PayU SANDBOX Connection Test Endpoint
 * 
 * This is a TEMPORARY testing endpoint to verify PayU sandbox integration.
 * Uses secure.snd.payu.com (sandbox) for testing.
 * 
 * Tests:
 * 1. OAuth authentication with sandbox
 * 2. Order creation via sandbox API
 * 3. Returns redirectUri for payment
 * 
 * DELETE THIS FILE AFTER TESTING IS COMPLETE
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// PayU SANDBOX Configuration - Using PUBLIC TEST CREDENTIALS
// Source: https://developers.payu.com/en/overview.html#testing
const PAYU_SANDBOX_CONFIG = {
  // Public POS - PLN (for testing)
  clientId: '300746',
  clientSecret: '2ee86a66e5d97e3fadc400c9f19b065d',
  posId: '300746',
  md5Key: 'b6ca15b0d1020e8094d9b5f8d163db54',
  baseUrl: 'https://secure.snd.payu.com', // SANDBOX URL
  // Hardcoded URLs for testing
  notifyUrl: 'https://protolab-3d-poland-ui.vercel.app/api/payu-notify-test',
  continueUrl: 'https://protolab-3d-poland-ui.vercel.app/payment-test-success',
};

interface PayUAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  grant_type: string;
}

interface PayUOrderResponse {
  status: {
    statusCode: string;
    statusDesc?: string;
  };
  redirectUri?: string;
  orderId: string;
  extOrderId?: string;
}

/**
 * Step 1: Authenticate with PayU Sandbox OAuth
 */
async function authenticatePayUSandbox(): Promise<{
  success: boolean;
  token?: string;
  response?: any;
  error?: string;
}> {
  try {
    console.log('🔐 [PAYU-TEST] Authenticating with PayU SANDBOX...');
    console.log('🔐 [PAYU-TEST] Base URL:', PAYU_SANDBOX_CONFIG.baseUrl);
    console.log('🔐 [PAYU-TEST] Client ID:', PAYU_SANDBOX_CONFIG.clientId);
    
    const response = await fetch(`${PAYU_SANDBOX_CONFIG.baseUrl}/pl/standard/user/oauth/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: PAYU_SANDBOX_CONFIG.clientId,
        client_secret: PAYU_SANDBOX_CONFIG.clientSecret,
      }),
    });

    const responseText = await response.text();
    console.log('🔐 [PAYU-TEST] OAuth Response Status:', response.status);
    console.log('🔐 [PAYU-TEST] OAuth Response:', responseText);

    if (!response.ok) {
      return {
        success: false,
        error: `Authentication failed: ${response.status} ${responseText}`,
        response: {
          status: response.status,
          body: responseText,
        },
      };
    }

    const data = JSON.parse(responseText) as PayUAuthResponse;

    console.log('✅ [PAYU-TEST] Authentication successful!');
    console.log('✅ [PAYU-TEST] Token type:', data.token_type);
    console.log('✅ [PAYU-TEST] Expires in:', data.expires_in, 'seconds');

    return {
      success: true,
      token: data.access_token,
      response: {
        status: response.status,
        token_type: data.token_type,
        expires_in: data.expires_in,
      },
    };
  } catch (error) {
    console.error('❌ [PAYU-TEST] Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Step 2: Create test order with PayU Sandbox
 */
async function createTestOrder(token: string): Promise<{
  success: boolean;
  orderId?: string;
  redirectUri?: string;
  response?: any;
  error?: string;
}> {
  try {
    console.log('📦 [PAYU-TEST] Creating test order in SANDBOX...');

    const testOrderId = `TEST-${Date.now()}`;
    const orderPayload = {
      customerIp: '127.0.0.1',
      merchantPosId: PAYU_SANDBOX_CONFIG.posId,
      description: 'PayU SANDBOX Connection Test',
      currencyCode: 'PLN',
      totalAmount: '1000', // 10.00 PLN in grosz
      extOrderId: testOrderId,
      products: [
        {
          name: 'Test Payment - SANDBOX',
          unitPrice: '1000', // 10.00 PLN in grosz
          quantity: '1',
        },
      ],
      buyer: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        language: 'pl',
      },
      notifyUrl: PAYU_SANDBOX_CONFIG.notifyUrl,
      continueUrl: PAYU_SANDBOX_CONFIG.continueUrl,
    };

    console.log('📦 [PAYU-TEST] Order payload:', JSON.stringify(orderPayload, null, 2));

    // Try with fetch but ensure we're following REST API v2.1 spec exactly
    const response = await fetch(`${PAYU_SANDBOX_CONFIG.baseUrl}/api/v2_1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderPayload),
      redirect: 'manual', // Don't follow redirects
    });

    const responseText = await response.text();
    console.log('📦 [PAYU-TEST] Order Response Status:', response.status);
    console.log('📦 [PAYU-TEST] Order Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    
    // PayU returns HTTP 302 redirect for successful orders
    if (response.status === 302) {
      const redirectUri = response.headers.get('Location');
      console.log('✅ [PAYU-TEST] Order created successfully!');
      console.log('✅ [PAYU-TEST] Got 302 redirect to payment page');
      console.log('✅ [PAYU-TEST] Redirect URI:', redirectUri);
      
      return {
        success: true,
        redirectUri: redirectUri || undefined,
        response: {
          status: 302,
          statusCode: 'SUCCESS',
          redirectUri: redirectUri || undefined,
        },
      };
    }
    
    console.log('📦 [PAYU-TEST] Order Response (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok && response.status !== 302) {
      return {
        success: false,
        error: `Order creation failed: ${response.status} ${responseText.substring(0, 200)}`,
        response: {
          status: response.status,
          body: responseText.substring(0, 500),
          isHtml: responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html'),
        },
      };
    }

    // Try to parse JSON, if it fails, it might be HTML
    let data: PayUOrderResponse;
    try {
      data = JSON.parse(responseText) as PayUOrderResponse;
    } catch (parseError) {
      console.error('📦 [PAYU-TEST] Failed to parse response as JSON');
      console.error('📦 [PAYU-TEST] Response starts with:', responseText.substring(0, 100));
      return {
        success: false,
        error: `Invalid response format (got HTML instead of JSON). Status: ${response.status}`,
        response: {
          status: response.status,
          body: responseText.substring(0, 500),
          isHtml: true,
        },
      };
    }

    console.log('✅ [PAYU-TEST] Order created successfully!');
    console.log('✅ [PAYU-TEST] PayU Order ID:', data.orderId);
    console.log('✅ [PAYU-TEST] Status Code:', data.status.statusCode);
    console.log('✅ [PAYU-TEST] Redirect URI:', data.redirectUri);

    return {
      success: true,
      orderId: data.orderId,
      redirectUri: data.redirectUri,
      response: {
        status: response.status,
        statusCode: data.status.statusCode,
        statusDesc: data.status.statusDesc,
        orderId: data.orderId,
        extOrderId: data.extOrderId,
        redirectUri: data.redirectUri,
      },
    };
  } catch (error) {
    console.error('❌ [PAYU-TEST] Order creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main test endpoint handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 STARTING PAYU SANDBOX CONNECTION TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Authenticate
    const authResult = await authenticatePayUSandbox();
    
    if (!authResult.success || !authResult.token) {
      console.log('');
      console.log('❌ TEST FAILED: Authentication');
      console.log('═══════════════════════════════════════════════════════════');
      return res.status(500).json({
        success: false,
        step: 'authentication',
        error: authResult.error,
        details: authResult.response,
      });
    }

    console.log('');
    console.log('✅ STEP 1/2: Authentication PASSED');
    console.log('');

    // Step 2: Create Order
    const orderResult = await createTestOrder(authResult.token);

    if (!orderResult.success) {
      console.log('');
      console.log('❌ TEST FAILED: Order Creation');
      console.log('═══════════════════════════════════════════════════════════');
      return res.status(500).json({
        success: false,
        step: 'order_creation',
        authentication: {
          success: true,
          details: authResult.response,
        },
        error: orderResult.error,
        details: orderResult.response,
      });
    }

    console.log('');
    console.log('✅ STEP 2/2: Order Creation PASSED');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Next step: Complete payment in browser using redirectUri');
    console.log('PayU will send notification to:', PAYU_SANDBOX_CONFIG.notifyUrl);
    console.log('');

    return res.status(200).json({
      success: true,
      message: 'PayU SANDBOX connection test successful!',
      steps: {
        authentication: {
          success: true,
          ...authResult.response,
        },
        orderCreation: {
          success: true,
          ...orderResult.response,
        },
      },
      paymentUrl: orderResult.redirectUri,
      instructions: [
        'Open the paymentUrl in your browser',
        'Complete the payment in PayU SANDBOX',
        'PayU will send notification to /api/payu-notify-test',
        'Check server logs for notification',
      ],
    });
  } catch (error) {
    console.error('❌ [PAYU-TEST] Unexpected error:', error);
    console.log('═══════════════════════════════════════════════════════════');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
