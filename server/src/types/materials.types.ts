export interface Material {
  id: string;
  material_type: string; // PLA, ABS, PETG, etc.
  color: string;
  price_per_kg: number; // Price in PLN per kilogram
  stock_status: 'available' | 'low_stock' | 'out_of_stock';
  lead_time_days: number; // Extra processing days when unavailable
  hex_color?: string; // Color hex code for display
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialDto {
  material_type: string;
  color: string;
  price_per_kg: number;
  stock_status?: 'available' | 'low_stock' | 'out_of_stock';
  lead_time_days?: number;
  hex_color?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateMaterialDto {
  color?: string;
  price_per_kg?: number;
  stock_status?: 'available' | 'low_stock' | 'out_of_stock';
  lead_time_days?: number;
  hex_color?: string;
  description?: string;
  is_active?: boolean;
}

export interface Printer {
  id: string;
  name: string;
  model?: string;
  power_watts: number; // Power consumption in watts
  cost_pln: number; // Purchase cost in PLN
  lifespan_hours: number; // Expected lifespan in hours
  maintenance_rate: number; // Maintenance multiplier (e.g., 0.03 = 3%)
  build_volume_x?: number; // Build volume in mm
  build_volume_y?: number;
  build_volume_z?: number;
  max_print_speed?: number; // mm/s
  nozzle_diameter?: number; // mm
  layer_height_min?: number; // mm
  layer_height_max?: number; // mm
  supported_materials?: string[]; // Array of material types
  status: 'operational' | 'maintenance' | 'offline';
  is_default: boolean; // Whether this is the default printer for pricing
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePrinterDto {
  name: string;
  model?: string;
  power_watts: number;
  cost_pln: number;
  lifespan_hours: number;
  maintenance_rate?: number;
  build_volume_x?: number;
  build_volume_y?: number;
  build_volume_z?: number;
  max_print_speed?: number;
  nozzle_diameter?: number;
  layer_height_min?: number;
  layer_height_max?: number;
  supported_materials?: string[];
  status?: 'operational' | 'maintenance' | 'offline';
  is_active?: boolean;
}

export interface UpdatePrinterDto {
  name?: string;
  model?: string;
  power_watts?: number;
  cost_pln?: number;
  lifespan_hours?: number;
  maintenance_rate?: number;
  build_volume_x?: number;
  build_volume_y?: number;
  build_volume_z?: number;
  max_print_speed?: number;
  nozzle_diameter?: number;
  layer_height_min?: number;
  layer_height_max?: number;
  supported_materials?: string[];
  status?: 'operational' | 'maintenance' | 'offline';
  is_default?: boolean;
  is_active?: boolean;
}

export interface MaterialAvailability {
  material_type: string;
  color: string;
  available: boolean;
  price_per_kg: number;
  lead_time_days: number;
  message?: string;
}
