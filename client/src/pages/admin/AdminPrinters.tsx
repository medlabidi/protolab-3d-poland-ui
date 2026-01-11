import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Power,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download,
  Settings as SettingsIcon,
  DollarSign,
  Calendar,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminPrinters = () => {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);
  const [deletingPrinter, setDeletingPrinter] = useState<any>(null);
  const [newPrinter, setNewPrinter] = useState({
    brand: "",
    printer_model: "",
    build_volume_x: 0,
    build_volume_y: 0,
    build_volume_z: 0,
    multi_color_printing: false,
    max_colors: 1,
    available_nozzle_diameters: [0.4],
    actual_nozzle_diameter: 0.4,
    lifespan_years: 5,
    power_watts: 0,
    supported_materials: [] as string[],
    layer_height_min: 0.1,
    layer_height_max: 0.3,
    cost_pln: 0,
  });

  // Fetch printers on mount
  useEffect(() => {
    fetchPrinters();
  }, []);

  // Map API data to component format (snake_case to camelCase)
  const mapPrinterData = (printer: any) => ({
    id: printer.id,
    name: printer.name,
    status: printer.status,
    currentJob: printer.current_job || printer.currentJob || "None",
    progress: printer.progress || 0,
    temperature: printer.temperature || 25,
    bedTemp: printer.bed_temp || printer.bedTemp || 25,
    uptime: printer.uptime || "0%",
    totalPrints: printer.total_prints || printer.totalPrints || 0,
    lastMaintenance: printer.last_maintenance || printer.lastMaintenance,
    maintenanceCostMonthly: printer.maintenance_cost_monthly || printer.maintenanceCostMonthly || 0,
    maintenanceIntervalDays: printer.maintenance_interval_days || printer.maintenanceIntervalDays || 90,
    nextMaintenance: printer.next_maintenance || printer.nextMaintenance,
  });

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching printers from:', `${API_URL}/admin/printers`);
      
      const response = await fetch(`${API_URL}/admin/printers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Printers data:', data);
        const mappedPrinters = (data.printers || []).map(mapPrinterData);
        setPrinters(mappedPrinters);
        
        if (mappedPrinters.length === 0) {
          toast.info('No printers found. Add one to get started!');
        }
      } else if (response.status === 404) {
        toast.error('Printers table not found. Please run SQL/create-printers-table.sql in Supabase.');
        console.error('Table printers does not exist. Run SQL migration first.');
      } else if (response.status === 401) {
        toast.error('Unauthorized. Your session may have expired.');
        console.error('Authentication failed. Token might be expired.');
      } else if (response.status === 403) {
        toast.error('Access denied. You must be an administrator.');
        console.error('Forbidden. User is not admin.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Error: ${errorData.error || response.statusText}`);
        console.error('API Error:', errorData);
      }
    } catch (error: any) {
      console.error('Error fetching printers:', error);
      
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Unable to connect to server. Check that the API is running.');
      } else {
        toast.error(`Connection error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (printerId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: printerId, status: newStatus }),
      });

      if (response.ok) {
        setPrinters(printers.map(printer => 
          printer.id === printerId 
            ? { ...printer, status: newStatus }
            : printer
        ));
        toast.success(`Printer status updated: ${newStatus}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleEditPrinter = (printer: any) => {
    setEditingPrinter({ 
      ...printer,
      maintenanceCostMonthly: printer.maintenanceCostMonthly || printer.maintenance_cost_monthly || 0,
      maintenanceIntervalDays: printer.maintenanceIntervalDays || printer.maintenance_interval_days || 90,
    });
    setShowEditDialog(true);
  };

  const handleUpdatePrinter = async () => {
    if (!editingPrinter || !editingPrinter.name.trim()) {
      toast.error("Printer name is required");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingPrinter.id,
          name: editingPrinter.name,
          status: editingPrinter.status,
          temperature: editingPrinter.temperature,
          bed_temp: editingPrinter.bedTemp,
          current_job: editingPrinter.currentJob,
          maintenance_cost_monthly: editingPrinter.maintenanceCostMonthly,
          maintenance_interval_days: editingPrinter.maintenanceIntervalDays,
        }),
      });

      if (response.ok) {
        await fetchPrinters(); // Reload printers from server
        toast.success(`Printer "${editingPrinter.name}" updated!`);
        setShowEditDialog(false);
        setEditingPrinter(null);
      } else {
        toast.error('Failed to update printer');
      }
    } catch (error) {
      console.error('Error updating printer:', error);
      toast.error('Error updating printer');
    }
  };

  const handleDeletePrinter = (printer: any) => {
    setDeletingPrinter(printer);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPrinter) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers?id=${deletingPrinter.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchPrinters(); // Reload printers from server
        toast.success(`Printer "${deletingPrinter.name}" deleted!`);
        setShowDeleteDialog(false);
        setDeletingPrinter(null);
      } else {
        toast.error('Failed to delete printer');
      }
    } catch (error) {
      console.error('Error deleting printer:', error);
      toast.error('Error deleting printer');
    }
  };

  const handleAddPrinter = async () => {
    if (!newPrinter.brand.trim()) {
      toast.error("Brand is required");
      return;
    }

    if (!newPrinter.printer_model.trim()) {
      toast.error("Model is required");
      return;
    }

    try {
      // Auto-generate name from brand + model
      const generatedName = `${newPrinter.brand} ${newPrinter.printer_model}`.trim();
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: generatedName,
          brand: newPrinter.brand,
          printer_model: newPrinter.printer_model,
          build_volume_x: newPrinter.build_volume_x,
          build_volume_y: newPrinter.build_volume_y,
          build_volume_z: newPrinter.build_volume_z,
          multi_color_printing: newPrinter.multi_color_printing,
          max_colors: newPrinter.multi_color_printing ? newPrinter.max_colors : 1,
          available_nozzle_diameters: newPrinter.available_nozzle_diameters.join(', '),
          actual_nozzle_diameter: newPrinter.actual_nozzle_diameter,
          lifespan_years: newPrinter.lifespan_years,
          power_watts: newPrinter.power_watts,
          cost_pln: newPrinter.cost_pln,
          supported_materials: newPrinter.supported_materials.filter(m => m.trim()),
          layer_height_min: newPrinter.layer_height_min,
          layer_height_max: newPrinter.layer_height_max,
        }),
      });

      if (response.ok) {
        await fetchPrinters(); // Reload printers from server
        toast.success("Printer added successfully!");
        setShowAddDialog(false);
        setNewPrinter({
          brand: "",
          printer_model: "",
          build_volume_x: 0,
          build_volume_y: 0,
          build_volume_z: 0,
          multi_color_printing: false,
          max_colors: 1,
          available_nozzle_diameters: [0.4],
          actual_nozzle_diameter: 0.4,
          lifespan_years: 5,
          power_watts: 0,
          supported_materials: [],
          layer_height_min: 0.1,
          layer_height_max: 0.3,
          cost_pln: 0,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add printer:', errorData);
        toast.error(`Failed to add printer: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding printer:', error);
      toast.error(`Error adding printer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400';
      case 'offline': return 'bg-red-500/20 text-red-400';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="w-4 h-4" />;
      case 'offline': return <AlertCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <Power className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Printers Management</h1>
              <p className="text-gray-400">Monitor and manage your 3D printer fleet</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Add Printer
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading printers...</p>
              </div>
            </div>
          ) : printers.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-12 text-center">
                <Printer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Printers</h3>
                <p className="text-gray-400">Start by adding your first printer using the button above</p>
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Printers</p>
                <p className="text-2xl font-bold text-white">{printers.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Online</p>
                <p className="text-2xl font-bold text-green-400">{printers.filter(p => p.status === 'online').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Offline</p>
                <p className="text-2xl font-bold text-red-400">{printers.filter(p => p.status === 'offline').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-400">{printers.filter(p => p.status === 'maintenance').length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Printers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {printers.map(printer => (
              <Card key={printer.id} className={`bg-gray-900 border-gray-800 overflow-hidden ${!printer.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Printer className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{printer.name}</h3>
                          {printer.is_default && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Default</span>
                          )}
                          {!printer.is_active && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">Inactive</span>
                          )}
                        </div>
                        {printer.brand && printer.printer_model && (
                          <p className="text-gray-400 text-sm mt-1">{printer.brand} {printer.printer_model}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditPrinter(printer)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrinter(printer)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-4">
                    {printer.build_volume_x && printer.build_volume_y && printer.build_volume_z && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Build Volume</p>
                        <p className="text-white text-sm font-medium">
                          {printer.build_volume_x} × {printer.build_volume_y} × {printer.build_volume_z} mm
                        </p>
                      </div>
                    )}
                    {printer.actual_nozzle_diameter && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Nozzle Diameter</p>
                        <p className="text-white text-sm font-medium">{printer.actual_nozzle_diameter} mm</p>
                      </div>
                    )}
                    {printer.power_watts && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Power</p>
                        <p className="text-white text-sm font-medium">{printer.power_watts} W</p>
                      </div>
                    )}
                    {printer.layer_height_min && printer.layer_height_max && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Layer Height</p>
                        <p className="text-white text-sm font-medium">
                          {printer.layer_height_min} - {printer.layer_height_max} mm
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Multi-color and Materials */}
                  {(printer.multi_color_printing || printer.supported_materials?.length > 0) && (
                    <div className="pt-3 border-t border-gray-800 space-y-2">
                      {printer.multi_color_printing && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">Multi-Color:</span>
                          <span className="text-green-400 text-sm">Yes ({printer.max_colors} colors)</span>
                        </div>
                      )}
                      {printer.supported_materials?.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Supported Materials</p>
                          <div className="flex flex-wrap gap-1">
                            {printer.supported_materials.map((material: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Available Nozzles */}
                  {printer.available_nozzle_diameters && (
                    <div className="pt-3 border-t border-gray-800">
                      <p className="text-gray-400 text-xs mb-1">Available Nozzles</p>
                      <p className="text-white text-sm">{printer.available_nozzle_diameters}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-800 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('accessToken');
                          const response = await fetch(`${API_URL}/admin/printers/${printer.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ is_default: true }),
                          });
                          if (response.ok) {
                            await fetchPrinters();
                            toast.success("Printer set as default!");
                          } else {
                            toast.error("Failed to set as default");
                          }
                        } catch (error) {
                          toast.error("Failed to set as default");
                        }
                      }}
                      disabled={printer.is_default}
                      className={`flex-1 ${printer.is_default ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {printer.is_default ? '✓ Default' : 'Set as Default'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('accessToken');
                          const response = await fetch(`${API_URL}/admin/printers/${printer.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ is_active: !printer.is_active }),
                          });
                          if (response.ok) {
                            await fetchPrinters();
                            toast.success(printer.is_active ? "Printer deactivated" : "Printer activated");
                          } else {
                            toast.error("Failed to update status");
                          }
                        } catch (error) {
                          toast.error("Failed to update status");
                        }
                      }}
                      className={`flex-1 ${printer.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {printer.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          )}

          {/* Add Printer Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Printer</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the specifications for the new 3D printer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="printer-brand" className="text-gray-300">Brand *</Label>
                      <Input
                        id="printer-brand"
                        placeholder="e.g. Prusa, Creality"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.brand}
                        onChange={(e) => setNewPrinter({ ...newPrinter, brand: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="printer-model" className="text-gray-300">Model *</Label>
                      <Input
                        id="printer-model"
                        placeholder="e.g. i3 MK3S+, Ender 3"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.printer_model}
                        onChange={(e) => setNewPrinter({ ...newPrinter, printer_model: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {(newPrinter.brand || newPrinter.printer_model) && (
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-gray-300">
                      <span className="text-gray-400">Printer will be named: </span>
                      <span className="text-white font-semibold">{newPrinter.brand} {newPrinter.printer_model}</span>
                    </div>
                  )}
                </div>

                {/* Build Specifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">Build Specifications</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Max Build Volume (mm)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="build-x" className="text-xs text-gray-400">Width (X)</Label>
                        <Input
                          id="build-x"
                          type="number"
                          placeholder="220"
                          className="bg-gray-800 border-gray-700 text-white"
                          value={newPrinter.build_volume_x || ''}
                          onChange={(e) => setNewPrinter({ ...newPrinter, build_volume_x: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="build-y" className="text-xs text-gray-400">Depth (Y)</Label>
                        <Input
                          id="build-y"
                          type="number"
                          placeholder="220"
                          className="bg-gray-800 border-gray-700 text-white"
                          value={newPrinter.build_volume_y || ''}
                          onChange={(e) => setNewPrinter({ ...newPrinter, build_volume_y: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="build-z" className="text-xs text-gray-400">Height (Z)</Label>
                        <Input
                          id="build-z"
                          type="number"
                          placeholder="250"
                          className="bg-gray-800 border-gray-700 text-white"
                          value={newPrinter.build_volume_z || ''}
                          onChange={(e) => setNewPrinter({ ...newPrinter, build_volume_z: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Color Printing */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">Color Capabilities</h4>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="multi-color"
                      className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                      checked={newPrinter.multi_color_printing}
                      onChange={(e) => setNewPrinter({ ...newPrinter, multi_color_printing: e.target.checked })}
                    />
                    <Label htmlFor="multi-color" className="text-gray-300 cursor-pointer">
                      Multi-Color Printing Capability
                    </Label>
                  </div>

                  {newPrinter.multi_color_printing && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="max-colors" className="text-gray-300">Maximum Colors at Once</Label>
                      <Input
                        id="max-colors"
                        type="number"
                        min="2"
                        max="10"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.max_colors}
                        onChange={(e) => setNewPrinter({ ...newPrinter, max_colors: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                  )}
                </div>

                {/* Nozzle Specifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">Nozzle Specifications</h4>
                  
                  <div className="space-y-3">
                    <Label className="text-gray-300">Available Nozzle Diameters (mm)</Label>
                    <div className="space-y-2">
                      {newPrinter.available_nozzle_diameters.map((diameter, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 0.4"
                            className="bg-gray-800 border-gray-700 text-white flex-1"
                            value={diameter}
                            onChange={(e) => {
                              const newDiameters = [...newPrinter.available_nozzle_diameters];
                              newDiameters[index] = parseFloat(e.target.value) || 0;
                              setNewPrinter({ ...newPrinter, available_nozzle_diameters: newDiameters });
                            }}
                          />
                          {newPrinter.available_nozzle_diameters.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => {
                                const newDiameters = newPrinter.available_nozzle_diameters.filter((_, i) => i !== index);
                                setNewPrinter({ ...newPrinter, available_nozzle_diameters: newDiameters });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          setNewPrinter({ 
                            ...newPrinter, 
                            available_nozzle_diameters: [...newPrinter.available_nozzle_diameters, 0.4] 
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Nozzle Diameter
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="actual-nozzle" className="text-gray-300">Currently Installed Nozzle (mm)</Label>
                    <Input
                      id="actual-nozzle"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 0.4"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.actual_nozzle_diameter}
                      onChange={(e) => setNewPrinter({ ...newPrinter, actual_nozzle_diameter: parseFloat(e.target.value) || 0.4 })}
                    />
                  </div>
                </div>

                {/* Lifecycle */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">Lifecycle Information</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="power" className="text-gray-300">Power Consumption (watts)</Label>
                    <Input
                      id="power"
                      type="number"
                      min="1"
                      placeholder="e.g. 350"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.power_watts}
                      onChange={(e) => setNewPrinter({ ...newPrinter, power_watts: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-gray-300">Purchase Cost (PLN)</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 5000"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.cost_pln}
                      onChange={(e) => setNewPrinter({ ...newPrinter, cost_pln: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supported-materials" className="text-gray-300">Supported Materials</Label>
                    <div className="space-y-2">
                      {newPrinter.supported_materials.map((material, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="e.g. PLA, ABS, PETG"
                            className="bg-gray-800 border-gray-700 text-white flex-1"
                            value={material}
                            onChange={(e) => {
                              const updated = [...newPrinter.supported_materials];
                              updated[index] = e.target.value;
                              setNewPrinter({ ...newPrinter, supported_materials: updated });
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = newPrinter.supported_materials.filter((_, i) => i !== index);
                              setNewPrinter({ ...newPrinter, supported_materials: updated });
                            }}
                            className="bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewPrinter({ ...newPrinter, supported_materials: [...newPrinter.supported_materials, ''] })}
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 w-full"
                      >
                        + Add Material
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="layer-min" className="text-gray-300">Min Layer Height (mm)</Label>
                      <Input
                        id="layer-min"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 0.1"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.layer_height_min}
                        onChange={(e) => setNewPrinter({ ...newPrinter, layer_height_min: parseFloat(e.target.value) || 0.1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="layer-max" className="text-gray-300">Max Layer Height (mm)</Label>
                      <Input
                        id="layer-max"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 0.3"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.layer_height_max}
                        onChange={(e) => setNewPrinter({ ...newPrinter, layer_height_max: parseFloat(e.target.value) || 0.3 })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lifespan" className="text-gray-300">Expected Lifespan (years)</Label>
                    <Input
                      id="lifespan"
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.lifespan_years}
                      onChange={(e) => setNewPrinter({ ...newPrinter, lifespan_years: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPrinter}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Printer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Printer Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Printer</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Modify the printer information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-printer-name" className="text-gray-300">Printer Name *</Label>
                  <Input
                    id="edit-printer-name"
                    placeholder="e.g. Prusa i3 MK4"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={editingPrinter?.name || ""}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-printer-status" className="text-gray-300">Status</Label>
                  <Select
                    value={editingPrinter?.status || "offline"}
                    onValueChange={(value) => setEditingPrinter({ ...editingPrinter, status: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nozzle-temp" className="text-gray-300">Nozzle Temp (°C)</Label>
                    <Input
                      id="edit-nozzle-temp"
                      type="number"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={editingPrinter?.temperature || 25}
                      onChange={(e) => setEditingPrinter({ ...editingPrinter, temperature: parseInt(e.target.value) || 25 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bed-temp" className="text-gray-300">Bed Temp (°C)</Label>
                    <Input
                      id="edit-bed-temp"
                      type="number"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={editingPrinter?.bedTemp || 25}
                      onChange={(e) => setEditingPrinter({ ...editingPrinter, bedTemp: parseInt(e.target.value) || 25 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-current-job" className="text-gray-300">Current Job</Label>
                  <Input
                    id="edit-current-job"
                    placeholder="e.g. None"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={editingPrinter?.currentJob || "None"}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, currentJob: e.target.value })}
                  />
                </div>

                {/* Maintenance Section */}
                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    Maintenance Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-maintenance-cost" className="text-gray-300">
                        Monthly Cost (PLN)
                      </Label>
                      <Input
                        id="edit-maintenance-cost"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 75.00"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={editingPrinter?.maintenanceCostMonthly || 0}
                        onChange={(e) => setEditingPrinter({ 
                          ...editingPrinter, 
                          maintenanceCostMonthly: parseFloat(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-maintenance-interval" className="text-gray-300">
                        Interval (days)
                      </Label>
                      <Input
                        id="edit-maintenance-interval"
                        type="number"
                        placeholder="e.g. 90"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={editingPrinter?.maintenanceIntervalDays || 90}
                        onChange={(e) => setEditingPrinter({ 
                          ...editingPrinter, 
                          maintenanceIntervalDays: parseInt(e.target.value) || 90 
                        })}
                      />
                    </div>
                    {/* Calcul automatique */}
                    {(editingPrinter?.maintenanceCostMonthly > 0) && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Annual Cost:</span>
                            <span className="text-white font-semibold">
                              {((editingPrinter?.maintenanceCostMonthly || 0) * 12).toFixed(2)} PLN
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Maintenances/Year:</span>
                            <span className="text-white font-semibold">
                              ≈ {Math.floor(365 / (editingPrinter?.maintenanceIntervalDays || 90))} interventions
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePrinter}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Are you sure you want to delete this printer?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">{deletingPrinter?.name}</p>
                      <p className="text-sm text-gray-400">
                        This action is irreversible. All data associated with this printer will be deleted.
                      </p>
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        <p>• Status: {deletingPrinter?.status}</p>
                        <p>• Total prints: {deletingPrinter?.totalPrints}</p>
                        <p>• Uptime: {deletingPrinter?.uptime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default AdminPrinters;
