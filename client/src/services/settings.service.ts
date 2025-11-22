import { Settings, ISettings } from '../models/Settings';

export class SettingsService {
  async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        materialRate: 0.05,
        timeRate: 10,
        serviceFee: 5,
      });
    }
    
    return settings;
  }
  
  async updateSettings(updates: Partial<ISettings>): Promise<ISettings> {
    const settings = await this.getSettings();
    
    if (updates.materialRate !== undefined) {
      settings.materialRate = updates.materialRate;
    }
    if (updates.timeRate !== undefined) {
      settings.timeRate = updates.timeRate;
    }
    if (updates.serviceFee !== undefined) {
      settings.serviceFee = updates.serviceFee;
    }
    
    settings.updatedAt = new Date();
    await settings.save();
    
    return settings;
  }
}

export const settingsService = new SettingsService();