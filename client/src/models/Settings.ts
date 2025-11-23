import { getSupabase } from '../config/database';

export interface ISettings {
  id: string;
  material_rate: number;
  time_rate: number;
  service_fee: number;
  updated_at: string;
}

export type UpdateSettingsData = Partial<Omit<ISettings, 'id' | 'updated_at'>>;

export class Settings {
  static async get(): Promise<ISettings> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        return this.createDefault();
      }
      throw new Error(`Failed to get settings: ${error.message}`);
    }
    
    return data;
  }

  static async createDefault(): Promise<ISettings> {
    const supabase = getSupabase();
    const defaultSettings = {
      material_rate: 0.05,
      time_rate: 10,
      service_fee: 5,
    };
    
    const { data, error } = await supabase
      .from('settings')
      .insert([defaultSettings])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create default settings: ${error.message}`);
    return data;
  }

  static async update(updates: UpdateSettingsData): Promise<ISettings> {
    const supabase = getSupabase();
    
    // Get the first (and should be only) settings record
    const current = await this.get();
    
    const { data, error } = await supabase
      .from('settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update settings: ${error.message}`);
    return data;
  }
}