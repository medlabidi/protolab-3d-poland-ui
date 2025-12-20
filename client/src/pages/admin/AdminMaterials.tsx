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
import { Plus, Pencil, Trash2, Palette, Package, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Material {
  id: string;
  material_type: string;
  color: string;
  price_per_kg: number;
  stock_status: 'available' | 'low_stock' | 'out_of_stock';
  lead_time_days: number;
  hex_color?: string;
  description?: string;
  is_active: boolean;
}

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    material_type: "",
    color: "",
    price_per_kg: "",
    stock_status: "available" as 'available' | 'low_stock' | 'out_of_stock',
    lead_time_days: "0",
    hex_color: "#FFFFFF",
    description: "",
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/admin/materials", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingMaterial
      ? `/api/admin/materials/${editingMaterial.id}`
      : "/api/admin/materials";
    
    const method = editingMaterial ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          price_per_kg: parseFloat(formData.price_per_kg),
          lead_time_days: parseInt(formData.lead_time_days),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Material ${editingMaterial ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        resetForm();
        fetchMaterials();
      } else {
        throw new Error("Failed to save material");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save material",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      material_type: material.material_type,
      color: material.color,
      price_per_kg: material.price_per_kg.toString(),
      stock_status: material.stock_status,
      lead_time_days: material.lead_time_days.toString(),
      hex_color: material.hex_color || "#FFFFFF",
      description: material.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material deleted successfully",
        });
        // Update local state immediately
        setMaterials(prev => prev.filter(m => m.id !== id));
      } else {
        throw new Error("Failed to delete material");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Material ${!currentStatus ? "shown" : "hidden"} successfully`,
        });
        // Update local state immediately
        setMaterials(prev => prev.map(m => 
          m.id === id ? { ...m, is_active: !currentStatus } : m
        ));
      } else {
        throw new Error("Failed to update material");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update material visibility",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      material_type: "",
      color: "",
      price_per_kg: "",
      stock_status: "available",
      lead_time_days: "0",
      hex_color: "#FFFFFF",
      description: "",
    });
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.material_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.color.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMaterialType =
      materialTypeFilter === "all" || m.material_type === materialTypeFilter;
    
    const matchesStockStatus =
      stockStatusFilter === "all" || m.stock_status === stockStatusFilter;
    
    return matchesSearch && matchesMaterialType && matchesStockStatus;
  });

  // Get unique material types
  const materialTypes = Array.from(new Set(materials.map(m => m.material_type)));

  const getStockBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      available: { variant: "default", label: "Available" },
      low_stock: { variant: "secondary", label: "Low Stock" },
      out_of_stock: { variant: "destructive", label: "Out of Stock" },
    };

    const config = variants[status] || variants.available;
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
              <h1 className="text-3xl font-bold">Materials Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage 3D printing materials, colors, and pricing
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Edit Material" : "Add New Material"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMaterial
                      ? "Update material information and pricing"
                      : "Add a new material with color and pricing details"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material_type">Material Type</Label>
                      <Select
                        value={formData.material_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, material_type: value })
                        }
                        disabled={!!editingMaterial}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLA">PLA</SelectItem>
                          <SelectItem value="ABS">ABS</SelectItem>
                          <SelectItem value="PETG">PETG</SelectItem>
                          <SelectItem value="TPU">TPU</SelectItem>
                          <SelectItem value="Nylon">Nylon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="e.g., Red, Blue, Black"
                        required
                        disabled={!!editingMaterial}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price_per_kg">Price per kg (PLN)</Label>
                      <Input
                        id="price_per_kg"
                        type="number"
                        step="0.01"
                        value={formData.price_per_kg}
                        onChange={(e) =>
                          setFormData({ ...formData, price_per_kg: e.target.value })
                        }
                        placeholder="39.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hex_color">Hex Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="hex_color"
                          type="color"
                          value={formData.hex_color}
                          onChange={(e) =>
                            setFormData({ ...formData, hex_color: e.target.value })
                          }
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.hex_color}
                          onChange={(e) =>
                            setFormData({ ...formData, hex_color: e.target.value })
                          }
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_status">Stock Status</Label>
                      <Select
                        value={formData.stock_status}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, stock_status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lead_time_days">Lead Time (days)</Label>
                      <Input
                        id="lead_time_days"
                        type="number"
                        value={formData.lead_time_days}
                        onChange={(e) =>
                          setFormData({ ...formData, lead_time_days: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Additional information"
                    />
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
                      {editingMaterial ? "Update" : "Create"} Material
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
                <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{materials.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {materials.filter((m) => m.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Palette className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materials.filter((m) => m.stock_status === "available").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">In stock now</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <Palette className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materials.filter((m) => m.stock_status === "out_of_stock").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Need restock</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Materials List</CardTitle>
                  <CardDescription>
                    View and manage all materials with pricing
                  </CardDescription>
                </div>
                <Input
                  placeholder="Search materials..."
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
                    <TableHead>Color</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span>Material</span>
                        <Select value={materialTypeFilter} onValueChange={setMaterialTypeFilter}>
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {materialTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead>Price/kg</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="low_stock">Low Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No materials found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: material.hex_color || "#FFFFFF" }}
                            />
                            <span className="font-medium">{material.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>{material.material_type}</TableCell>
                        <TableCell>{material.price_per_kg.toFixed(2)} PLN</TableCell>
                        <TableCell>{getStockBadge(material.stock_status)}</TableCell>
                        <TableCell>
                          {material.lead_time_days > 0
                            ? `${material.lead_time_days} days`
                            : "Same day"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(material)}
                              title="Edit material"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(material.id, material.is_active)}
                              title={material.is_active ? "Hide from users" : "Show to users"}
                            >
                              {material.is_active ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(material.id)}
                              title="Delete material"
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
