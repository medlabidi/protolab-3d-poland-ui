import { getSupabase } from '../config/database';

export type PrintJobStatus = 
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

export interface IPrintJob {
  id: string;
  user_id: string;
  
  // File information
  file_url: string;
  file_path?: string;
  file_name: string;
  
  // Print specifications
  material: string;
  color: string;
  layer_height: number;
  infill: number;
  quantity: number;
  
  // Calculated values
  material_weight?: number;
  print_time?: number;
  
  // Pricing
  price: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  
  // Order status
  status: PrintJobStatus;
  
  // Shipping
  shipping_method: ShippingMethod;
  shipping_address?: string;
  tracking_code?: string;
  
  // Optional fields
  project_name?: string;
  review?: string;
  
  // Relationship
  parent_design_request_id?: string;
  
  // Metadata
  is_archived?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export type CreatePrintJobData = Omit<IPrintJob, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePrintJobData = Partial<Omit<IPrintJob, 'id' | 'created_at' | 'user_id'>>;

export class PrintJob {
  static async create(data: CreatePrintJobData): Promise<IPrintJob> {
    const supabase = getSupabase();
    const { data: printJob, error } = await supabase
      .from('print_jobs')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create print job: ${error.message}`);
    return printJob;
  }

  static async findById(id: string): Promise<IPrintJob | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find print job: ${error.message}`);
    }
    return data;
  }

  static async findByUserId(userId: string): Promise<IPrintJob[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to find print jobs: ${error.message}`);
    return data || [];
  }

  static async findAll(filters?: {
    status?: PrintJobStatus;
    userId?: string;
    includeArchived?: boolean;
  }): Promise<IPrintJob[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('print_jobs')
      .select('*, users(name, email)');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (!filters?.includeArchived) {
      query = query.eq('is_archived', false);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch print jobs: ${error.message}`);
    return data || [];
  }

  static async update(id: string, data: UpdatePrintJobData): Promise<IPrintJob> {
    const supabase = getSupabase();
    const { data: printJob, error } = await supabase
      .from('print_jobs')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update print job: ${error.message}`);
    return printJob;
  }

  static async updateStatus(id: string, status: PrintJobStatus): Promise<IPrintJob> {
    return this.update(id, { status });
  }

  static async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('print_jobs')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete print job: ${error.message}`);
  }

  static async softDelete(id: string): Promise<IPrintJob> {
    return this.update(id, { 
      is_archived: true, 
      deleted_at: new Date().toISOString() 
    });
  }

  static async getStatistics(userId?: string): Promise<{
    total: number;
    submitted: number;
    in_queue: number;
    printing: number;
    finished: number;
    delivered: number;
  }> {
    const supabase = getSupabase();
    let query = supabase
      .from('print_jobs')
      .select('status')
      .eq('is_archived', false);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(`Failed to get statistics: ${error.message}`);
    
    const stats = {
      total: data.length,
      submitted: data.filter(j => j.status === 'submitted').length,
      in_queue: data.filter(j => j.status === 'in_queue').length,
      printing: data.filter(j => j.status === 'printing').length,
      finished: data.filter(j => j.status === 'finished').length,
      delivered: data.filter(j => j.status === 'delivered').length,
    };
    
    return stats;
  }
}
