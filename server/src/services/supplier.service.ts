import { getSupabase } from '../config/database';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types/materials.types';
import { logger } from '../config/logger';

export class SupplierService {
  // Get all suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching suppliers');
      throw new Error('Failed to fetch suppliers');
    }

    return data || [];
  }

  // Get active suppliers only
  async getActiveSuppliers(): Promise<Supplier[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching active suppliers');
      throw new Error('Failed to fetch active suppliers');
    }

    return data || [];
  }

  // Get preferred suppliers
  async getPreferredSuppliers(): Promise<Supplier[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .eq('is_preferred', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching preferred suppliers');
      throw new Error('Failed to fetch preferred suppliers');
    }

    return data || [];
  }

  // Get suppliers by material type
  async getSuppliersByMaterial(materialType: string): Promise<Supplier[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .contains('materials_supplied', [materialType])
      .order('is_preferred', { ascending: false })
      .order('quality_rating', { ascending: false });

    if (error) {
      logger.error({ error, materialType }, 'Error fetching suppliers by material');
      throw new Error('Failed to fetch suppliers by material');
    }

    return data || [];
  }

  // Get supplier by ID
  async getSupplierById(id: string): Promise<Supplier | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error({ error, id }, 'Error fetching supplier by ID');
      throw new Error('Failed to fetch supplier');
    }

    return data;
  }

  // Create new supplier
  async createSupplier(supplierData: CreateSupplierDto, userId?: string): Promise<Supplier> {
    const supabase = getSupabase();
    
    const newSupplier = {
      ...supplierData,
      lead_time_days: supplierData.lead_time_days || 7,
      minimum_order_value: supplierData.minimum_order_value || 0,
      currency: supplierData.currency || 'PLN',
      discount_percentage: supplierData.discount_percentage || 0,
      status: supplierData.status || 'active',
      is_preferred: supplierData.is_preferred || false,
      total_orders: 0,
      total_spent: 0,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('suppliers')
      .insert([newSupplier])
      .select()
      .single();

    if (error) {
      logger.error({ error, supplierData }, 'Error creating supplier');
      throw new Error('Failed to create supplier');
    }

    logger.info({ supplierId: data.id, name: data.name }, 'Supplier created successfully');
    return data;
  }

  // Update supplier
  async updateSupplier(id: string, updates: UpdateSupplierDto, userId?: string): Promise<Supplier> {
    const supabase = getSupabase();
    
    const updateData = {
      ...updates,
      updated_by: userId,
    };

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error, id, updates }, 'Error updating supplier');
      throw new Error('Failed to update supplier');
    }

    logger.info({ supplierId: id, updates }, 'Supplier updated successfully');
    return data;
  }

  // Delete supplier
  async deleteSupplier(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error({ error, id }, 'Error deleting supplier');
      throw new Error('Failed to delete supplier');
    }

    logger.info({ supplierId: id }, 'Supplier deleted successfully');
  }

  // Update supplier statistics after an order
  async updateSupplierStats(id: string, orderAmount: number): Promise<void> {
    const supabase = getSupabase();
    
    const supplier = await this.getSupplierById(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const { error } = await supabase
      .from('suppliers')
      .update({
        total_orders: supplier.total_orders + 1,
        total_spent: supplier.total_spent + orderAmount,
        last_order_date: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      logger.error({ error, id }, 'Error updating supplier stats');
      throw new Error('Failed to update supplier stats');
    }

    logger.info({ supplierId: id, orderAmount }, 'Supplier stats updated');
  }

  // Get supplier statistics
  async getSupplierStats(): Promise<any> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('status, is_preferred, total_orders, total_spent');

    if (error) {
      logger.error({ error }, 'Error fetching supplier stats');
      throw new Error('Failed to fetch supplier stats');
    }

    const stats = {
      total: data.length,
      active: data.filter(s => s.status === 'active').length,
      inactive: data.filter(s => s.status === 'inactive').length,
      preferred: data.filter(s => s.is_preferred).length,
      totalOrders: data.reduce((sum, s) => sum + (s.total_orders || 0), 0),
      totalSpent: data.reduce((sum, s) => sum + (s.total_spent || 0), 0),
    };

    return stats;
  }
}

export const supplierService = new SupplierService();
