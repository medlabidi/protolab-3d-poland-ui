import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  Save,
  Sliders,
  Shield,
  Bell,
  Database,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'ProtoLab 3D',
    adminEmail: 'admin@protolab.info',
    supportEmail: 'support@protolab.info',
    currency: 'PLN',
    taxRate: 23,
    shippingBase: 15.00,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    enableNotifications: true,
    backupFrequency: 'daily',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your application settings and preferences</p>
          </div>

          {/* Success Message */}
          {saved && (
            <Card className="bg-green-900/30 border-green-500/50">
              <CardContent className="p-4 text-green-400">
                ✓ Settings saved successfully
              </CardContent>
            </Card>
          )}

          {/* General Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Admin Email</label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Pricing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="PLN">PLN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                    step="0.1"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Base Shipping ({settings.currency})</label>
                  <input
                    type="number"
                    value={settings.shippingBase}
                    onChange={(e) => setSettings({ ...settings, shippingBase: parseFloat(e.target.value) })}
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: 'Maintenance Mode',
                  description: 'Put the application in maintenance mode',
                  key: 'maintenanceMode',
                },
                {
                  name: 'Allow User Registration',
                  description: 'Allow new users to create accounts',
                  key: 'allowRegistration',
                },
                {
                  name: 'Require Email Verification',
                  description: 'Users must verify email before accessing the platform',
                  key: 'requireEmailVerification',
                },
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0">
                  <div>
                    <p className="font-medium text-white">{setting.name}</p>
                    <p className="text-sm text-gray-400">{setting.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[setting.key as keyof typeof settings] as boolean}
                    onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-blue-600"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-blue-600"
                  />
                  <span className="text-white font-medium">Enable All Notifications</span>
                </label>
                <p className="text-sm text-gray-400 mt-2 ml-8">Disable to turn off all system notifications</p>
              </div>
            </CardContent>
          </Card>

          {/* Backup Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                Backup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Database className="w-4 h-4 mr-2" />
                  Create Backup Now
                </Button>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  View Backups
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-900/20 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-300">These actions cannot be undone. Please proceed with caution.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-900/30">
                  Clear Cache
                </Button>
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-900/30">
                  Reset Database
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
