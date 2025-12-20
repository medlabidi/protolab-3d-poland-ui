import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useNetworkReconnect } from "@/hooks/useNetworkReconnect";

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
  project_name?: string;
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
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  // Handle network reconnection
  useNetworkReconnect(() => {
    console.log('Reconnected, refreshing admin dashboard data');
    fetchDashboardData(true);
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.tokens.accessToken;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
    
    // Token refresh failed, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
    return null;
  };

  const fetchDashboardData = async (retry = true) => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }
      
      // Fetch all orders (admin endpoint)
      let ordersResponse = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // If unauthorized, try to refresh token
      if (ordersResponse.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchDashboardData(false);
        }
        return;
      }

      if (!ordersResponse.ok) {
        console.error('Failed to fetch orders:', ordersResponse.status);
        toast.error('Failed to load dashboard data. Please refresh the page.');
        setLoading(false);
        return;
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.orders || [];

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter((o: any) => 
          o.created_at.split('T')[0] === today
        );

        const pendingStatuses = ['submitted']; // Only submitted orders need attention
        const completedStatuses = ['finished', 'delivered'];

        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => o.status === 'submitted').length,
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

        // Store all orders for filtering by status in different sections
        setRecentOrders(orders);
      } else {
        toast.error('Failed to load orders data');
      }

      // Fetch users count
      try {
        let usersResponse = await fetch(`${API_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        // Handle token refresh for users endpoint too
        if (usersResponse.status === 401 && retry) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            token = newToken;
            usersResponse = await fetch(`${API_URL}/admin/users`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
          }
        }
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setStats(prev => ({
            ...prev,
            totalUsers: usersData.users?.length || 0,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        // Users endpoint error is non-critical
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      let response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      // If unauthorized, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
          response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          });
        } else {
          return;
        }
      }

      if (response.ok) {
        toast.success('Order status updated');
        fetchDashboardData(false); // Refresh dashboard without retry
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Network error. Please check your connection.');
    }
  };

  const handleOrderClick = (order: RecentOrder) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
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
      title: "Orders Need Attention",
      value: stats.pendingOrders,
      icon: AlertCircle,
      change: "Submitted - needs review",
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
                className={`bg-gray-900 border-gray-800 overflow-hidden group hover:border-gray-700 transition-all ${
                  stat.title === 'Orders Need Attention' ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (stat.title === 'Orders Need Attention') {
                    navigate('/admin/orders?status=submitted');
                  }
                }}
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

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Submitted Orders */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Submitted ({recentOrders.filter(o => o.status === 'submitted').length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin/orders?status=submitted')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-800">
                  {recentOrders.filter(o => o.status === 'submitted').length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No submitted orders</p>
                    </div>
                  ) : (
                    recentOrders.filter(o => o.status === 'submitted').slice(0, 5).map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{order.file_name}</p>
                              {order.project_name && (
                                <p className="text-xs text-blue-400">Project: {order.project_name}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white text-sm">{formatPrice(order.price)}</p>
                          </div>
                        </div>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleQuickStatusUpdate(order.id, value)}
                        >
                          <SelectTrigger className="w-full bg-gray-800 border-gray-700 h-8">
                            <Badge className={`${getStatusColor(order.status)} text-white border-0 text-xs`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="in_queue">In Queue</SelectItem>
                            <SelectItem value="printing">Printing</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* In-Queue Orders */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  In Queue ({recentOrders.filter(o => o.status === 'in_queue').length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin/orders?status=in_queue')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-800">
                  {recentOrders.filter(o => o.status === 'in_queue').length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No orders in queue</p>
                    </div>
                  ) : (
                    recentOrders
                      .filter(o => o.status === 'in_queue')
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // FIFO order
                      .slice(0, 5)
                      .map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{order.file_name}</p>
                              {order.project_name && (
                                <p className="text-xs text-yellow-400">Project: {order.project_name}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white text-sm">{formatPrice(order.price)}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => handleQuickStatusUpdate(order.id, value)}
                          >
                            <SelectTrigger className="w-full bg-gray-800 border-gray-700 h-8">
                              <Badge className={`${getStatusColor(order.status)} text-white border-0 text-xs`}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_queue">In Queue</SelectItem>
                              <SelectItem value="printing">Printing</SelectItem>
                              <SelectItem value="finished">Finished</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Printing Orders */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-purple-500" />
                  Printing ({recentOrders.filter(o => o.status === 'printing').length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin/orders?status=printing')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-800">
                  {recentOrders.filter(o => o.status === 'printing').length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Printer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No orders printing</p>
                    </div>
                  ) : (
                    recentOrders.filter(o => o.status === 'printing').slice(0, 5).map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{order.file_name}</p>
                              {order.project_name && (
                                <p className="text-xs text-purple-400">Project: {order.project_name}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white text-sm">{formatPrice(order.price)}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => handleQuickStatusUpdate(order.id, value)}
                          >
                            <SelectTrigger className="w-full bg-gray-800 border-gray-700 h-8">
                              <Badge className={`${getStatusColor(order.status)} text-white border-0 text-xs`}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="printing">Printing</SelectItem>
                              <SelectItem value="finished">Finished</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Refund Requests */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Refund Requests ({recentOrders.filter(o => o.status === 'refund_requested').length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin/orders?status=refund_requested')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Review All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-800">
                  {recentOrders.filter(o => o.status === 'refund_requested').length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No pending refund requests</p>
                    </div>
                  ) : (
                    recentOrders.filter(o => o.status === 'refund_requested').slice(0, 5).map((order) => (
                      <div 
                        key={order.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <div>
                            <p className="font-medium text-white">{order.file_name}</p>
                            {order.project_name && (
                              <p className="text-xs text-red-400">Project: {order.project_name}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-white">{formatPrice(order.price)}</p>
                            <p className="text-xs text-red-400">Needs Review</p>
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
          </div>

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

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Order Details - #{selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about this print job
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">File Name</label>
                  <p className="text-white font-medium mt-1">{selectedOrder.file_name}</p>
                </div>
                {selectedOrder.project_name && (
                  <div>
                    <label className="text-sm text-gray-400">Project Name</label>
                    <p className="text-white font-medium mt-1">{selectedOrder.project_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-400">Customer</label>
                  <p className="text-white font-medium mt-1">{selectedOrder.users?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.users?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selectedOrder.status)} text-white border-0`}>
                      {selectedOrder.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Price</label>
                  <p className="text-white font-medium text-lg mt-1">{formatPrice(selectedOrder.price)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white font-medium mt-1">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <Button
                  onClick={() => {
                    navigate(`/admin/orders/${selectedOrder.id}`);
                    setOrderDialogOpen(false);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => {
                    handleQuickStatusUpdate(selectedOrder.id, value);
                    setOrderDialogOpen(false);
                  }}
                >
                  <SelectTrigger className="flex-1 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_queue">In Queue</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
