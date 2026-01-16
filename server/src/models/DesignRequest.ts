import { getSupabase } from '../config/database';

export type DesignStatus = 
  | 'pending'
  | 'in_review'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type UsageType = 
  | 'mechanical'
  | 'decorative'
  | 'functional'
  | 'prototype'
  | 'other';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'on_hold'
  | 'refunded';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export interface IDesignRequest {
  id: string;
  user_id: string;
  
  // Request information
  project_name: string;
  idea_description: string;
  
  // Usage information
  usage_type?: UsageType;
  usage_details?: string;
  
  // Specifications
  approximate_dimensions?: string;
  desired_material?: string;
  
  // Reference files
  attached_files?: any[]; // JSONB
  reference_images?: any[]; // JSONB
  
  // Communication
  request_chat?: boolean;
  
  // Admin work
  design_status: DesignStatus;
  admin_design_file?: string;
  admin_notes?: string;
  
  // User approval
  user_approval_status?: ApprovalStatus;
  user_approval_at?: string;
  user_rejection_reason?: string;
  
  // Pricing
  estimated_price?: number;
  final_price?: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  
  // Metadata
  is_archived?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export type CreateDesignRequestData = Omit<IDesignRequest, 'id' | 'created_at' | 'updated_at' | 'completed_at'>;
export type UpdateDesignRequestData = Partial<Omit<IDesignRequest, 'id' | 'created_at' | 'user_id'>>;

export class DesignRequest {
  static async create(data: CreateDesignRequestData): Promise<IDesignRequest> {
    const supabase = getSupabase();
    const { data: designRequest, error } = await supabase
      .from('design_requests')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create design request: ${error.message}`);
    return designRequest;
  }

  static async findById(id: string): Promise<IDesignRequest | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('design_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find design request: ${error.message}`);
    }
    return data;
  }

  static async findByUserId(userId: string): Promise<IDesignRequest[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('design_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to find design requests: ${error.message}`);
    return data || [];
  }

  static async findAll(filters?: {
    status?: DesignStatus;
    userId?: string;
    requestChat?: boolean;
    includeArchived?: boolean;
  }): Promise<IDesignRequest[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('design_requests')
      .select('*, users(name, email)');
    
    if (filters?.status) {
      query = query.eq('design_status', filters.status);
    }
    
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters?.requestChat !== undefined) {
      query = query.eq('request_chat', filters.requestChat);
    }
    
    if (!filters?.includeArchived) {
      query = query.eq('is_archived', false);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch design requests: ${error.message}`);
    return data || [];
  }

  static async update(id: string, data: UpdateDesignRequestData): Promise<IDesignRequest> {
    const supabase = getSupabase();
    
    // If status is being set to completed, set completed_at
    if (data.design_status === 'completed' && !data.completed_at) {
      data.completed_at = new Date().toISOString();
    }
    
    const { data: designRequest, error } = await supabase
      .from('design_requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update design request: ${error.message}`);
    return designRequest;
  }

  static async updateStatus(id: string, status: DesignStatus): Promise<IDesignRequest> {
    return this.update(id, { design_status: status });
  }

  static async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('design_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete design request: ${error.message}`);
  }

  static async softDelete(id: string): Promise<IDesignRequest> {
    return this.update(id, { 
      is_archived: true, 
      deleted_at: new Date().toISOString() 
    });
  }

  static async getStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    in_review: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    with_chat_request: number;
  }> {
    const supabase = getSupabase();
    let query = supabase
      .from('design_requests')
      .select('design_status, request_chat')
      .eq('is_archived', false);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(`Failed to get statistics: ${error.message}`);
    
    const stats = {
      total: data.length,
      pending: data.filter(d => d.design_status === 'pending').length,
      in_review: data.filter(d => d.design_status === 'in_review').length,
      in_progress: data.filter(d => d.design_status === 'in_progress').length,
      completed: data.filter(d => d.design_status === 'completed').length,
      cancelled: data.filter(d => d.design_status === 'cancelled').length,
      with_chat_request: data.filter(d => d.request_chat === true).length,
    };
    
    return stats;
  }

  static async getChildPrintJobs(designRequestId: string): Promise<any[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('parent_design_request_id', designRequestId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch child print jobs: ${error.message}`);
    return data || [];
  }
}
