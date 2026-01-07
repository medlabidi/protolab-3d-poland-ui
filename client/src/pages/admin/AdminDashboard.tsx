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
  Palette,
  Boxes,
  Pencil,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { OrderTimeline } from "@/components/OrderTimeline";
import { toast } from "sonner";

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
  printJobs: number;
  designJobs: number;
}

interface RecentOrder {
  id: string;
  order_number?: string;
  file_name: string;
  status: string;
  price: number;
  created_at: string;
  users?: { name: string; email: string };
  order_type?: 'print' | 'design';
  file_url?: string;
  material?: string;
  color?: string;
  layer_height?: string;
  infill?: string;
  quantity?: number;
  shipping_method?: string;
  shipping_address?: string;
  material_weight?: string;
  print_time?: string;
  tracking_code?: string;
  notes?: string;
  design_description?: string;
  design_requirements?: string;
  reference_images?: string[];
  parent_order_id?: string;
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
    printJobs: 0,
    designJobs: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [printJobs, setPrintJobs] = useState<RecentOrder[]>([]);
  const [designJobs, setDesignJobs] = useState<RecentOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('🔐 Admin Token:', token ? 'Present' : 'Missing');
      console.log('🌐 API URL:', `${API_URL}/admin/orders`);
      
      // Fetch all orders (admin endpoint)
      const ordersResponse = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('📡 Orders Response Status:', ordersResponse.status);
      
      if (!ordersResponse.ok) {
        const errorText = await ordersResponse.text();
        console.error('❌ Failed to fetch orders:', {
          status: ordersResponse.status,
          statusText: ordersResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch orders: ${ordersResponse.status} ${errorText}`);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('📦 Orders Data:', ordersData);
        const orders = ordersData.orders || [];
        console.log('📊 Total Orders Count:', orders.length);

        // Categorize orders by order_type field (fallback to file_name detection)
        const printOrders = orders.filter((o: any) => {
          if (o.order_type) {
            return o.order_type === 'print';
          }
          // Fallback: detect by file_name
          const fileName = (o.file_name || '').toLowerCase();
          return !fileName.includes('design') && !fileName.includes('assistance') && !fileName.includes('request');
        });
        
        const designOrders = orders.filter((o: any) => {
          if (o.order_type) {
            return o.order_type === 'design';
          }
          // Fallback: detect by file_name
          const fileName = (o.file_name || '').toLowerCase();
          return fileName.includes('design') || fileName.includes('assistance') || fileName.includes('request');
        });

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
          printJobs: printOrders.length,
          designJobs: designOrders.length,
        });

        setRecentOrders(orders.slice(0, 5));
        setPrintJobs(printOrders.slice(0, 5));
        setDesignJobs(designOrders.slice(0, 5));
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
      console.error('❌ Failed to fetch dashboard data:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingOrderDetails(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderDetails(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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
              <Card key={index} className="bg-gray-900 border-gray-800 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                    {stat.title}
                    <stat.icon className="w-4 h-4 text-gray-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                  <div className={`text-sm ${stat.changeType === 'positive' ? 'text-green-400' : stat.changeType === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Type Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Print Jobs Block */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-blue-500" />
                    Print Jobs
                    <span className="text-sm font-normal text-gray-400">({stats.printJobs})</span>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/orders/print-jobs')}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-800">
                  {printJobs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Boxes className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No print jobs yet</p>
                    </div>
                  ) : (
                    printJobs.map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div 
                            className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" 
                            onClick={() => fetchOrderDetails(order.id)}
                          >
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusColor(order.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate hover:text-blue-400 transition-colors">{order.file_name}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                              </p>
                              <p className="text-sm font-medium text-blue-400 mt-1">{formatPrice(order.price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8 bg-gray-800 border-gray-700 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="in_queue">In Queue</SelectItem>
                                <SelectItem value="printing">Printing</SelectItem>
                                <SelectItem value="finished">Finished</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 text-xs border-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                              onClick={() => fetchOrderDetails(order.id)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Design Assistance Jobs Block */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    Design Assistance
                    <span className="text-sm font-normal text-gray-400">({stats.designJobs})</span>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/orders/design-assistance')}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-800">
                  {designJobs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No design requests yet</p>
                    </div>
                  ) : (
                    designJobs.map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div 
                            className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" 
                            onClick={() => fetchOrderDetails(order.id)}
                          >
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusColor(order.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate hover:text-purple-400 transition-colors">{order.file_name}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                              </p>
                              <p className="text-sm font-medium text-purple-400 mt-1">{formatPrice(order.price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8 bg-gray-800 border-gray-700 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="in_queue">In Review</SelectItem>
                                <SelectItem value="printing">In Progress</SelectItem>
                                <SelectItem value="finished">Completed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="suspended">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 text-xs border-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white hover:border-purple-600"
                              onClick={() => fetchOrderDetails(order.id)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </div>
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
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedOrder?.order_type === 'design' ? '🎨 Design Assistance Request' : '📦 Print Job'} 
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedOrder?.file_name || 'Order details and specifications'}
            </DialogDescription>
          </DialogHeader>

          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              {/* Parent Order Link */}
              {selectedOrder.parent_order_id && (
                <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-300">Created from design request</p>
                        <p className="text-white font-medium">Parent Order: #{selectedOrder.parent_order_id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowOrderDetails(false);
                        navigate(`/admin/orders/${selectedOrder.parent_order_id}`);
                      }}
                      className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Design
                    </Button>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Timeline</h3>
                <OrderTimeline currentStatus={selectedOrder.status} />
              </div>

              {/* Design Details Section (only for design orders) */}
              {selectedOrder.order_type === 'design' && (
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Design Project Details
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.design_description && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-purple-300 uppercase tracking-wide mb-2">Description</p>
                        <p className="text-white leading-relaxed">{selectedOrder.design_description}</p>
                      </div>
                    )}
                    
                    {selectedOrder.design_requirements && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-purple-300 uppercase tracking-wide mb-2">Requirements</p>
                        <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedOrder.design_requirements}</p>
                      </div>
                    )}

                    {selectedOrder.reference_images && selectedOrder.reference_images.length > 0 && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-purple-300 uppercase tracking-wide mb-3">Reference Images</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(selectedOrder.reference_images as string[]).map((img, idx) => (
                            <img 
                              key={idx}
                              src={img}
                              alt={`Reference ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-700"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3D Model Viewer */}
              {selectedOrder.file_url && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-200">
                      {selectedOrder.order_type === 'design' ? '📄 Reference File' : '🎨 3D Model'}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedOrder.file_url;
                        link.download = selectedOrder.file_name;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="border-blue-500 text-blue-300 hover:bg-blue-500/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download 3D
                    </Button>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <ModelViewerUrl 
                      url={selectedOrder.file_url}
                      fileName={selectedOrder.file_name}
                      height="400px"
                    />
                  </div>
                </div>
              )}

              {/* Order Details Grid - Only for Print Jobs */}
              {selectedOrder.order_type !== 'design' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-200">Print Parameters</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Material</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.material || 'Not specified'}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Color</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.color || 'Not specified'}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Layer Height</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.layer_height || 'Not specified'}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Infill</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.infill || 'Not specified'}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Quantity</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.quantity || 1}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Price</p>
                        <p className="font-medium text-white mt-1">{formatPrice(selectedOrder.price)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Technical Stats */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-200">Technical Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Material Weight</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.material_weight || 'Not calculated'}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Print Time</p>
                        <p className="font-medium text-white mt-1">{selectedOrder.print_time || 'Not calculated'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Design Order Info - Only for Design Jobs */}
              {selectedOrder.order_type === 'design' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-200">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">Price</p>
                      <p className="font-medium text-white mt-1">{formatPrice(selectedOrder.price)}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="font-medium text-white mt-1">{capitalizeFirst(selectedOrder.status)}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">Order Number</p>
                      <p className="font-medium text-white mt-1">{selectedOrder.order_number || selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">Date Created</p>
                      <p className="font-medium text-white mt-1">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Shipping</h3>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Shipping Method</p>
                    <p className="font-medium text-white mt-1">{capitalizeFirst(selectedOrder.shipping_method || 'Not specified')}</p>
                  </div>
                  {selectedOrder.shipping_address && (
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="font-medium text-white mt-1 whitespace-pre-line">{selectedOrder.shipping_address}</p>
                    </div>
                  )}
                  {selectedOrder.tracking_code && (
                    <div>
                      <p className="text-sm text-gray-400">Tracking Code</p>
                      <p className="font-medium text-white mt-1">{selectedOrder.tracking_code}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-200">Notes</h3>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-white whitespace-pre-line">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOrderDetails(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
            {selectedOrder && (
              <Button
                onClick={() => {
                  setShowOrderDetails(false);
                  navigate(`/admin/orders/${selectedOrder.id}`);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Pencil className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
