import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

const AdminMaterials = () => {
  // Liste des fournisseurs disponibles
  const availableSuppliers = [
    "Prusament",
    "NinjaTek",
    "MatterHackers",
    "FormFutura",
    "ColorFabb",
    "eSun",
    "Polymaker",
    "3DJake",
  ];

  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: "PLA - White",
      type: "PLA",
      color: "#FFFFFF",
      pricePerKg: 18.99,
      density: 1.24,
      stock: 5.2,
      printTemp: 200,
      bedTemp: 60,
      supplier: "Prusament",
      lastRestocked: "2026-01-02",
    },
    {
      id: 2,
      name: "PLA - Black",
      type: "PLA",
      color: "#000000",
      pricePerKg: 18.99,
      density: 1.24,
      stock: 3.8,
      printTemp: 200,
      bedTemp: 60,
      supplier: "Prusament",
      lastRestocked: "2025-12-28",
    },
    {
      id: 3,
      name: "PETG - Clear",
      type: "PETG",
      color: "#E8F4F8",
      pricePerKg: 24.99,
      density: 1.27,
      stock: 2.1,
      printTemp: 230,
      bedTemp: 80,
      supplier: "Prusament",
      lastRestocked: "2025-12-20",
    },
    {
      id: 4,
      name: "TPU - Flexible",
      type: "TPU",
      color: "#FF6B6B",
      pricePerKg: 39.99,
      density: 1.21,
      stock: 0.9,
      printTemp: 220,
      bedTemp: 60,
      supplier: "NinjaTek",
      lastRestocked: "2025-12-15",
    },
    {
      id: 5,
      name: "Nylon - Natural",
      type: "Nylon",
      color: "#F5E6D3",
      pricePerKg: 34.99,
      density: 1.14,
      stock: 1.5,
      printTemp: 240,
      bedTemp: 85,
      supplier: "MatterHackers",
      lastRestocked: "2026-01-01",
    },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "PLA",
    color: "#FFFFFF",
    pricePerKg: 0,
    density: 1.24,
    stock: 0,
    printTemp: 200,
    bedTemp: 60,
    supplier: "",
  });

  const handleAddMaterial = () => {
    if (!formData.name.trim() || !formData.supplier.trim()) {
      toast.error("Le nom et le fournisseur sont requis");
      return;
    }

    const newMaterial = {
      id: materials.length + 1,
      ...formData,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    setMaterials([...materials, newMaterial]);
    toast.success("Matériau ajouté avec succès!");
    setShowAddDialog(false);
    resetForm();
  };

  const handleEditMaterial = () => {
    if (!formData.name.trim() || !formData.supplier.trim()) {
      toast.error("Le nom et le fournisseur sont requis");
      return;
    }

    setMaterials(materials.map(m => 
      m.id === selectedMaterial.id 
        ? { ...m, ...formData }
        : m
    ));
    toast.success("Matériau modifié avec succès!");
    setShowEditDialog(false);
    setSelectedMaterial(null);
    resetForm();
  };

  const handleDeleteMaterial = () => {
    setMaterials(materials.filter(m => m.id !== selectedMaterial.id));
    toast.success("Matériau supprimé avec succès!");
    setShowDeleteDialog(false);
    setSelectedMaterial(null);
  };

  const openEditDialog = (material: any) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      color: material.color,
      pricePerKg: material.pricePerKg,
      density: material.density,
      stock: material.stock,
      printTemp: material.printTemp,
      bedTemp: material.bedTemp,
      supplier: material.supplier,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (material: any) => {
    setSelectedMaterial(material);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "PLA",
      color: "#FFFFFF",
      pricePerKg: 0,
      density: 1.24,
      stock: 0,
      printTemp: 200,
      bedTemp: 60,
      supplier: "",
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
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Materials</p>
                <p className="text-2xl font-bold text-white">{materials.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Stock</p>
                <p className="text-2xl font-bold text-blue-400">{materials.reduce((sum, m) => sum + m.stock, 0).toFixed(1)} kg</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Inventory Value</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${(materials.reduce((sum, m) => sum + (m.stock * m.pricePerKg), 0)).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-400">{materials.filter(m => m.stock < 2).length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Materials Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Material</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stock</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price/kg</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Temps</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Supplier</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {materials.map(material => {
                      const stockStatus = getStockStatus(material.stock);
                      return (
                        <tr key={material.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg border border-gray-700"
                                style={{ backgroundColor: material.color }}
                              ></div>
                              <p className="font-medium text-white">{material.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm">
                              {material.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className={`font-semibold ${stockStatus.color}`}>{material.stock} kg</p>
                              <p className={`text-xs ${stockStatus.color}`}>{stockStatus.label}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">${material.pricePerKg}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            <div>{material.printTemp}°C / {material.bedTemp}°C</div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{material.supplier}</td>
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
            </CardContent>
          </Card>

          {/* Add Material Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Ajouter un nouveau matériau</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Remplissez les informations du nouveau matériau
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nom *</Label>
                  <Input
                    placeholder="Ex: PLA - White"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Type</Label>
                  <Input
                    placeholder="PLA, PETG, TPU..."
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Couleur</Label>
                  <Input
                    type="color"
                    className="bg-gray-800 border-gray-700 h-10"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Prix/kg ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Densité</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.density}
                    onChange={(e) => setFormData({ ...formData, density: parseFloat(e.target.value) || 1.24 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Stock (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Temp. impression (°C)</Label>
                  <Input
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.printTemp}
                    onChange={(e) => setFormData({ ...formData, printTemp: parseInt(e.target.value) || 200 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Temp. plateau (°C)</Label>
                  <Input
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.bedTemp}
                    onChange={(e) => setFormData({ ...formData, bedTemp: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Fournisseur *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Sélectionnez un fournisseur" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {availableSuppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier} className="text-white">
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  onClick={handleAddMaterial}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Material Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Modifier le matériau</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Modifiez les informations du matériau
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nom *</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Type</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Couleur</Label>
                  <Input
                    type="color"
                    className="bg-gray-800 border-gray-700 h-10"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Prix/kg ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Densité</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.density}
                    onChange={(e) => setFormData({ ...formData, density: parseFloat(e.target.value) || 1.24 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Stock (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Temp. impression (°C)</Label>
                  <Input
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.printTemp}
                    onChange={(e) => setFormData({ ...formData, printTemp: parseInt(e.target.value) || 200 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Temp. plateau (°C)</Label>
                  <Input
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.bedTemp}
                    onChange={(e) => setFormData({ ...formData, bedTemp: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Fournisseur *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Sélectionnez un fournisseur" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {availableSuppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier} className="text-white">
                          {supplier}
                        </SelectItem>
                      ))}
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
                  Annuler
                </Button>
                <Button 
                  onClick={handleEditMaterial}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sauvegarder
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
                  Annuler
                </Button>
                <Button 
                  onClick={handleDeleteMaterial}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
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
