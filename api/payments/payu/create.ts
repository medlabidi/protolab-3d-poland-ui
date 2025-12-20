import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPayUOrder } from '../../_lib/payu';
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
    const { orderId, amount, description, userId } = req.body;

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
    });

    // Store PayU order ID in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payu_order_id: payuResult.payuOrderId,
        payment_status: 'pending',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order with PayU ID:', updateError);
      // Continue anyway - payment URL is more important
    }

    return res.status(200).json({
      success: true,
      redirectUri: payuResult.redirectUri,
      payuOrderId: payuResult.payuOrderId,
    });
  } catch (error) {
    console.error('PayU payment creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
