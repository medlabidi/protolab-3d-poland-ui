import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Download,
  LineChart,
  Wrench,
  AlertTriangle,
} from "lucide-react";

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month');

  const analyticsData = {
    month: {
      orders: 125,
      revenue: 4250.50,
      avgOrderValue: 34.00,
      newUsers: 12,
      completionRate: 87.5,
      topMaterial: "PLA White",
    },
    week: {
      orders: 28,
      revenue: 945.20,
      avgOrderValue: 33.76,
      newUsers: 3,
      completionRate: 89.3,
      topMaterial: "PETG Clear",
    },
  };

  // Données de maintenance des imprimantes
  const maintenanceData = {
    printers: [
      { name: "Prusa i3 MK3S+", costMonthly: 75.00, status: "operational" },
      { name: "Creality Ender 3 Pro", costMonthly: 50.00, status: "operational" },
      { name: "Anycubic i3 Mega", costMonthly: 45.00, status: "offline" },
      { name: "Artillery Sidewinder X1", costMonthly: 60.00, status: "maintenance" },
    ],
    totalMonthly: 230.00,
    totalAnnual: 2760.00,
    avgPerPrinter: 57.50,
    overdueCount: 1,
  };

  const current = analyticsData[timeRange as keyof typeof analyticsData];

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reports</h1>
              <p className="text-gray-400">Business performance and insights</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                onClick={() => setTimeRange('week')}
                className={timeRange === 'week' ? 'bg-blue-600' : 'border-gray-700 text-gray-300'}
              >
                <Calendar className="w-4 h-4 mr-2" />
                This Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeRange('month')}
                className={timeRange === 'month' ? 'bg-blue-600' : 'border-gray-700 text-gray-300'}
              >
                <Calendar className="w-4 h-4 mr-2" />
                This Month
              </Button>
              <Button variant="outline" className="border-gray-700 text-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm mb-2">Total Orders</p>
                    <p className="text-4xl font-bold text-white">{current.orders}</p>
                    <p className="text-blue-200 text-xs mt-2">+12% from last period</p>
                  </div>
                  <div className="p-4 bg-blue-700/50 rounded-xl">
                    <Package className="w-8 h-8 text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm mb-2">Total Revenue</p>
                    <p className="text-4xl font-bold text-white">${current.revenue.toFixed(2)}</p>
                    <p className="text-green-200 text-xs mt-2">+8% from last period</p>
                  </div>
                  <div className="p-4 bg-green-700/50 rounded-xl">
                    <DollarSign className="w-8 h-8 text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm mb-2">New Users</p>
                    <p className="text-4xl font-bold text-white">{current.newUsers}</p>
                    <p className="text-purple-200 text-xs mt-2">Active registrations</p>
                  </div>
                  <div className="p-4 bg-purple-700/50 rounded-xl">
                    <Users className="w-8 h-8 text-purple-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">${current.avgOrderValue.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">Average per order</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{current.completionRate.toFixed(1)}%</p>
                <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${current.completionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-purple-400" />
                  Top Material
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-white">{current.topMaterial}</p>
                <p className="text-gray-400 text-sm mt-2">Most ordered material</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Orders Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Top 5 Most Ordered Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'PLA White', orders: 45, revenue: 1240 },
                  { name: 'PETG Clear', orders: 28, revenue: 980 },
                  { name: 'PLA Black', orders: 22, revenue: 756 },
                  { name: 'TPU Flexible', orders: 18, revenue: 850 },
                  { name: 'Nylon Natural', orders: 12, revenue: 424 },
                ].map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{((product.revenue / current.revenue) * 100).toFixed(1)}% of revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Analytics Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-blue-400" />
                  Analyse des Coûts de Maintenance
                </h2>
                <p className="text-gray-400 mt-1">Vue d'ensemble des dépenses de maintenance du parc d'imprimantes</p>
              </div>
            </div>

            {/* Maintenance Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-300 text-sm mb-1">Coût Mensuel Total</p>
                      <p className="text-3xl font-bold text-white">
                        {maintenanceData.totalMonthly.toFixed(2)} PLN
                      </p>
                      <p className="text-orange-400 text-xs mt-1">
                        {maintenanceData.printers.length} imprimantes actives
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm mb-1">Projection Annuelle</p>
                      <p className="text-3xl font-bold text-white">
                        {maintenanceData.totalAnnual.toFixed(2)} PLN
                      </p>
                      <p className="text-blue-400 text-xs mt-1">
                        ≈ {(maintenanceData.totalAnnual / 12).toFixed(0)} PLN/mois
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm mb-1">Moyenne/Imprimante</p>
                      <p className="text-3xl font-bold text-white">
                        {maintenanceData.avgPerPrinter.toFixed(2)} PLN
                      </p>
                      <p className="text-purple-400 text-xs mt-1">
                        Par mois
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Wrench className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-300 text-sm mb-1">Maintenances En Retard</p>
                      <p className="text-3xl font-bold text-white">
                        {maintenanceData.overdueCount}
                      </p>
                      <p className="text-red-400 text-xs mt-1">
                        Action requise
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance Cost by Printer */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Coûts de Maintenance par Imprimante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceData.printers.map((printer, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            printer.status === 'operational' ? 'bg-green-500' :
                            printer.status === 'maintenance' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <span className="text-white font-medium">{printer.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">{printer.costMonthly.toFixed(2)} PLN/mois</span>
                          <span className="text-gray-400 text-sm ml-2">
                            ({((printer.costMonthly / maintenanceData.totalMonthly) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${(printer.costMonthly / maintenanceData.totalMonthly) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Coût annuel: {(printer.costMonthly * 12).toFixed(2)} PLN</span>
                        <span>≈ 4 maintenances/an</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">Ratio Maintenance/Revenu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Revenu mensuel:</span>
                      <span className="text-white font-semibold">{current.revenue.toFixed(2)} PLN</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Coût maintenance:</span>
                      <span className="text-white font-semibold">{maintenanceData.totalMonthly.toFixed(2)} PLN</span>
                    </div>
                    <div className="h-px bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Ratio:</span>
                      <span className="text-xl font-bold text-white">
                        {((maintenanceData.totalMonthly / current.revenue) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-sm text-blue-300">
                        {((maintenanceData.totalMonthly / current.revenue) * 100) < 10 
                          ? '✅ Excellent ratio maintenance/revenu' 
                          : '⚠️ Ratio élevé, optimisation possible'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">Efficacité du Parc</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Imprimantes actives:</span>
                      <span className="text-white font-semibold">{maintenanceData.printers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Opérationnelles:</span>
                      <span className="text-green-400 font-semibold">
                        {maintenanceData.printers.filter(p => p.status === 'operational').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">En maintenance:</span>
                      <span className="text-yellow-400 font-semibold">
                        {maintenanceData.printers.filter(p => p.status === 'maintenance').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Hors ligne:</span>
                      <span className="text-red-400 font-semibold">
                        {maintenanceData.printers.filter(p => p.status === 'offline').length}
                      </span>
                    </div>
                    <div className="h-px bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Taux d'utilisation:</span>
                      <span className="text-xl font-bold text-white">
                        {((maintenanceData.printers.filter(p => p.status === 'operational').length / maintenanceData.printers.length) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
