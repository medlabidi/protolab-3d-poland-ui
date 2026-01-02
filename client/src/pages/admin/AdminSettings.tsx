import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Settings {
  material_rate: number;
  time_rate: number;
  service_fee: number;
  vat_rate: number;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    material_rate: 0,
    time_rate: 0,
    service_fee: 0,
    vat_rate: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      } else {
        toast.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings updated successfully');
        fetchSettings();
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-400">Configure pricing and system settings</p>
            </div>
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Pricing Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-500" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-400">Material Rate (PLN per gram)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.material_rate}
                    onChange={(e) => handleChange('material_rate', e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="0.50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cost per gram of material used
                  </p>
                </div>

                <div>
                  <Label className="text-gray-400">Time Rate (PLN per hour)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.time_rate}
                    onChange={(e) => handleChange('time_rate', e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="10.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cost per hour of printing time
                  </p>
                </div>

                <div>
                  <Label className="text-gray-400">Service Fee (PLN)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.service_fee}
                    onChange={(e) => handleChange('service_fee', e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="5.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fixed service fee per order
                  </p>
                </div>

                <div>
                  <Label className="text-gray-400">VAT Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.vat_rate}
                    onChange={(e) => handleChange('vat_rate', e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="23.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    VAT percentage applied to orders
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Preview */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white text-lg">Pricing Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Example: 100g material, 5 hours print</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                  <span className="text-gray-400">Material Cost:</span>
                  <span className="text-white font-mono">
                    {(settings.material_rate * 100).toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time Cost:</span>
                  <span className="text-white font-mono">
                    {(settings.time_rate * 5).toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Service Fee:</span>
                  <span className="text-white font-mono">
                    {settings.service_fee.toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white font-mono">
                    {((settings.material_rate * 100) + (settings.time_rate * 5) + settings.service_fee).toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">VAT ({settings.vat_rate}%):</span>
                  <span className="text-white font-mono">
                    {(((settings.material_rate * 100) + (settings.time_rate * 5) + settings.service_fee) * (settings.vat_rate / 100)).toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                  <span className="text-gray-300 font-semibold">Total:</span>
                  <span className="text-white font-mono font-bold text-lg">
                    {(((settings.material_rate * 100) + (settings.time_rate * 5) + settings.service_fee) * (1 + settings.vat_rate / 100)).toFixed(2)} PLN
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
