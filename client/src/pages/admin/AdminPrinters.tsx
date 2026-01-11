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
    name: "",
    status: "offline",
    temperature: 25,
    bedTemp: 25,
    maintenanceCostMonthly: 0,
    maintenanceIntervalDays: 90,
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
    if (!newPrinter.name.trim()) {
      toast.error("Printer name is required");
      return;
    }

    try {
      const nextMaintenanceDate = new Date();
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + newPrinter.maintenanceIntervalDays);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPrinter.name,
          status: newPrinter.status,
          current_job: "None",
          progress: 0,
          temperature: newPrinter.temperature,
          bed_temp: newPrinter.bedTemp,
          uptime: "0%",
          total_prints: 0,
          last_maintenance: new Date().toISOString().split('T')[0],
          maintenance_cost_monthly: newPrinter.maintenanceCostMonthly,
          maintenance_interval_days: newPrinter.maintenanceIntervalDays,
          next_maintenance: nextMaintenanceDate.toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        await fetchPrinters(); // Reload printers from server
        toast.success("Printer added successfully!");
        setShowAddDialog(false);
        setNewPrinter({
          name: "",
          status: "offline",
          temperature: 25,
          bedTemp: 25,
          maintenanceCostMonthly: 0,
          maintenanceIntervalDays: 90,
        });
      } else {
        toast.error('Failed to add printer');
      }
    } catch (error) {
      console.error('Error adding printer:', error);
      toast.error('Error adding printer');
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
              <Card key={printer.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                <CardHeader className="border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Printer className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{printer.name}</h3>
                        <Select
                          value={printer.status}
                          onValueChange={(value) => handleStatusChange(printer.id, value)}
                        >
                          <SelectTrigger className={`w-fit border-0 h-auto p-0 mt-1 ${getStatusColor(printer.status)}`}>
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full text-sm">
                              {getStatusIcon(printer.status)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="online" className="text-green-400">
                              Online
                            </SelectItem>
                            <SelectItem value="offline" className="text-red-400">
                              Offline
                            </SelectItem>
                            <SelectItem value="maintenance" className="text-yellow-400">
                              Maintenance
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                  {/* Current Job */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Current Job</p>
                    <p className="text-white font-medium">{printer.currentJob}</p>
                    {printer.progress > 0 && (
                      <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${printer.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {printer.progress > 0 && <p className="text-xs text-gray-500 mt-1">{printer.progress}% complete</p>}
                  </div>

                  {/* Temperatures */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Nozzle Temp</p>
                      <p className="text-white font-semibold">{printer.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Bed Temp</p>
                      <p className="text-white font-semibold">{printer.bedTemp}°C</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-800">
                    <div>
                      <p className="text-gray-400 text-xs">Uptime</p>
                      <p className="text-white text-sm font-medium">{printer.uptime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Total Prints</p>
                      <p className="text-white text-sm font-medium">{printer.totalPrints}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Last Service</p>
                      <p className="text-white text-xs">{new Date(printer.lastMaintenance).toLocaleDateString()}</p>

                  {/* Maintenance Info */}
                  <div className="pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-xs">Maintenance Cost</span>
                      </div>
                      <span className="text-white font-semibold text-sm">
                        {printer.maintenanceCostMonthly?.toFixed(2) || '0.00'} PLN/month
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-xs">Next Maintenance</span>
                      </div>
                      <span className="text-gray-300 text-xs">
                        {printer.nextMaintenance ? new Date(printer.nextMaintenance).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          )}

          {/* Add Printer Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Printer</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the information for the new 3D printer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="printer-name" className="text-gray-300">Printer Name *</Label>
                  <Input
                    id="printer-name"
                    placeholder="e.g. Prusa i3 MK4"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={newPrinter.name}
                    onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printer-status" className="text-gray-300">Initial Status</Label>
                  <Select
                    value={newPrinter.status}
                    onValueChange={(value) => setNewPrinter({ ...newPrinter, status: value })}
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
                    <Label htmlFor="nozzle-temp" className="text-gray-300">Nozzle Temp (°C)</Label>
                    <Input
                      id="nozzle-temp"
                      type="number"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.temperature}
                      onChange={(e) => setNewPrinter({ ...newPrinter, temperature: parseInt(e.target.value) || 25 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bed-temp" className="text-gray-300">Bed Temp (°C)</Label>
                    <Input
                      id="bed-temp"
                      type="number"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.bedTemp}
                      onChange={(e) => setNewPrinter({ ...newPrinter, bedTemp: parseInt(e.target.value) || 25 })}
                    />
                  </div>
                </div>

                {/* Maintenance Section */}
                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    Maintenance Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-cost" className="text-gray-300">
                        Monthly Cost (PLN)
                      </Label>
                      <Input
                        id="maintenance-cost"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 75.00"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.maintenanceCostMonthly}
                        onChange={(e) => setNewPrinter({ ...newPrinter, maintenanceCostMonthly: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-interval" className="text-gray-300">
                        Interval (days)
                      </Label>
                      <Input
                        id="maintenance-interval"
                        type="number"
                        placeholder="e.g. 90"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={newPrinter.maintenanceIntervalDays}
                        onChange={(e) => setNewPrinter({ ...newPrinter, maintenanceIntervalDays: parseInt(e.target.value) || 90 })}
                      />
                    </div>
                    {/* Calcul automatique */}
                    {newPrinter.maintenanceCostMonthly > 0 && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Annual Cost:</span>
                            <span className="text-white font-semibold">
                              {(newPrinter.maintenanceCostMonthly * 12).toFixed(2)} PLN
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Maintenances/Year:</span>
                            <span className="text-white font-semibold">
                              ≈ {Math.floor(365 / newPrinter.maintenanceIntervalDays)} interventions
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
