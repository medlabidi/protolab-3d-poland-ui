import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { verifyAccessToken, JWTPayload } from '../_lib/jwt';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  let decoded: JWTPayload;

  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check if user is admin
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  // Get user ID from query parameter
  const userId = req.query.id as string;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const supabase = getSupabase();

  try {
    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch orders statistics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Calculate statistics
    const totalOrders = orders?.length || 0;
    const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0;
    const pendingOrders = orders?.filter(o => o.payment_status === 'pending').length || 0;
    const failedOrders = orders?.filter(o => o.payment_status === 'failed').length || 0;
    const refundedOrders = orders?.filter(o => o.payment_status === 'refunded').length || 0;

    // Calculate total amounts
    const totalSpent = orders
      ?.filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.paid_amount || o.price || 0), 0) || 0;

    const pendingAmount = orders
      ?.filter(o => o.payment_status === 'pending')
      .reduce((sum, o) => sum + (o.price || 0), 0) || 0;

    // Get payment methods used
    const paymentMethods = orders
      ?.filter(o => o.payment_method)
      .map(o => o.payment_method)
      .filter((v, i, a) => a.indexOf(v) === i) || [];

    // Check if payment account exists
    const { data: paymentAccount, error: paymentError } = await supabase
      .from('user_payment_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Categorize user by payment behavior
    let paymentCategory = 'new';
    if (paidOrders === 0) {
      paymentCategory = 'no_purchases';
    } else if (paidOrders >= 10 && totalSpent >= 5000) {
      paymentCategory = 'premium';
    } else if (paidOrders >= 5 && totalSpent >= 2000) {
      paymentCategory = 'regular';
    } else if (paidOrders >= 1) {
      paymentCategory = 'occasional';
    }

    // Get recent orders
    const recentOrders = orders
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) || [];

    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      user,
      statistics: {
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          failed: failedOrders,
          refunded: refundedOrders,
        },
        amounts: {
          total_spent: totalSpent,
          pending_amount: pendingAmount,
          average_order: paidOrders > 0 ? (totalSpent / paidOrders) : 0,
        },
        payment: {
          methods_used: paymentMethods,
          has_payment_account: !!paymentAccount,
          payment_account_verified: paymentAccount?.verified || false,
          payment_account_type: paymentAccount?.account_type || null,
          category: paymentCategory,
        },
      },
      recent_orders: recentOrders,
      payment_history: payments || [],
      payment_account: paymentAccount || null,
    });

  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
