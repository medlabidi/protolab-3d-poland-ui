import { Order, IOrder, OrderStatus } from '../models/Order';
import { User } from '../models/User';
import { OrderCreateInput } from '../types';
import { pricingService } from './pricing.service';
import { settingsService } from './settings.service';
import mongoose from 'mongoose';

export class OrderService {
  async createOrder(userId: string, data: OrderCreateInput): Promise<IOrder> {
    const settings = await settingsService.getSettings();
    
    const estimatedPrice = pricingService.estimatePrice(
      settings.materialRate,
      settings.timeRate,
      settings.serviceFee
    );
    
    const order = await Order.create({
      userId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      material: data.material,
      color: data.color,
      layerHeight: data.layerHeight,
      infill: data.infill,
      quantity: data.quantity,
      shippingMethod: data.shippingMethod,
      price: estimatedPrice,
      status: 'submitted',
    });
    
    await User.findByIdAndUpdate(userId, {
      $push: { orders: order._id },
    });
    
    return order;
  }
  
  async getOrderById(orderId: string, userId?: string): Promise<IOrder | null> {
    const query: any = { _id: orderId };
    
    if (userId) {
      query.userId = userId;
    }
    
    return await Order.findOne(query).populate('userId', 'name email');
  }
  
  async getUserOrders(userId: string): Promise<IOrder[]> {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  }
  
  async getAllOrders(): Promise<IOrder[]> {
    return await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder> {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    
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
    
    if (materialWeight !== undefined) {
      order.materialWeight = materialWeight;
    }
    
    if (printTime !== undefined) {
      order.printTime = printTime;
    }
    
    order.price = pricingService.calculatePrice({
      materialWeight: order.materialWeight,
      printTime: order.printTime,
      materialRate: settings.materialRate,
      timeRate: settings.timeRate,
      serviceFee: settings.serviceFee,
    });
    
    await order.save();
    
    return order;
  }
  
  async updateOrderTracking(orderId: string, trackingCode: string): Promise<IOrder> {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { trackingCode } },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }
  
  async addReview(orderId: string, userId: string, review: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (!['finished', 'delivered'].includes(order.status)) {
      throw new Error('Can only review finished or delivered orders');
    }
    
    order.review = review;
    await order.save();
    
    return order;
  }
}

export const orderService = new OrderService();