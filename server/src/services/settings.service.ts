import { Settings, ISettings, UpdateSettingsData } from '../models/Settings';

export class SettingsService {
  async getSettings(): Promise<ISettings> {
    return await Settings.get();
  }
  
  async updateSettings(updates: UpdateSettingsData): Promise<ISettings> {
    return await Settings.update(updates);
  }
}

export const settingsService = new SettingsService();