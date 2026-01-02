import { getSupabase } from '../config/database';
import { 
  Material, 
  CreateMaterialDto, 
  UpdateMaterialDto,
  MaterialAvailability 
} from '../types/materials.types';
import { logger } from '../config/logger';

export class MaterialService {
  // Get all materials
  async getAllMaterials(): Promise<Material[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('material_type', { ascending: true })
      .order('color', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching materials');
      throw new Error('Failed to fetch materials');
    }

    return data || [];
  }

  // Get active materials only
  async getActiveMaterials(): Promise<Material[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('material_type', { ascending: true })
      .order('color', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching active materials');
      throw new Error('Failed to fetch active materials');
    }

    return data || [];
  }

  // Get material availability for users (public API)
  async getMaterialAvailability(): Promise<MaterialAvailability[]> {
    const materials = await this.getActiveMaterials();

    return materials.map(material => ({
      material_type: material.material_type,
      color: material.color,
      available: material.stock_status === 'available',
      price_per_kg: material.price_per_kg,
      lead_time_days: material.lead_time_days,
      message: material.stock_status !== 'available' 
        ? `Material is currently unavailable. Processing will take up to ${material.lead_time_days || 4} business days.`
        : undefined
    }));
  }

  // Get single material by ID
  async getMaterialById(id: string): Promise<Material | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error({ error, id }, 'Error fetching material');
      throw new Error('Failed to fetch material');
    }

    return data;
  }

  // Get material price
  async getMaterialPrice(materialType: string, color: string): Promise<number> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('materials')
      .select('price_per_kg')
      .eq('material_type', materialType)
      .eq('color', color)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      logger.error({ error, materialType, color }, 'Material price not found');
      throw new Error(`Material price not found for: ${materialType}_${color}`);
    }

    return data.price_per_kg;
  }

  // Create new material
  async createMaterial(materialDto: CreateMaterialDto): Promise<Material> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('materials')
      .insert([materialDto])
      .select()
      .single();

    if (error) {
      logger.error({ error, materialDto }, 'Error creating material');
      throw new Error('Failed to create material');
    }

    logger.info({ materialId: data.id }, 'Material created successfully');
    return data;
  }

  // Update material
  async updateMaterial(id: string, updateDto: UpdateMaterialDto): Promise<Material> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('materials')
      .update(updateDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error, id, updateDto }, 'Error updating material');
      throw new Error('Failed to update material');
    }

    logger.info({ materialId: data.id }, 'Material updated successfully');
    return data;
  }

  // Delete material (soft delete by setting is_active to false)
  async deleteMaterial(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('materials')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      logger.error({ error, id }, 'Error deleting material');
      throw new Error('Failed to delete material');
    }

    logger.info({ materialId: id }, 'Material deleted successfully');
  }

  // Get materials grouped by type
  async getMaterialsByType(): Promise<Record<string, Material[]>> {
    const materials = await this.getActiveMaterials();
    
    return materials.reduce((acc, material) => {
      if (!acc[material.material_type]) {
        acc[material.material_type] = [];
      }
      acc[material.material_type].push(material);
      return acc;
    }, {} as Record<string, Material[]>);
  }
}

export const materialService = new MaterialService();
