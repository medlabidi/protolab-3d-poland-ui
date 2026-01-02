import { Request, Response } from 'express';
import { getSupabase } from '../config/database';

export const adminBusinessController = {
  // Get all business customers with their order statistics
  async getBusinesses(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return res.status(500).json({ error: 'Failed to fetch businesses' });
      }

      // Get order statistics for each user
      const businessesWithStats = await Promise.all(
        users.map(async (user: any) => {
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('price')
            .eq('user_id', user.id);

          if (ordersError) {
            console.error(`Error fetching orders for user ${user.id}:`, ordersError);
            return {
              ...user,
              orderCount: 0,
              totalSpent: 0,
            };
          }

          const orderCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum: number, order: any) => sum + (order.price || 0), 0) || 0;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            city: user.city,
            zip_code: user.zip_code,
            country: user.country,
            created_at: user.created_at,
            orderCount,
            totalSpent,
          };
        })
      );

      res.json(businessesWithStats);
    } catch (error) {
      console.error('Error in getBusinesses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get invoice history for a specific business
  async getBusinessInvoices(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get all orders for the user (these serve as invoices)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, price, status, created_at, payment_status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return res.status(500).json({ error: 'Failed to fetch invoices' });
      }

      // Transform orders to invoice format
      const invoices = orders.map((order: any) => ({
        id: order.id,
        order_id: order.id,
        order_number: order.order_number || order.id.substring(0, 8),
        amount: order.price || 0,
        status: order.payment_status || 'pending',
        created_at: order.created_at,
      }));

      res.json(invoices);
    } catch (error) {
      console.error('Error in getBusinessInvoices:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update business (user) information
  async updateBusiness(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { userId } = req.params;
      const { name, email, phone, address, city, zip_code, country } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if email is already taken by another user
      if (email) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', userId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking email:', checkError);
          return res.status(500).json({ error: 'Failed to validate email' });
        }

        if (existingUser) {
          return res.status(400).json({ error: 'Email is already taken' });
        }
      }

      // Update user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name,
          email,
          phone: phone || null,
          address: address || null,
          city: city || null,
          zip_code: zip_code || null,
          country: country || null,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({ error: 'Failed to update business information' });
      }

      res.json({ 
        message: 'Business information updated successfully',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error in updateBusiness:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
