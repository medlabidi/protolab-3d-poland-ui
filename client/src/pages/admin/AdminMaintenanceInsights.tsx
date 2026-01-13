import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wrench, 
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Printer {
  id: string;
  name: string;
  model: string;
  status: string;
  maintenance_rate: number;
}

interface Maintenance {
  id: string;
  printer_id: string;
  type: 'preventive' | 'corrective' | 'predictive';
  description: string;
  cost: number;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

const AdminMaintenanceInsights = () => {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    printer_id: '',
    type: 'preventive' as 'preventive' | 'corrective' | 'predictive',
    description: '',
    cost: 0,
    scheduled_date: '',
    notes: '',
  });

  const [maintenanceRate, setMaintenanceRate] = useState(0);

  useEffect(() => {
    fetchPrinters();
    fetchMaintenances();
  }, []);

  const fetchPrinters = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrinters(data.printers || []);
      }
    } catch (error) {
      console.error('Failed to fetch printers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch printers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenances = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/maintenances`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenances(data.maintenances || []);
      }
    } catch (error) {
      console.error('Failed to fetch maintenances:', error);
    }
  };

  const handleAddMaintenance = async () => {
    if (!maintenanceForm.printer_id || !maintenanceForm.description || !maintenanceForm.scheduled_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/maintenances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...maintenanceForm,
          status: 'scheduled',
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Maintenance scheduled successfully",
        });
        setShowAddDialog(false);
        resetForm();
        fetchMaintenances();
      } else {
        throw new Error('Failed to schedule maintenance');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule maintenance",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMaintenanceRate = async () => {
    if (!selectedPrinter) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/printers/${selectedPrinter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          maintenance_rate: maintenanceRate,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Maintenance rate updated successfully",
        });
        setShowRateDialog(false);
        fetchPrinters();
      } else {
        throw new Error('Failed to update maintenance rate');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update maintenance rate",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/maintenances/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Maintenance deleted successfully",
        });
        fetchMaintenances();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete maintenance",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setMaintenanceForm({
      printer_id: '',
      type: 'preventive',
      description: '',
      cost: 0,
      scheduled_date: '',
      notes: '',
    });
  };

  const openRateDialog = (printer: Printer) => {
    setSelectedPrinter(printer);
    setMaintenanceRate(printer.maintenance_rate || 0);
    setShowRateDialog(true);
  };

  const getMaintenanceTypeColor = (type: string) => {
    switch (type) {
      case 'preventive': return 'bg-blue-500/20 text-blue-400';
      case 'corrective': return 'bg-red-500/20 text-red-400';
      case 'predictive': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPrinterName = (printer_id: string) => {
    const printer = printers.find(p => p.id === printer_id);
    return printer ? printer.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Maintenance Management</h1>
              <p className="text-gray-400">Schedule maintenance and manage maintenance rates for pricing calculations</p>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>

          {/* Printers with Maintenance Rates */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Printers & Maintenance Rates</CardTitle>
              <CardDescription className="text-gray-400">
                Maintenance rates are used in price calculations. Update manually until sufficient data is collected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-800/50 hover:bg-gray-800/50 border-gray-800">
                      <TableHead className="text-gray-300">Printer</TableHead>
                      <TableHead className="text-gray-300">Model</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300 text-right">Maintenance Rate (PLN/h)</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printers.map((printer) => (
                      <TableRow key={printer.id} className="border-gray-800 hover:bg-gray-800/30">
                        <TableCell className="text-white font-medium">{printer.name}</TableCell>
                        <TableCell className="text-gray-300">{printer.model}</TableCell>
                        <TableCell>
                          <Badge className={
                            printer.status === 'operational' ? 'bg-green-500/20 text-green-400' :
                            printer.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }>
                            {printer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-white font-medium">
                          {printer.maintenance_rate?.toFixed(2) || '0.00'} PLN/h
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRateDialog(printer)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Schedule */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wrench className="w-5 h-5" />
                Maintenance Schedule
              </CardTitle>
              <CardDescription className="text-gray-400">
                Track preventive, corrective, and predictive maintenance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenances.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No maintenance scheduled yet</p>
                  <p className="text-gray-500 text-sm">Click "Schedule Maintenance" to add your first maintenance</p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800/50 hover:bg-gray-800/50 border-gray-800">
                        <TableHead className="text-gray-300">Printer</TableHead>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Description</TableHead>
                        <TableHead className="text-gray-300 text-right">Cost (PLN)</TableHead>
                        <TableHead className="text-gray-300">Scheduled Date</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenances.map((maintenance) => (
                        <TableRow key={maintenance.id} className="border-gray-800 hover:bg-gray-800/30">
                          <TableCell className="text-white font-medium">
                            {getPrinterName(maintenance.printer_id)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMaintenanceTypeColor(maintenance.type)}>
                              {maintenance.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300 max-w-xs truncate">
                            {maintenance.description}
                          </TableCell>
                          <TableCell className="text-right text-white font-medium">
                            {maintenance.cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(maintenance.scheduled_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(maintenance.status)}>
                              {maintenance.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMaintenance(maintenance.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Maintenance Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule Maintenance</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new maintenance activity for a printer
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-gray-300">Printer *</Label>
              <Select
                value={maintenanceForm.printer_id}
                onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, printer_id: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select printer" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {printers.map((printer) => (
                    <SelectItem key={printer.id} value={printer.id} className="text-white">
                      {printer.name} - {printer.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Maintenance Type *</Label>
              <Select
                value={maintenanceForm.type}
                onValueChange={(value: any) => setMaintenanceForm({ ...maintenanceForm, type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="preventive" className="text-white">Preventive</SelectItem>
                  <SelectItem value="corrective" className="text-white">Corrective</SelectItem>
                  <SelectItem value="predictive" className="text-white">Predictive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Scheduled Date *</Label>
              <Input
                type="date"
                className="bg-gray-800 border-gray-700 text-white"
                value={maintenanceForm.scheduled_date}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-gray-300">Description *</Label>
              <Input
                placeholder="Brief description of maintenance..."
                className="bg-gray-800 border-gray-700 text-white"
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Cost (PLN)</Label>
              <Input
                type="number"
                step="0.01"
                className="bg-gray-800 border-gray-700 text-white"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-gray-300">Notes (optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                className="bg-gray-800 border-gray-700 text-white"
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
              />
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
              onClick={handleAddMaintenance}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Maintenance Rate Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Update Maintenance Rate</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set the maintenance rate for {selectedPrinter?.name}. This rate is used in price calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Maintenance Rate (PLN/hour) *</Label>
              <Input
                type="number"
                step="0.01"
                className="bg-gray-800 border-gray-700 text-white"
                value={maintenanceRate}
                onChange={(e) => setMaintenanceRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">
                This rate will be calculated automatically in the future based on monthly maintenance costs
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRateDialog(false)}
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateMaintenanceRate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMaintenanceInsights;
