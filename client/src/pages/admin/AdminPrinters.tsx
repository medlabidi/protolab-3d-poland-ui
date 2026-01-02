import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Printer, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Printer {
  id: string;
  name: string;
  model?: string;
  power_watts: number;
  cost_pln: number;
  lifespan_hours: number;
  maintenance_rate: number;
  build_volume_x?: number;
  build_volume_y?: number;
  build_volume_z?: number;
  max_print_speed?: number;
  nozzle_diameter?: number;
  layer_height_min?: number;
  layer_height_max?: number;
  supported_materials?: string[];
  status: 'operational' | 'maintenance' | 'offline';
  is_default: boolean;
  is_active: boolean;
}

export default function AdminPrinters() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    model: "",
    power_watts: "",
    cost_pln: "",
    lifespan_hours: "",
    maintenance_rate: "0.03",
    build_volume_x: "",
    build_volume_y: "",
    build_volume_z: "",
    max_print_speed: "",
    nozzle_diameter: "",
    layer_height_min: "",
    layer_height_max: "",
    supported_materials: [] as string[],
    status: "operational" as 'operational' | 'maintenance' | 'offline',
  });

  useEffect(() => {
    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    try {
      const response = await fetch("/api/admin/printers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrinters(Array.isArray(data.printers) ? data.printers : []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch printers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingPrinter
      ? `/api/admin/printers/${editingPrinter.id}`
      : "/api/admin/printers";
    
    const method = editingPrinter ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          model: formData.model || undefined,
          power_watts: parseFloat(formData.power_watts),
          cost_pln: parseFloat(formData.cost_pln),
          lifespan_hours: parseInt(formData.lifespan_hours),
          maintenance_rate: parseFloat(formData.maintenance_rate),
          build_volume_x: formData.build_volume_x ? parseInt(formData.build_volume_x) : undefined,
          build_volume_y: formData.build_volume_y ? parseInt(formData.build_volume_y) : undefined,
          build_volume_z: formData.build_volume_z ? parseInt(formData.build_volume_z) : undefined,
          max_print_speed: formData.max_print_speed ? parseInt(formData.max_print_speed) : undefined,
          nozzle_diameter: formData.nozzle_diameter ? parseFloat(formData.nozzle_diameter) : undefined,
          layer_height_min: formData.layer_height_min ? parseFloat(formData.layer_height_min) : undefined,
          layer_height_max: formData.layer_height_max ? parseFloat(formData.layer_height_max) : undefined,
          supported_materials: formData.supported_materials.length > 0 ? formData.supported_materials : undefined,
          status: formData.status,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Printer ${editingPrinter ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        resetForm();
        fetchPrinters();
      } else {
        throw new Error("Failed to save printer");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save printer",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (printer: Printer) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      model: printer.model || "",
      power_watts: printer.power_watts.toString(),
      cost_pln: printer.cost_pln.toString(),
      lifespan_hours: printer.lifespan_hours.toString(),
      maintenance_rate: printer.maintenance_rate.toString(),
      build_volume_x: printer.build_volume_x?.toString() || "",
      build_volume_y: printer.build_volume_y?.toString() || "",
      build_volume_z: printer.build_volume_z?.toString() || "",
      max_print_speed: printer.max_print_speed?.toString() || "",
      nozzle_diameter: printer.nozzle_diameter?.toString() || "",
      layer_height_min: printer.layer_height_min?.toString() || "",
      layer_height_max: printer.layer_height_max?.toString() || "",
      supported_materials: printer.supported_materials || [],
      status: printer.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this printer?")) return;

    try {
      const response = await fetch(`/api/admin/printers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Printer deleted successfully",
        });
        fetchPrinters();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete printer",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/printers/${id}/set-default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Default printer set successfully",
        });
        fetchPrinters();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default printer",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPrinter(null);
    setFormData({
      name: "",
      model: "",
      power_watts: "",
      cost_pln: "",
      lifespan_hours: "",
      maintenance_rate: "0.03",
      build_volume_x: "",
      build_volume_y: "",
      build_volume_z: "",
      max_print_speed: "",
      nozzle_diameter: "",
      layer_height_min: "",
      layer_height_max: "",
      supported_materials: [],
      status: "operational",
    });
  };

  const filteredPrinters = printers.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      operational: { variant: "default", label: "Operational" },
      maintenance: { variant: "secondary", label: "Maintenance" },
      offline: { variant: "destructive", label: "Offline" },
    };

    const config = variants[status] || variants.operational;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Printer Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage 3D printers and specifications for pricing calculations
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Printer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrinter ? "Edit Printer" : "Add New Printer"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure printer specifications for automatic pricing calculations
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Printer Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Ender 3 Pro"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        placeholder="e.g., CR-3045"
                      />
                    </div>
                  </div>

                  {/* Pricing Parameters */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Pricing Parameters</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="power_watts">Power (Watts) *</Label>
                        <Input
                          id="power_watts"
                          type="number"
                          step="0.01"
                          value={formData.power_watts}
                          onChange={(e) =>
                            setFormData({ ...formData, power_watts: e.target.value })
                          }
                          placeholder="270"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost_pln">Purchase Cost (PLN) *</Label>
                        <Input
                          id="cost_pln"
                          type="number"
                          step="0.01"
                          value={formData.cost_pln}
                          onChange={(e) =>
                            setFormData({ ...formData, cost_pln: e.target.value })
                          }
                          placeholder="3483.39"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lifespan_hours">Lifespan (Hours) *</Label>
                        <Input
                          id="lifespan_hours"
                          type="number"
                          value={formData.lifespan_hours}
                          onChange={(e) =>
                            setFormData({ ...formData, lifespan_hours: e.target.value })
                          }
                          placeholder="5000"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maintenance_rate">Maintenance Rate</Label>
                        <Input
                          id="maintenance_rate"
                          type="number"
                          step="0.0001"
                          value={formData.maintenance_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, maintenance_rate: e.target.value })
                          }
                          placeholder="0.03"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Build Volume */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Build Volume (mm)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="build_volume_x">X</Label>
                        <Input
                          id="build_volume_x"
                          type="number"
                          value={formData.build_volume_x}
                          onChange={(e) =>
                            setFormData({ ...formData, build_volume_x: e.target.value })
                          }
                          placeholder="220"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="build_volume_y">Y</Label>
                        <Input
                          id="build_volume_y"
                          type="number"
                          value={formData.build_volume_y}
                          onChange={(e) =>
                            setFormData({ ...formData, build_volume_y: e.target.value })
                          }
                          placeholder="220"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="build_volume_z">Z</Label>
                        <Input
                          id="build_volume_z"
                          type="number"
                          value={formData.build_volume_z}
                          onChange={(e) =>
                            setFormData({ ...formData, build_volume_z: e.target.value })
                          }
                          placeholder="250"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technical Specs */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Technical Specifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max_print_speed">Max Speed (mm/s)</Label>
                        <Input
                          id="max_print_speed"
                          type="number"
                          value={formData.max_print_speed}
                          onChange={(e) =>
                            setFormData({ ...formData, max_print_speed: e.target.value })
                          }
                          placeholder="200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nozzle_diameter">Nozzle Ø (mm)</Label>
                        <Input
                          id="nozzle_diameter"
                          type="number"
                          step="0.01"
                          value={formData.nozzle_diameter}
                          onChange={(e) =>
                            setFormData({ ...formData, nozzle_diameter: e.target.value })
                          }
                          placeholder="0.4"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="layer_height_min">Min Layer (mm)</Label>
                        <Input
                          id="layer_height_min"
                          type="number"
                          step="0.01"
                          value={formData.layer_height_min}
                          onChange={(e) =>
                            setFormData({ ...formData, layer_height_min: e.target.value })
                          }
                          placeholder="0.1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="layer_height_max">Max Layer (mm)</Label>
                        <Input
                          id="layer_height_max"
                          type="number"
                          step="0.01"
                          value={formData.layer_height_max}
                          onChange={(e) =>
                            setFormData({ ...formData, layer_height_max: e.target.value })
                          }
                          placeholder="0.3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPrinter ? "Update" : "Create"} Printer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Printers</CardTitle>
                <Printer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{printers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {printers.filter((p) => p.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operational</CardTitle>
                <Settings className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {printers.filter((p) => p.status === "operational").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ready to print</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <Settings className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {printers.filter((p) => p.status === "maintenance" || p.status === "offline").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Printers List</CardTitle>
                  <CardDescription>
                    View and manage all 3D printers
                  </CardDescription>
                </div>
                <Input
                  placeholder="Search printers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Power</TableHead>
                    <TableHead>Build Volume</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPrinters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No printers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrinters.map((printer) => (
                      <TableRow key={printer.id}>
                        <TableCell className="font-medium">{printer.name}</TableCell>
                        <TableCell>{printer.model || "-"}</TableCell>
                        <TableCell>{printer.power_watts}W</TableCell>
                        <TableCell>
                          {printer.build_volume_x && printer.build_volume_y && printer.build_volume_z
                            ? `${printer.build_volume_x}×${printer.build_volume_y}×${printer.build_volume_z}mm`
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(printer.status)}</TableCell>
                        <TableCell>
                          {printer.is_default ? (
                            <Badge variant="default" className="bg-green-600">Default</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(printer.id)}
                              disabled={!printer.is_active || printer.status !== 'operational'}
                            >
                              Set as Default
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(printer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(printer.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
