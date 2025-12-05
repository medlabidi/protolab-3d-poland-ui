import { Order, IOrder, OrderStatus, PaymentStatus } from '../models/Order';
import { OrderCreateInput } from '../types';
import { pricingService } from './pricing.service';
import { settingsService } from './settings.service';
import { getSupabase } from '../config/database';
import { conversationsService } from './conversations.service';
import { logger } from '../config/logger';

export class OrderService {
  async createOrder(userId: string, data: OrderCreateInput): Promise<IOrder> {
    // Use price from client calculation, or default to 0 if not provided
    const orderPrice = data.price || 0;
    
    const order = await Order.create({
      user_id: userId,
      file_name: data.fileName,
      file_url: data.fileUrl,
      material: data.material,
      color: data.color,
      layer_height: data.layerHeight,
      infill: data.infill,
      quantity: data.quantity,
      shipping_method: data.shippingMethod,
      shipping_address: data.shippingAddress,
      price: orderPrice,
      paid_amount: orderPrice,
      status: 'submitted',
      payment_status: 'paid',
      project_name: data.projectName,
    });
    
    // Auto-create conversation log for the order
    try {
      await conversationsService.getOrCreateConversation(
        userId, 
        order.id, 
        `Job conversation for ${data.fileName}`
      );
      logger.info(`Auto-created conversation for order ${order.id}`);
    } catch (err) {
      // Don't fail order creation if conversation creation fails
      logger.error({ err }, `Failed to auto-create conversation for order ${order.id}`);
    }
    
    return order;
  }
  
  async getOrderById(orderId: string, userId?: string): Promise<IOrder | null> {
    const supabase = getSupabase();
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('id', orderId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get order: ${error.message}`);
    }
    
    return data;
  }
  
  async getUserOrders(userId: string): Promise<IOrder[]> {
    return await Order.findByUserId(userId);
  }
  
  async getAllOrders(): Promise<IOrder[]> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get all orders: ${error.message}`);
    return data || [];
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder> {
    const order = await Order.updateById(orderId, { status });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }
  
  async updateOrderPricing(
    orderId: string,
    materialWeight?: number,
    printTime?: number
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const settings = await settingsService.getSettings();
    
    const updates: any = {};
    
    if (materialWeight !== undefined) {
      updates.material_weight = materialWeight;
    }
    
    if (printTime !== undefined) {
      updates.print_time = printTime;
    }
    
    const pricingResult = pricingService.calculatePrice({
      materialType: order.material,
      color: order.color,
      materialWeightGrams: (materialWeight ?? order.material_weight ?? 0) * 1000,
      printTimeHours: (printTime ?? order.print_time ?? 0) / 60,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    });
    
    updates.price = pricingResult.totalPrice;
    
    return await Order.updateById(orderId, updates);
  }
  
  async updateOrderTracking(orderId: string, trackingCode: string): Promise<IOrder> {
    const order = await Order.updateById(orderId, { tracking_code: trackingCode });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }
  
  async addReview(orderId: string, userId: string, review: string): Promise<IOrder> {
    const supabase = getSupabase();
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error || !order) {
      throw new Error('Order not found');
    }
    
    if (!['finished', 'delivered'].includes(order.status)) {
      throw new Error('Can only review finished or delivered orders');
    }
    
    return await Order.updateById(orderId, { review });
  }

  async updateOrder(orderId: string, userId: string, updates: {
    material?: string;
    color?: string;
    layer_height?: string;
    infill?: string;
    quantity?: number;
    shipping_method?: string;
    shipping_address?: string;
    price?: number;
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    paid_amount?: number;
    project_name?: string;
  }): Promise<IOrder> {
    const supabase = getSupabase();
    
    // Verify order belongs to user
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error || !order) {
      throw new Error('Order not found');
    }
    
    // Check status-based restrictions
    const status = order.status;
    const canEditPrintParams = ['submitted', 'in_queue'].includes(status);
    const canEditShipping = !['finished', 'delivered', 'suspended'].includes(status);
    
    // Filter out undefined values and only include allowed fields based on status
    const allowedUpdates: Record<string, unknown> = {};
    
    // Print parameters can only be edited if status is submitted or in_queue
    if (canEditPrintParams) {
      if (updates.material !== undefined) allowedUpdates.material = updates.material;
      if (updates.color !== undefined) allowedUpdates.color = updates.color;
      if (updates.layer_height !== undefined) allowedUpdates.layer_height = updates.layer_height;
      if (updates.infill !== undefined) allowedUpdates.infill = updates.infill;
      if (updates.quantity !== undefined) allowedUpdates.quantity = updates.quantity;
      if (updates.price !== undefined) allowedUpdates.price = updates.price;
    }
    
    // Shipping can be edited unless status is finished or delivered
    if (canEditShipping) {
      if (updates.shipping_method !== undefined) allowedUpdates.shipping_method = updates.shipping_method;
      if (updates.shipping_address !== undefined) allowedUpdates.shipping_address = updates.shipping_address;
    }
    
    // Project name can always be updated
    if (updates.project_name !== undefined) allowedUpdates.project_name = updates.project_name;
    
    // Status and payment fields can always be updated (system operations)
    if (updates.payment_status !== undefined) allowedUpdates.payment_status = updates.payment_status;
    if (updates.paid_amount !== undefined) allowedUpdates.paid_amount = updates.paid_amount;
    if (updates.status !== undefined) allowedUpdates.status = updates.status;
    
    // If no valid updates, throw error
    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }
    
    const updatedOrder = await Order.updateById(orderId, allowedUpdates);
    
    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }
    
    return updatedOrder;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, paidAmount?: number): Promise<IOrder> {
    const updates: Record<string, unknown> = { payment_status: paymentStatus };
    if (paidAmount !== undefined) {
      updates.paid_amount = paidAmount;
    }
    
    const order = await Order.updateById(orderId, updates);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async cancelOrder(orderId: string, userId: string): Promise<IOrder> {
    const supabase = getSupabase();
    
    // Verify order belongs to user
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error || !order) {
      throw new Error('Order not found');
    }
    
    // Only allow cancellation for orders that haven't started printing
    if (!['submitted', 'in_queue'].includes(order.status)) {
      throw new Error('This order cannot be cancelled');
    }
    
    // Update status to suspended and payment status to refunding
    const updatedOrder = await Order.updateById(orderId, {
      status: 'suspended',
      payment_status: 'refunding',
    });
    
    if (!updatedOrder) {
      throw new Error('Failed to cancel order');
    }
    
    return updatedOrder;
  }

  async processRefund(orderId: string, refundCompleted: boolean = true): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const updates: Record<string, unknown> = {
      payment_status: refundCompleted ? 'refunded' : 'refunding',
    };
    
    if (refundCompleted) {
      updates.paid_amount = 0;
    }
    
    const updatedOrder = await Order.updateById(orderId, updates);
    if (!updatedOrder) {
      throw new Error('Failed to process refund');
    }
    
    return updatedOrder;
  }
}

export const orderService = new OrderService();