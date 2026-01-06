import { getSupabase } from '../config/database';

export type OrderStatus = 
  | 'submitted' 
  | 'in_queue' 
  | 'printing' 
  | 'finished' 
  | 'delivered'
  | 'on_hold'
  | 'suspended';

export type PaymentStatus = 
  | 'paid'
  | 'on_hold'
  | 'refunding'
  | 'refunded';

export type ShippingMethod = 'pickup' | 'inpost' | 'dpd' | 'courier';

export type OrderType = 'print' | 'design';

export interface IOrder {
  id: string;
  user_id: string;
  order_type: OrderType;
  file_url: string;
  file_path?: string;
  file_name: string;
  material: string;
  color: string;
  layer_height: number;
  infill: number;
  quantity: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  paid_amount: number;
  material_weight?: number;
  print_time?: number;
  price: number;
  shipping_method: ShippingMethod;
  shipping_address?: string;
  review?: string;
  tracking_code?: string;
  project_name?: string;
  design_description?: string;
  design_requirements?: string;
  reference_images?: string[];
  parent_order_id?: string;
  is_archived?: boolean;
  deleted_at?: string | null;
  created_at: string;
}

export type CreateOrderData = Omit<IOrder, 'id' | 'created_at'>;
export type UpdateOrderData = Partial<Omit<IOrder, 'id' | 'created_at' | 'user_id'>>;

export class Order {
  static async create(data: CreateOrderData): Promise<IOrder> {
    const supabase = getSupabase();
    const { data: order, error } = await supabase
      .from('orders')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create order: ${error.message}`);
    return order;
  }

  static async findById(id: string): Promise<IOrder | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to find order: ${error.message}`);
    }
    
    return data;
  }

  static async findByUserId(userId: string): Promise<IOrder[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to find orders: ${error.message}`);
    return data || [];
  }

  static async findByUserIdFiltered(
    userId: string, 
    filter: 'active' | 'archived' | 'deleted'
  ): Promise<IOrder[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (filter === 'active') {
      // Active orders: not archived and not deleted
      query = query.eq('is_archived', false).is('deleted_at', null);
    } else if (filter === 'archived') {
      // Archived orders: archived but not deleted
      query = query.eq('is_archived', true).is('deleted_at', null);
    } else if (filter === 'deleted') {
      // Deleted orders: has deleted_at timestamp
      query = query.not('deleted_at', 'is', null);
    }

    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw new Error(`Failed to find orders: ${error.message}`);
    return data || [];
  }

  static async find(filter: Partial<IOrder> = {}): Promise<IOrder[]> {
    const supabase = getSupabase();
    let query = supabase.from('orders').select('*');
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to find orders: ${error.message}`);
    return data || [];
  }

  static async findByType(orderType: OrderType): Promise<IOrder[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', orderType)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to find orders by type: ${error.message}`);
    return data || [];
  }

  static async updateById(id: string, data: UpdateOrderData): Promise<IOrder> {
    const supabase = getSupabase();
    const { data: order, error } = await supabase
      .from('orders')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update order: ${error.message}`);
    return order;
  }

  static async deleteById(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete order: ${error.message}`);
  }

  static async countByStatus(status: OrderStatus): Promise<number> {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    if (error) throw new Error(`Failed to count orders: ${error.message}`);
    return count || 0;
  }
}