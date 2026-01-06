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
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
