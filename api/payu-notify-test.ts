/**
 * PayU SANDBOX Notification Test Endpoint
 * 
 * This is a TEMPORARY testing endpoint to verify PayU sandbox callbacks.
 * Receives notifications from secure.snd.payu.com (sandbox).
 * 
 * This endpoint:
 * 1. Receives PayU notification callbacks
 * 2. Logs the full notification payload
 * 3. Extracts and logs payment status
 * 4. Confirms notification was received
 * 
 * DELETE THIS FILE AFTER TESTING IS COMPLETE
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

interface PayUNotification {
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
    buyer?: {
      email: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      language?: string;
    };
    payMethod?: {
      type: string;
    };
    products: Array<{
      name: string;
      unitPrice: string;
      quantity: string;
    }>;
    status: string; // PENDING, COMPLETED, CANCELED, etc.
  };
  localReceiptDateTime?: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Main notification handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📬 PAYU SANDBOX NOTIFICATION RECEIVED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔗 Method:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('');

  if (req.method !== 'POST') {
    console.log('❌ Invalid method. Expected POST, got:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log headers
    console.log('📋 HEADERS:');
    console.log('-----------------------------------------------------------');
    Object.entries(req.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    // Log raw body
    console.log('📦 RAW BODY:');
    console.log('-----------------------------------------------------------');
    console.log(typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2));
    console.log('');

    // Parse notification
    let notification: PayUNotification;
    
    if (typeof req.body === 'string') {
      notification = JSON.parse(req.body);
    } else {
      notification = req.body;
    }

    // Log parsed notification
    console.log('📊 PARSED NOTIFICATION:');
    console.log('-----------------------------------------------------------');
    console.log('PayU Order ID:', notification.order.orderId);
    console.log('External Order ID:', notification.order.extOrderId);
    console.log('Status:', notification.order.status);
    console.log('Amount:', notification.order.totalAmount, notification.order.currencyCode);
    console.log('Description:', notification.order.description);
    console.log('Created:', notification.order.orderCreateDate);
    console.log('');

    if (notification.order.buyer) {
      console.log('👤 BUYER INFO:');
      console.log('-----------------------------------------------------------');
      console.log('Email:', notification.order.buyer.email);
      console.log('Name:', notification.order.buyer.firstName, notification.order.buyer.lastName);
      console.log('');
    }

    if (notification.order.payMethod) {
      console.log('💳 PAYMENT METHOD:');
      console.log('-----------------------------------------------------------');
      console.log('Type:', notification.order.payMethod.type);
      console.log('');
    }

    console.log('📦 PRODUCTS:');
    console.log('-----------------------------------------------------------');
    notification.order.products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     Price: ${product.unitPrice} × ${product.quantity}`);
    });
    console.log('');

    // Log status in big letters
    console.log('═══════════════════════════════════════════════════════════');
    switch (notification.order.status) {
      case 'COMPLETED':
        console.log('✅✅✅ PAYMENT COMPLETED ✅✅✅');
        break;
      case 'PENDING':
        console.log('⏳⏳⏳ PAYMENT PENDING ⏳⏳⏳');
        break;
      case 'WAITING_FOR_CONFIRMATION':
        console.log('⏳⏳⏳ WAITING FOR CONFIRMATION ⏳⏳⏳');
        break;
      case 'CANCELED':
        console.log('❌❌❌ PAYMENT CANCELED ❌❌❌');
        break;
      default:
        console.log(`📊📊📊 STATUS: ${notification.order.status} 📊📊📊`);
    }
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Log signature if present
    if (req.headers['openpayu-signature']) {
      console.log('🔐 SIGNATURE:');
      console.log('-----------------------------------------------------------');
      console.log(req.headers['openpayu-signature']);
      console.log('');
      console.log('Note: Signature verification should be implemented in production');
      console.log('');
    }

    // Return success response to PayU
    console.log('✅ Notification processed successfully');
    console.log('✅ Sending acknowledgment to PayU...');
    console.log('');

    return res.status(200).json({
      success: true,
      message: 'Notification received and logged',
      orderId: notification.order.orderId,
      status: notification.order.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('');
    console.error('❌❌❌ ERROR PROCESSING NOTIFICATION ❌❌❌');
    console.error('═══════════════════════════════════════════════════════════');
    console.error(error);
    console.error('');
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
