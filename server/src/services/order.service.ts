import { Order, IOrder, OrderStatus } from '../models/Order';
import { OrderCreateInput } from '../types';
import { pricingService } from './pricing.service';
import { settingsService } from './settings.service';
import { getSupabase } from '../config/database';

export class OrderService {
  async createOrder(userId: string, data: OrderCreateInput): Promise<IOrder> {
    const settings = await settingsService.getSettings();
    
    const estimatedPrice = pricingService.estimatePrice(
      settings.material_rate,
      settings.time_rate,
      settings.service_fee
    );
    
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
      price: estimatedPrice,
      status: 'submitted',
    });
    
    return order;
  }
  
  async getOrderById(orderId: string, userId?: string): Promise<IOrder | null> {
    const supabase = getSupabase();
    
    let query = supabase
      .from('orders')
      .select('*, users(name, email)')
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
    
    updates.price = pricingService.calculatePrice({
      materialWeight: materialWeight ?? order.material_weight,
      printTime: printTime ?? order.print_time,
      materialRate: settings.material_rate,
      timeRate: settings.time_rate,
      serviceFee: settings.service_fee,
    });
    
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
}

export const orderService = new OrderService();