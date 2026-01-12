import { getSupabase } from '../config/database';

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topMaterials: { material: string; count: number; revenue: number }[];
  refundStats: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
}

export class AnalyticsService {
  /**
   * Get analytics data for a specific date range
   */
  async getAnalytics(startDate?: string, endDate?: string): Promise<AnalyticsData> {
    const supabase = getSupabase();
    
    // Default to last 30 days if no date range provided
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Get all orders in date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    // Calculate total revenue and orders
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.price || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by day
    const revenueByDay = this.calculateRevenueByDay(orders || []);

    // Orders by status
    const ordersByStatus = this.calculateOrdersByStatus(orders || []);

    // Top materials
    const topMaterials = this.calculateTopMaterials(orders || []);

    // Refund stats
    const refundStats = this.calculateRefundStats(orders || []);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByDay,
      ordersByStatus,
      topMaterials,
      refundStats,
    };
  }

  private calculateRevenueByDay(orders: any[]): { date: string; revenue: number; orders: number }[] {
    const dailyData: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.price || 0;
      dailyData[date].orders += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateOrdersByStatus(orders: any[]): { status: string; count: number }[] {
    const statusCount: { [key: string]: number } = {};

    orders.forEach(order => {
      const status = order.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateTopMaterials(orders: any[]): { material: string; count: number; revenue: number }[] {
    const materialData: { [key: string]: { count: number; revenue: number } } = {};

    orders.forEach(order => {
      const material = order.material || 'unknown';
      if (!materialData[material]) {
        materialData[material] = { count: 0, revenue: 0 };
      }
      materialData[material].count += order.quantity || 1;
      materialData[material].revenue += order.price || 0;
    });

    return Object.entries(materialData)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 materials
  }

  private calculateRefundStats(orders: any[]): {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  } {
    const refundOrders = orders.filter(o => 
      o.payment_status === 'refunding' || 
      o.payment_status === 'refunded' ||
      o.status === 'refund_requested'
    );

    const pending = refundOrders.filter(o => 
      o.payment_status === 'refunding' || 
      o.status === 'refund_requested'
    ).length;

    const completed = refundOrders.filter(o => 
      o.payment_status === 'refunded'
    ).length;

    const totalAmount = refundOrders.reduce((sum, order) => sum + (order.price || 0), 0);

    return {
      total: refundOrders.length,
      pending,
      completed,
      totalAmount,
    };
  }
}

export const analyticsService = new AnalyticsService();
