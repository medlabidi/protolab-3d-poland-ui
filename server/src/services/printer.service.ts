import { getSupabase } from '../config/database';
import { Printer, CreatePrinterDto, UpdatePrinterDto } from '../types/materials.types';
import { logger } from '../config/logger';

export class PrinterService {
  // Get all printers
  async getAllPrinters(): Promise<Printer[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching printers');
      throw new Error('Failed to fetch printers');
    }

    return data || [];
  }

  // Get active printers only
  async getActivePrinters(): Promise<Printer[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching active printers');
      throw new Error('Failed to fetch active printers');
    }

    return data || [];
  }

  // Get operational printers
  async getOperationalPrinters(): Promise<Printer[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'operational')
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error }, 'Error fetching operational printers');
      throw new Error('Failed to fetch operational printers');
    }

    return data || [];
  }

  // Get single printer by ID
  async getPrinterById(id: string): Promise<Printer | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error({ error, id }, 'Error fetching printer');
      throw new Error('Failed to fetch printer');
    }

    return data;
  }

  // Get default printer for pricing calculations
  async getDefaultPrinter(): Promise<Printer> {
    const supabase = getSupabase();
    
    // First try to get the printer marked as default
    const { data: defaultPrinter, error: defaultError } = await supabase
      .from('printers')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .eq('status', 'operational')
      .single();

    if (!defaultError && defaultPrinter) {
      return defaultPrinter;
    }

    // If no default printer, fall back to first operational printer
    const printers = await this.getOperationalPrinters();
    
    if (printers.length === 0) {
      throw new Error('No operational printers available');
    }

    return printers[0];
  }

  // Create new printer
  async createPrinter(printerDto: CreatePrinterDto): Promise<Printer> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('printers')
      .insert([printerDto])
      .select()
      .single();

    if (error) {
      logger.error({ error, printerDto }, 'Error creating printer');
      throw new Error('Failed to create printer');
    }

    logger.info({ printerId: data.id }, 'Printer created successfully');
    return data;
  }

  // Update printer
  async updatePrinter(id: string, updateDto: UpdatePrinterDto): Promise<Printer> {
    const supabase = getSupabase();
    
    // If setting this printer as default, unset other defaults first
    if (updateDto.is_default === true) {
      await this.unsetAllDefaults();
    }
    
    const { data, error } = await supabase
      .from('printers')
      .update(updateDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error, id, updateDto }, 'Error updating printer');
      throw new Error('Failed to update printer');
    }

    logger.info({ printerId: data.id }, 'Printer updated successfully');
    return data;
  }

  // Set a printer as default (unsets all others)
  async setDefaultPrinter(id: string): Promise<Printer> {
    const supabase = getSupabase();
    
    // First, unset all defaults
    await this.unsetAllDefaults();
    
    // Then set this printer as default
    const { data, error } = await supabase
      .from('printers')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error, id }, 'Error setting default printer');
      throw new Error('Failed to set default printer');
    }

    logger.info({ printerId: data.id }, 'Printer set as default successfully');
    return data;
  }

  // Unset all default printers
  private async unsetAllDefaults(): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('printers')
      .update({ is_default: false })
      .eq('is_default', true);

    if (error) {
      logger.error({ error }, 'Error unsetting default printers');
      throw new Error('Failed to unset default printers');
    }
  }

  // Delete printer (soft delete by setting is_active to false)
  async deletePrinter(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('printers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      logger.error({ error, id }, 'Error deleting printer');
      throw new Error('Failed to delete printer');
    }

    logger.info({ printerId: id }, 'Printer deleted successfully');
  }

  // Get printer specifications for pricing
  async getPrinterSpecs(printerId?: string): Promise<{
    powerKw: number;
    costPln: number;
    lifespanHours: number;
    maintenanceRate: number;
  }> {
    let printer: Printer;

    if (printerId) {
      const result = await this.getPrinterById(printerId);
      if (!result) {
        throw new Error('Printer not found');
      }
      printer = result;
    } else {
      printer = await this.getDefaultPrinter();
    }

    return {
      powerKw: printer.power_watts / 1000, // Convert watts to kilowatts
      costPln: printer.cost_pln,
      lifespanHours: printer.lifespan_hours,
      maintenanceRate: printer.maintenance_rate,
    };
  }
}

export const printerService = new PrinterService();
