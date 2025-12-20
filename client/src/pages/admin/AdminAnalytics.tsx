import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  RefreshCw,
  Calendar,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topMaterials: { material: string; count: number; revenue: number }[];
  refundStats: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const daysAgo = parseInt(dateRange);
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await fetch(
        `${API_URL}/admin/analytics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} PLN`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500';
      case 'in_queue': return 'bg-yellow-500';
      case 'printing': return 'bg-purple-500';
      case 'finished': return 'bg-green-500';
      case 'delivered': return 'bg-emerald-500';
      case 'on_hold': return 'bg-amber-500';
      case 'suspended': return 'bg-red-500';
      case 'refund_requested': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="text-center text-gray-400">No analytics data available</div>
        </main>
      </div>
    );
  }

  const maxDailyRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue), 1);
  const maxDailyOrders = Math.max(...analytics.revenueByDay.map(d => d.orders), 1);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">Track your business performance and insights</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchAnalytics}
                variant="outline"
                size="icon"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(analytics.totalRevenue)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Avg: {formatCurrency(analytics.averageOrderValue)} per order
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-400" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {analytics.totalOrders}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {(analytics.totalOrders / parseInt(dateRange)).toFixed(1)} per day
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(analytics.averageOrderValue)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                  Refund Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {analytics.refundStats.pending}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {analytics.refundStats.completed} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Daily Revenue & Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple bar chart */}
                {analytics.revenueByDay.map((day) => (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{formatDate(day.date)}</span>
                      <div className="flex gap-4">
                        <span className="text-green-400">{formatCurrency(day.revenue)}</span>
                        <span className="text-blue-400">{day.orders} orders</span>
                      </div>
                    </div>
                    <div className="flex gap-2 h-2">
                      <div
                        className="bg-green-500/30 rounded"
                        style={{ width: `${(day.revenue / maxDailyRevenue) * 100}%` }}
                      />
                      <div
                        className="bg-blue-500/30 rounded"
                        style={{ width: `${(day.orders / maxDailyOrders) * 50}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders by Status */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Orders by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.ordersByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                        <span className="text-gray-300 capitalize">
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-white font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Materials */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Top Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topMaterials.map((material, index) => (
                    <div key={material.material} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">#{index + 1}</span>
                          <span className="text-white font-medium">{material.material}</span>
                        </div>
                        <span className="text-green-400">{formatCurrency(material.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{material.count} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Refund Statistics */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-500" />
                Refund Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Total Refunds</p>
                  <p className="text-2xl font-bold text-white">{analytics.refundStats.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold text-orange-400">{analytics.refundStats.pending}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.refundStats.completed}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(analytics.refundStats.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
