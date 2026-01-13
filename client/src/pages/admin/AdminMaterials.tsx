import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Weight,
  Droplet,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [newMaterialType, setNewMaterialType] = useState("");
  const [newMaterialTypeDescription, setNewMaterialTypeDescription] = useState("");
  const [formData, setFormData] = useState({
    material_type: "PLA",
    color: "",
    hex_color: "#FFFFFF",
    price_per_kg: 0,
    stock_status: "available",
    supplier: "",
    description: "",
    is_active: true,
  });

  // Fetch materials, material types, and suppliers on mount
  useEffect(() => {
    fetchMaterials();
    fetchMaterialTypes();
    fetchSuppliers();
  }, []);

  const fetchMaterialTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/admin/material-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaterialTypes(data.materialTypes || []);
      } else {
        console.error('Material types fetch error');
      }
    } catch (error: any) {
      console.error('Error fetching material types:', error);
    }
  };
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.warn('No token found for fetching suppliers');
        return;
      }

      const response = await fetch(`${API_URL}/admin/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched suppliers:', data.suppliers);
        const activeSuppliers = (data.suppliers || []).filter((s: any) => s.active);
        setSuppliers(activeSuppliers);
        setFilteredSuppliers(activeSuppliers);
      } else {
        console.error('Failed to fetch suppliers:', response.status, response.statusText);
      }
    } catch (error: any) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  // Filter suppliers based on selected material type
  useEffect(() => {
    if (!formData.material_type) {
      setFilteredSuppliers([]);
      return;
    }

    if (suppliers.length === 0) {
      setFilteredSuppliers([]);
      return;
    }

    const selectedTypeId = materialTypes.find(mt => mt.name === formData.material_type)?.id;
    console.log('Filtering suppliers for material type:', formData.material_type, 'ID:', selectedTypeId);
    
    if (!selectedTypeId) {
      setFilteredSuppliers([]);
      return;
    }

    const filtered = suppliers.filter((supplier: any) => {
      const hasType = supplier.materials_supplied && supplier.materials_supplied.includes(selectedTypeId);
      console.log('Supplier:', supplier.name, 'materials_supplied:', supplier.materials_supplied, 'includes type?', hasType);
      return hasType;
    });
    
    console.log('Filtered suppliers:', filtered);
    setFilteredSuppliers(filtered);
  }, [formData.material_type, suppliers, materialTypes]);
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/admin/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Materials fetched:', data.materials);
        if (data.materials && data.materials.length > 0) {
          console.log('First material sample:', data.materials[0]);
          console.log('Material keys:', Object.keys(data.materials[0]));
        }
        setMaterials(data.materials || []);
      } else {
        const error = await response.json().catch(() => ({}));
        console.error('Materials fetch error:', error);
        toast.error(`Error: ${error.error || response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast.error(`Connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!formData.supplier.trim()) {
      toast.error("Supplier is required");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        material_type: formData.material_type,
        color: formData.color || formData.material_type,
        hex_color: formData.hex_color,
        price_per_kg: formData.price_per_kg,
        stock_status: formData.stock_status,
        supplier: formData.supplier,
        description: formData.description,
        is_active: formData.is_active
      };
      console.log('Creating material with payload:', payload);
      
      const response = await fetch(`${API_URL}/admin/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Material added successfully!");
        fetchMaterials(); // Refresh list
        setShowAddDialog(false);
        resetForm();
      } else {
        const error = await response.json().catch(() => ({}));
        console.error('Material creation error:', error);
        toast.error(`Error: ${error.error || error.details || 'Failed to add material'}`);
      }
    } catch (error: any) {
      console.error('Error adding material:', error);
      toast.error(`Connection error: ${error.message}`);
    }
  };

  const handleEditMaterial = async () => {
    if (!formData.supplier.trim()) {
      toast.error("Supplier is required");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        id: selectedMaterial.id,
        material_type: formData.material_type,
        color: formData.color || formData.material_type,
        hex_color: formData.hex_color,
        price_per_kg: formData.price_per_kg,
        stock_status: formData.stock_status,
        supplier: formData.supplier,
        description: formData.description,
        is_active: formData.is_active
      };
      
      const response = await fetch(`${API_URL}/admin/materials`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Material updated successfully!");
        fetchMaterials(); // Refresh list
        setShowEditDialog(false);
        setSelectedMaterial(null);
        resetForm();
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(`Error: ${error.error || 'Failed to update material'}`);
      }
    } catch (error: any) {
      console.error('Error updating material:', error);
      toast.error(`Connection error: ${error.message}`);
    }
  };

  const handleDeleteMaterial = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/materials?id=${selectedMaterial.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Material deleted successfully!");
        fetchMaterials(); // Refresh list
        setShowDeleteDialog(false);
        setSelectedMaterial(null);
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(`Error: ${error.error || 'Failed to delete material'}`);
      }
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast.error(`Connection error: ${error.message}`);
    }
  };

  const handleToggleActive = async (material: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/materials`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: material.id,
          is_active: !material.is_active,
        }),
      });

      if (response.ok) {
        toast.success(`Material ${material.is_active ? 'hidden' : 'activated'}!`);
        fetchMaterials(); // Refresh list
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(`Error: ${error.error || 'Failed to toggle material'}`);
      }
    } catch (error: any) {
      console.error('Error toggling material:', error);
      toast.error(`Connection error: ${error.message}`);
    }
  };

  const openEditDialog = (material: any) => {
    setSelectedMaterial(material);
    setFormData({
      material_type: material.material_type,
      color: material.color || "",
      hex_color: material.hex_color || "#FFFFFF",
      price_per_kg: material.price_per_kg,
      stock_status: material.stock_status || "available",
      supplier: material.supplier,
      description: material.description || "",
      is_active: material.is_active,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (material: any) => {
    setSelectedMaterial(material);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      material_type: "PLA",
      color: "",
      hex_color: "#FFFFFF",
      price_per_kg: 0,
      stock_status: "available",
      supplier: "",
      description: "",
      is_active: true,
    });
  };

  const getUniqueTypes = () => {
    // First, try to get types from material_types table
    if (materialTypes && materialTypes.length > 0) {
      return materialTypes
        .filter(mt => mt.is_active)
        .map(mt => mt.name)
        .sort();
    }
    
    // Fallback: extract unique types from existing materials if material_types table is empty
    const typesFromMaterials = materials
      .map(m => m.material_type)
      .filter(Boolean);
    return [...new Set(typesFromMaterials)].sort();
  };

  const getFilteredMaterials = () => {
    return materials.filter(material => {
      const typeMatch = typeFilter === "all" || material.material_type === typeFilter;
      const stockMatch = stockFilter === "all" || material.stock_status === stockFilter;
      return typeMatch && stockMatch;
    });
  };

  const getStockStatus = (stock: number) => {
    if (stock > 3) return { color: 'text-green-400', label: 'In Stock' };
    if (stock > 1) return { color: 'text-yellow-400', label: 'Low Stock' };
    return { color: 'text-red-400', label: 'Critical' };
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Materials Management</h1>
              <p className="text-gray-400">Manage your 3D printing materials and inventory</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => setShowAddTypeDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material Type
              </Button>
              <Button 
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={fetchMaterials}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Materials</p>
                <p className="text-2xl font-bold text-white">{materials.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Materials Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : getFilteredMaterials().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No materials found</p>
                  <p className="text-sm mt-1">Add your first material to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Color Swatch</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Color Code</th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-300">Type</span>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                              <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="all" className="text-white">All</SelectItem>
                                {getUniqueTypes().map(type => (
                                  <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price (PLN/kg)</th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-300">Stock Status</span>
                            <Select value={stockFilter} onValueChange={setStockFilter}>
                              <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="all" className="text-white">All</SelectItem>
                                <SelectItem value="available" className="text-white">Available</SelectItem>
                                <SelectItem value="low_stock" className="text-white">Low Stock</SelectItem>
                                <SelectItem value="out_of_stock" className="text-white">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Supplier</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Active</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {getFilteredMaterials().map(material => {
                        return (
                          <tr key={material.id} className={`hover:bg-gray-800/50 transition-colors ${!material.is_active ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                              <div
                                className="w-12 h-12 rounded-lg border border-gray-700"
                                style={{ backgroundColor: material.hex_color || material.color }}
                              ></div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-white font-mono text-sm">{material.color || 'N/A'}</p>
                              <p className="text-gray-400 text-xs">{material.hex_color || material.color}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm">
                                {material.material_type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white">{material.price_per_kg}</td>
                            <td className="px-6 py-4">
                              <Select
                                value={material.stock_status || "available"}
                                onValueChange={async (value) => {
                                  try {
                                    const token = localStorage.getItem('accessToken');
                                    const response = await fetch(`${API_URL}/admin/materials`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        id: material.id,
                                        stock_status: value,
                                      }),
                                    });
                                    if (response.ok) {
                                      toast.success("Stock status updated!");
                                      fetchMaterials();
                                    } else {
                                      toast.error("Failed to update stock status");
                                    }
                                  } catch (error) {
                                    toast.error("Error updating stock status");
                                  }
                                }}
                              >
                                <SelectTrigger className={`w-36 h-8 text-xs border-0 ${
                                  material.stock_status === 'available' ? 'bg-green-900/30 text-green-400' :
                                  material.stock_status === 'low_stock' ? 'bg-yellow-900/30 text-yellow-400' :
                                  'bg-red-900/30 text-red-400'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="available" className="text-white">Available</SelectItem>
                                  <SelectItem value="low_stock" className="text-white">Low Stock</SelectItem>
                                  <SelectItem value="out_of_stock" className="text-white">Out of Stock</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4 text-gray-400">{material.supplier}</td>
                            <td className="px-6 py-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(material)}
                                className={material.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}
                              >
                                {material.is_active ? (
                                  <>
                                    <Eye className="w-4 h-4 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-500 hover:text-white"
                                  onClick={() => openEditDialog(material)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-500 hover:text-red-400"
                                  onClick={() => openDeleteDialog(material)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Material Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Material</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the details for the new material
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Material Type *</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value) => setFormData({ ...formData, material_type: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {getUniqueTypes().map(type => (
                        <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Color Name</Label>
                  <Input
                    placeholder="White, Blue, Black..."
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Hex Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="bg-gray-800 border-gray-700 h-10 w-20"
                      value={formData.hex_color}
                      onChange={(e) => setFormData({ ...formData, hex_color: e.target.value })}
                    />
                    <Input
                      placeholder="#FFFFFF"
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                      value={formData.hex_color}
                      onChange={(e) => setFormData({ ...formData, hex_color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Price/kg (PLN)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Stock Status</Label>
                  <Select
                    value={formData.stock_status}
                    onValueChange={(value) => setFormData({ ...formData, stock_status: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="available" className="text-white">Available</SelectItem>
                      <SelectItem value="low_stock" className="text-white">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock" className="text-white">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Supplier *</Label>
                  {!formData.material_type ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-md p-3 text-yellow-400 text-sm">
                      ⚠️ Please select a material type first
                    </div>
                  ) : filteredSuppliers.length === 0 ? (
                    <div className="bg-gray-800 border border-red-700 rounded-md p-3 text-red-400 text-sm">
                      ❌ No suppliers provide this material type. Cannot add this material.
                    </div>
                  ) : (
                    <Select
                      value={formData.supplier}
                      onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {filteredSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.name} className="text-white">
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                  onClick={handleAddMaterial}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!formData.material_type || filteredSuppliers.length === 0}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Material Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Material</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Update the material information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Material Type *</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value) => setFormData({ ...formData, material_type: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {getUniqueTypes().map(type => (
                        <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Color Name</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Hex Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="bg-gray-800 border-gray-700 h-10 w-20"
                      value={formData.hex_color}
                      onChange={(e) => setFormData({ ...formData, hex_color: e.target.value })}
                    />
                    <Input
                      placeholder="#FFFFFF"
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                      value={formData.hex_color}
                      onChange={(e) => setFormData({ ...formData, hex_color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Price/kg (PLN)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Stock Status</Label>
                  <Select
                    value={formData.stock_status}
                    onValueChange={(value) => setFormData({ ...formData, stock_status: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="available" className="text-white">Available</SelectItem>
                      <SelectItem value="low_stock" className="text-white">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock" className="text-white">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Supplier *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {filteredSuppliers.length === 0 ? (
                        <SelectItem value="none" disabled className="text-gray-400">
                          No suppliers for this material type
                        </SelectItem>
                      ) : (
                        filteredSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.name} className="text-white">
                            {supplier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                  onClick={handleEditMaterial}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Material Type Dialog */}
          <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Material Type</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Add a new material type to the system (e.g., PLA, PETG, TPU, ABS)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Material Type Name *</Label>
                  <Input
                    placeholder="e.g., PLA, PETG, TPU, ABS, Nylon..."
                    className="bg-gray-800 border-gray-700 text-white"
                    value={newMaterialType}
                    onChange={(e) => setNewMaterialType(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Description (optional)</Label>
                  <Input
                    placeholder="Brief description of the material type..."
                    className="bg-gray-800 border-gray-700 text-white"
                    value={newMaterialTypeDescription}
                    onChange={(e) => setNewMaterialTypeDescription(e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-400">
                  <p className="font-semibold mb-1">Current Material Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {getUniqueTypes().map(type => (
                      <span key={type} className="px-2 py-1 bg-gray-800 rounded text-xs">{type}</span>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddTypeDialog(false);
                    setNewMaterialType("");
                    setNewMaterialTypeDescription("");
                  }}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (newMaterialType.trim()) {
                      if (getUniqueTypes().includes(newMaterialType.trim())) {
                        toast.error("Material type already exists");
                        return;
                      }
                      
                      try {
                        const token = localStorage.getItem('accessToken');
                        const response = await fetch(`${API_URL}/admin/material-types`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            name: newMaterialType.trim(),
                            description: newMaterialTypeDescription.trim() || null,
                          }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          toast.success(`Material type "${newMaterialType}" added successfully!`);
                          await fetchMaterialTypes(); // Refresh the list
                          setShowAddTypeDialog(false);
                          setNewMaterialType("");
                          setNewMaterialTypeDescription("");
                        } else {
                          const error = await response.json().catch(() => ({}));
                          toast.error(`Error: ${error.error || 'Failed to add material type'}`);
                        }
                      } catch (error: any) {
                        console.error('Error adding material type:', error);
                        toast.error(`Connection error: ${error.message}`);
                      }
                    } else {
                      toast.error("Please enter a material type name");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Type
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Confirmer la suppression</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Êtes-vous sûr de vouloir supprimer le matériau "{selectedMaterial?.name}" ?
                  Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteMaterial}
                  className="bg-red-600 hover:bg-red-700"
                >
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

export default AdminMaterials;

