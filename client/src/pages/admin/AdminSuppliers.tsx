import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Package,
  User,
  Globe,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: number;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  website?: string;
  materials_supplied: number[]; // Material type IDs
  delivery_time: string;
  notes?: string;
  total_orders: number;
  active: boolean;
}

interface MaterialType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>([0]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    website: "",
    delivery_time: "",
    notes: "",
    active: true,
  });

  useEffect(() => {
    fetchMaterialTypes();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.warn('No access token found');
        return;
      }

      const response = await fetch('/api/admin/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      } else {
        const text = await response.text();
        console.error('Error fetching suppliers:', {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchMaterialTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.warn('No access token found');
        setMaterialTypes([]);
        return;
      }

      const response = await fetch('/api/admin/material-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const types = data.materialTypes || data;
        setMaterialTypes(Array.isArray(types) ? types.filter((mt: MaterialType) => mt.is_active) : []);
      } else {
        const text = await response.text();
        console.error('Error fetching material types:', {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        setMaterialTypes([]);
      }
    } catch (error) {
      console.error('Error fetching material types:', error);
      setMaterialTypes([]);
    }
  };

  const addMaterialTypeField = () => {
    setSelectedMaterialTypes([...selectedMaterialTypes, 0]);
  };

  const removeMaterialTypeField = (index: number) => {
    setSelectedMaterialTypes(selectedMaterialTypes.filter((_, i) => i !== index));
  };

  const updateMaterialType = (index: number, value: number) => {
    const updated = [...selectedMaterialTypes];
    updated[index] = value;
    setSelectedMaterialTypes(updated);
  };

  const handleAddSupplier = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        name: formData.name,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        website: formData.website,
        materials_supplied: selectedMaterialTypes.filter(id => id > 0),
        delivery_time: formData.delivery_time,
        notes: formData.notes,
        active: formData.active,
      };
      
      console.log('Adding supplier with payload:', payload);
      
      const response = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Supplier added successfully:', data.supplier);
        setSuppliers([...suppliers, data.supplier]);
        toast.success("Supplier added successfully!");
        setShowAddDialog(false);
        resetForm();
      } else {
        const error = await response.json();
        console.error('Failed to add supplier:', error);
        toast.error(error.error || "Failed to add supplier");
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error("Failed to add supplier");
    }
  };

  const handleEditSupplier = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (!selectedSupplier) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/admin/suppliers?id=${selectedSupplier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          website: formData.website,
          materials_supplied: selectedMaterialTypes.filter(id => id > 0),
          delivery_time: formData.delivery_time,
          notes: formData.notes,
          active: formData.active,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? data.supplier : s));
        toast.success("Supplier modified successfully!");
        setShowEditDialog(false);
        setSelectedSupplier(null);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update supplier");
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error("Failed to update supplier");
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/admin/suppliers?id=${selectedSupplier.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuppliers(suppliers.filter(s => s.id !== selectedSupplier.id));
        toast.success("Supplier deleted successfully!");
        setShowDeleteDialog(false);
        setSelectedSupplier(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete supplier");
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error("Failed to delete supplier");
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      postal_code: supplier.postal_code,
      country: supplier.country,
      website: supplier.website || "",
      delivery_time: supplier.delivery_time,
      notes: supplier.notes || "",
      active: supplier.active,
    });
    setSelectedMaterialTypes(supplier.materials_supplied.length > 0 ? supplier.materials_supplied : [0]);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteDialog(true);
  };

  const openDetailsDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal_code: "",
      country: "",
      website: "",
      delivery_time: "",
      notes: "",
      active: true,
    });
    setSelectedMaterialTypes([0]);
  };

  const activeSuppliers = suppliers.filter(s => s.active);
  const totalOrders = suppliers.reduce((sum, s) => sum + s.total_orders, 0);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Suppliers Management</h1>
              <p className="text-gray-400">Manage your material suppliers</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suppliers.map(supplier => (
              <Card key={supplier.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:border-blue-600 transition-colors">
                <CardHeader className="border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{supplier.name}</h3>
                        <p className="text-sm text-gray-400">{supplier.contact_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${supplier.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {supplier.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{supplier.city}, {supplier.country}</span>
                    </div>
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <Globe className="w-4 h-4" />
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {supplier.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Materials */}
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">Materials supplied:</p>
                    <div className="flex flex-wrap gap-1">
                      {supplier.materials_supplied.map((materialTypeId, idx) => {
                        const materialType = materialTypes.find(mt => mt.id === materialTypeId);
                        return materialType ? (
                          <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            {materialType.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="pt-2 border-t border-gray-800 text-xs">
                    <div>
                      <p className="text-gray-500">Delivery time</p>
                      <p className="text-white font-medium">{supplier.delivery_time}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      onClick={() => openDetailsDialog(supplier)}
                    >
                      Details
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-white"
                      onClick={() => openEditDialog(supplier)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-red-400"
                      onClick={() => openDeleteDialog(supplier)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Supplier Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Supplier</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in all supplier information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Company Info */}
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Information
                  </h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Company Name *</Label>
                  <Input
                    placeholder="e.g. Prusament"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Contact Name</Label>
                  <Input
                    placeholder="e.g. John Smith"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>

                {/* Contact Info */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact
                  </h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Email *</Label>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    placeholder="+48 123 456 789"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Website</Label>
                  <Input
                    placeholder="https://example.com"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                {/* Address */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h3>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Address</Label>
                  <Input
                    placeholder="123 Main Street"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">City</Label>
                  <Input
                    placeholder="Warsaw"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Postal Code</Label>
                  <Input
                    placeholder="00-001"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Country</Label>
                  <Input
                    placeholder="Poland"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>

                {/* Business Details */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Business Details
                  </h3>
                </div>
                <div className="space-y-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Materials Supplied</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addMaterialTypeField}
                      className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Material Type
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedMaterialTypes.map((materialTypeId, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select
                          value={materialTypeId.toString()}
                          onValueChange={(value) => updateMaterialType(index, parseInt(value))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select material type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="0" className="text-gray-400">Select material type</SelectItem>
                            {materialTypes.map((mt) => (
                              <SelectItem key={mt.id} value={mt.id.toString()} className="text-white">
                                {mt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedMaterialTypes.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMaterialTypeField(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Delivery Time</Label>
                  <Input
                    placeholder="3-5 days"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="active" className="text-gray-300 cursor-pointer">Active Supplier</Label>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
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
                  onClick={handleAddSupplier}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Supplier Dialog - Same structure as Add */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Supplier</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Edit supplier information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Same form structure as Add Dialog */}
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Information
                  </h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Company Name *</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Contact Name</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact
                  </h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Email *</Label>
                  <Input
                    type="email"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Website</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h3>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Address</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">City</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Postal Code</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Country</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Business Details
                  </h3>
                </div>
                <div className="space-y-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Materials Supplied</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addMaterialTypeField}
                      className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Material Type
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedMaterialTypes.map((materialTypeId, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select
                          value={materialTypeId.toString()}
                          onValueChange={(value) => updateMaterialType(index, parseInt(value))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select material type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="0" className="text-gray-400">Select material type</SelectItem>
                            {materialTypes.map((mt) => (
                              <SelectItem key={mt.id} value={mt.id.toString()} className="text-white">
                                {mt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedMaterialTypes.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMaterialTypeField(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Delivery Time</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="edit-active" className="text-gray-300 cursor-pointer">Active Supplier</Label>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Notes</Label>
                  <Textarea
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
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
                  onClick={handleEditSupplier}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Supplier Details</DialogTitle>
              </DialogHeader>
              {selectedSupplier && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Building2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedSupplier.name}</h3>
                      <p className="text-gray-400">{selectedSupplier.contact_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="text-white">{selectedSupplier.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="text-white">{selectedSupplier.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Full Address</p>
                      <p className="text-white">
                        {selectedSupplier.address}<br />
                        {selectedSupplier.postal_code} {selectedSupplier.city}<br />
                        {selectedSupplier.country}
                      </p>
                    </div>
                    {selectedSupplier.website && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Website</p>
                        <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {selectedSupplier.website}
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Delivery Time</p>
                      <p className="text-white">{selectedSupplier.delivery_time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                      <p className="text-white">{selectedSupplier.total_orders}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-2">Materials Supplied</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSupplier.materials_supplied.map((materialTypeId, idx) => {
                          const materialType = materialTypes.find(mt => mt.id === materialTypeId);
                          return materialType ? (
                            <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded">
                              {materialType.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    {selectedSupplier.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Notes</p>
                        <p className="text-gray-300">{selectedSupplier.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button 
                  onClick={() => setShowDetailsDialog(false)}
                  className="bg-gray-800 hover:bg-gray-700"
                >
                  Close
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
                  Are you sure you want to delete the supplier "{selectedSupplier?.name}"?
                  This action is irreversible.
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
                  onClick={handleDeleteSupplier}
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

export default AdminSuppliers;
