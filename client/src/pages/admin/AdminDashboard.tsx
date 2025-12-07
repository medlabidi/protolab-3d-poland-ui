import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Users, 
  DollarSign, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  ArrowUpRight,
  Loader2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  ordersToday: number;
  revenueToday: number;
}

interface RecentOrder {
  id: string;
  order_number?: string;
  file_name: string;
  status: string;
  price: number;
  created_at: string;
  users?: { name: string; email: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    ordersToday: 0,
    revenueToday: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch all orders (admin endpoint)
      const ordersResponse = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.orders || [];

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter((o: any) => 
          o.created_at.split('T')[0] === today
        );

        const pendingStatuses = ['submitted', 'in_queue', 'printing', 'on_hold'];
        const completedStatuses = ['finished', 'delivered'];

        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => pendingStatuses.includes(o.status)).length,
          completedOrders: orders.filter((o: any) => completedStatuses.includes(o.status)).length,
          totalRevenue: orders
            .filter((o: any) => o.status !== 'suspended' && o.payment_status !== 'refunded')
            .reduce((sum: number, o: any) => sum + (parseFloat(o.paid_amount) || parseFloat(o.price) || 0), 0),
          totalUsers: 0, // Will be fetched from users endpoint
          activeUsers: 0,
          ordersToday: todayOrders.length,
          revenueToday: todayOrders
            .filter((o: any) => o.status !== 'suspended')
            .reduce((sum: number, o: any) => sum + (parseFloat(o.price) || 0), 0),
        });

        setRecentOrders(orders.slice(0, 5));
      }

      // Fetch users count
      try {
        const usersResponse = await fetch(`${API_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setStats(prev => ({
            ...prev,
            totalUsers: usersData.users?.length || 0,
          }));
        }
      } catch {
        // Users endpoint may not exist yet
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number | null | undefined) => `${(price ?? 0).toFixed(2)} PLN`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      change: `+${stats.ordersToday} today`,
      changeType: "positive" as const,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      change: "Needs attention",
      changeType: "warning" as const,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: CheckCircle2,
      change: "All time",
      changeType: "positive" as const,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      change: `+${formatPrice(stats.revenueToday)} today`,
      changeType: "positive" as const,
      color: "from-purple-500 to-pink-500",
    },
  ] as const;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening with your business.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card 
                key={stat.title}
                className="bg-gray-900 border-gray-800 overflow-hidden group hover:border-gray-700 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.changeType === 'positive' ? 'text-green-400' :
                      stat.changeType === 'warning' ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {stat.changeType === 'positive' && <ArrowUpRight className="w-4 h-4" />}
                      {stat.changeType === 'warning' && <AlertCircle className="w-4 h-4" />}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Recent Orders
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-800">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                        <div>
                          <p className="font-medium text-white">{order.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-white">{formatPrice(order.price)}</p>
                          <p className="text-xs text-gray-500 capitalize">{order.status.replace('_', ' ')}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 cursor-pointer hover:from-blue-500 hover:to-blue-600 transition-all"
              onClick={() => navigate('/admin/orders')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Manage Orders</p>
                  <p className="text-blue-200 text-sm">View and process orders</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 cursor-pointer hover:from-purple-500 hover:to-purple-600 transition-all"
              onClick={() => navigate('/admin/users')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Manage Users</p>
                  <p className="text-purple-200 text-sm">View customer accounts</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 cursor-pointer hover:from-green-500 hover:to-green-600 transition-all"
              onClick={() => navigate('/admin/printers')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Printer Status</p>
                  <p className="text-green-200 text-sm">Monitor your printers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
