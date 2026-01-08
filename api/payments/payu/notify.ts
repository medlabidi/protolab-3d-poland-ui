import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPayUSignature, PayUNotification } from '../../_lib/payu';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get signature from header
    const signature = req.headers['openpayu-signature'] as string | undefined;
    const body = JSON.stringify(req.body);

    console.log('[PAYU-NOTIFY] Received notification:', {
      hasSignature: !!signature,
      signature: signature?.substring(0, 20) + '...',
      bodyLength: body.length,
      orderId: req.body?.order?.orderId,
      extOrderId: req.body?.order?.extOrderId,
    });

    // Verify signature
    if (!verifyPayUSignature(body, signature)) {
      console.error('[PAYU-NOTIFY] Signature verification failed:', {
        receivedSignature: signature,
        bodyPreview: body.substring(0, 200),
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const notification: PayUNotification = req.body;
    const { order } = notification;

    console.log('PayU notification received:', {
      orderId: order.orderId,
      extOrderId: order.extOrderId,
      status: order.status,
      amount: order.totalAmount,
    });

    // Update order status based on PayU status
    let orderStatus: string;
    let paymentStatus: string;

    switch (order.status) {
      case 'COMPLETED':
        orderStatus = 'in_queue'; // Order is paid, ready for processing
        paymentStatus = 'paid'; // Use 'paid' consistently
        break;
      case 'CANCELED':
        orderStatus = 'suspended'; // Use valid status value
        paymentStatus = 'failed';
        break;
      case 'WAITING_FOR_CONFIRMATION':
      case 'PENDING':
        orderStatus = 'submitted'; // Use valid status value (not 'pending')
        paymentStatus = 'pending';
        break;
      default:
        console.warn(`[PAYU-NOTIFY] Unknown PayU status: ${order.status}, defaulting to submitted/pending`);
        orderStatus = 'submitted'; // Use valid status value
        paymentStatus = 'pending';
    }

    // Update order in database
    if (order.extOrderId) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: orderStatus,
          payu_order_id: order.orderId,
        })
        .eq('id', order.extOrderId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        return res.status(500).json({ error: 'Failed to update order' });
      }

      // If payment completed, check if this is a credits purchase
      if (order.status === 'COMPLETED') {
        // Get order details to check type
        const { data: orderData } = await supabase
          .from('orders')
          .select('order_type, credits_amount')
          .eq('id', order.extOrderId)
          .single();

        if (orderData?.order_type === 'credits_purchase') {
          await handleCreditsPayment(order, orderData.credits_amount);
        }
      }

      console.log(`Order ${order.extOrderId} updated: status=${orderStatus}, payment=${paymentStatus}`);
    }

    // PayU requires empty 200 response
    return res.status(200).send('');
  } catch (error) {
    console.error('PayU notification error:', error);
    return res.status(500).json({ 
      error: 'Failed to process notification',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle store credits payment completion
 */
async function handleCreditsPayment(order: PayUNotification['order'], creditsAmount: number) {
  try {
    if (!creditsAmount || creditsAmount <= 0) {
      console.error('Invalid credits amount');
      return;
    }

    // Get user ID from order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', order.extOrderId)
      .single();

    if (orderError || !orderData) {
      console.error('Could not find order:', orderError);
      return;
    }

    const userId = orderData.user_id;

    // Get current balance
    const { data: creditData } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = creditData?.balance || 0;
    const newBalance = currentBalance + creditsAmount;

    // Update balance
    const { error: updateError } = await supabase
      .from('credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Failed to update credits balance:', updateError);
      return;
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('credits_transactions')
      .insert({
        user_id: userId,
        amount: creditsAmount,
        type: 'purchase',
        description: `Store credit purchase via PayU - Order ${order.extOrderId}`,
        payu_order_id: order.orderId,
        created_at: new Date().toISOString(),
      });

    if (txError) {
      console.error('Failed to create transaction record:', txError);
    }

    console.log(`Credits added for user ${userId}: ${creditsAmount} PLN (new balance: ${newBalance})`);
  } catch (error) {
    console.error('Error handling credits payment:', error);
  }
}
