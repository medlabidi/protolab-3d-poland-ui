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

    // Verify signature
    if (!verifyPayUSignature(body, signature)) {
      console.error('Invalid PayU signature');
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
        orderStatus = 'pending'; // Order is paid, awaiting processing
        paymentStatus = 'completed';
        break;
      case 'CANCELED':
        orderStatus = 'payment_failed';
        paymentStatus = 'failed';
        break;
      case 'WAITING_FOR_CONFIRMATION':
        orderStatus = 'pending';
        paymentStatus = 'pending';
        break;
      case 'PENDING':
        orderStatus = 'pending';
        paymentStatus = 'pending';
        break;
      default:
        orderStatus = 'pending';
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.extOrderId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        return res.status(500).json({ error: 'Failed to update order' });
      }

      // If payment completed, handle store credits
      if (order.status === 'COMPLETED' && order.description.includes('Store Credit')) {
        await handleCreditsPayment(order);
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
async function handleCreditsPayment(order: PayUNotification['order']) {
  try {
    // Parse amount from description (format: "Store Credit: XXX PLN")
    const amountMatch = order.description.match(/Store Credit:\s*([\d.]+)\s*PLN/);
    if (!amountMatch) {
      console.error('Could not parse credit amount from description');
      return;
    }

    const creditAmount = parseFloat(amountMatch[1]);

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
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = creditData?.balance || 0;
    const newBalance = currentBalance + creditAmount;

    // Update balance
    const { error: updateError } = await supabase
      .from('credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
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
        amount: creditAmount,
        type: 'purchase',
        description: `Store credit purchase via PayU - Order ${order.extOrderId}`,
        payu_order_id: order.orderId,
        created_at: new Date().toISOString(),
      });

    if (txError) {
      console.error('Failed to create transaction record:', txError);
    }

    console.log(`Credits added for user ${userId}: ${creditAmount} PLN (new balance: ${newBalance})`);
  } catch (error) {
    console.error('Error handling credits payment:', error);
  }
}
