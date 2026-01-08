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
} from "lucide-react";
import { toast } from "sonner";

const AdminPrinters = () => {
  const [printers, setPrinters] = useState([
    {
      id: 1,
      name: "Prusa i3 MK3S+",
      status: "online",
      currentJob: "Bracket Assembly v2.STL",
      progress: 45,
      temperature: 210,
      bedTemp: 60,
      uptime: "98.2%",
      totalPrints: 342,
      lastMaintenance: "2026-01-03",
    },
    {
      id: 2,
      name: "Creality Ender 3 Pro",
      status: "online",
      currentJob: "None",
      progress: 0,
      temperature: 180,
      bedTemp: 45,
      uptime: "96.5%",
      totalPrints: 512,
      lastMaintenance: "2025-12-28",
    },
    {
      id: 3,
      name: "Anycubic i3 Mega",
      status: "offline",
      currentJob: "None",
      progress: 0,
      temperature: 25,
      bedTemp: 25,
      uptime: "0%",
      totalPrints: 198,
      lastMaintenance: "2025-12-15",
    },
    {
      id: 4,
      name: "Artillery Sidewinder X1",
      status: "maintenance",
      currentJob: "Waiting",
      progress: 0,
      temperature: 85,
      bedTemp: 40,
      uptime: "82.1%",
      totalPrints: 287,
      lastMaintenance: "2026-01-06",
    },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPrinter, setNewPrinter] = useState({
    name: "",
    status: "offline",
    temperature: 25,
    bedTemp: 25,
  });

  const handleStatusChange = (printerId: number, newStatus: string) => {
    setPrinters(printers.map(printer => 
      printer.id === printerId 
        ? { ...printer, status: newStatus }
        : printer
    ));
    toast.success(`Statut de l'imprimante mis à jour: ${newStatus}`);
  };

  const handleAddPrinter = () => {
    if (!newPrinter.name.trim()) {
      toast.error("Le nom de l'imprimante est requis");
      return;
    }

    const printer = {
      id: printers.length + 1,
      name: newPrinter.name,
      status: newPrinter.status,
      currentJob: "None",
      progress: 0,
      temperature: newPrinter.temperature,
      bedTemp: newPrinter.bedTemp,
      uptime: "0%",
      totalPrints: 0,
      lastMaintenance: new Date().toISOString().split('T')[0],
    };

    setPrinters([...printers, printer]);
    toast.success("Imprimante ajoutée avec succès!");
    setShowAddDialog(false);
    setNewPrinter({
      name: "",
      status: "offline",
      temperature: 25,
      bedTemp: 25,
    });
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
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white">
                      <SettingsIcon className="w-4 h-4" />
                    </Button>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Printer Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Ajouter une nouvelle imprimante</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Remplissez les informations de la nouvelle imprimante 3D
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="printer-name" className="text-gray-300">Nom de l'imprimante *</Label>
                  <Input
                    id="printer-name"
                    placeholder="Ex: Prusa i3 MK4"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={newPrinter.name}
                    onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printer-status" className="text-gray-300">Statut initial</Label>
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
                    <Label htmlFor="nozzle-temp" className="text-gray-300">Temp. buse (°C)</Label>
                    <Input
                      id="nozzle-temp"
                      type="number"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.temperature}
                      onChange={(e) => setNewPrinter({ ...newPrinter, temperature: parseInt(e.target.value) || 25 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bed-temp" className="text-gray-300">Temp. plateau (°C)</Label>
                    <Input
                      id="bed-temp"
                      type="number"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={newPrinter.bedTemp}
                      onChange={(e) => setNewPrinter({ ...newPrinter, bedTemp: parseInt(e.target.value) || 25 })}
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
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddPrinter}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ajouter l'imprimante
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
