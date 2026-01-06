import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Weight,
  Droplet,
} from "lucide-react";

const AdminMaterials = () => {
  const [materials] = useState([
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
            <Button className="bg-blue-600 hover:bg-blue-700">
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
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-400">
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
        </div>
      </main>
    </div>
  );
};

export default AdminMaterials;
