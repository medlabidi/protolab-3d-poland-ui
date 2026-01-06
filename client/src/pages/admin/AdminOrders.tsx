import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  file_name: string;
  status: string;
  price: number;
  paid_amount?: number;
  payment_status?: string;
  created_at: string;
  users?: { name: string; email: string };
  order_number?: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch orders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/20 text-blue-400';
      case 'in_queue': return 'bg-yellow-500/20 text-yellow-400';
      case 'printing': return 'bg-purple-500/20 text-purple-400';
      case 'finished': return 'bg-green-500/20 text-green-400';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400';
      case 'on_hold': return 'bg-amber-500/20 text-amber-400';
      case 'suspended': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'printing':
      case 'in_queue':
        return <Clock className="w-4 h-4" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['submitted', 'in_queue', 'printing', 'on_hold'].includes(order.status);
    if (filter === 'completed') return ['finished', 'delivered'].includes(order.status);
    if (filter === 'suspended') return order.status === 'suspended';
    return true;
  });

  const formatPrice = (price: number | null | undefined) => `${(price ?? 0).toFixed(2)} PLN`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
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

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Orders Management</h1>
              <p className="text-gray-400">Total Orders: {orders.length}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-700 text-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'suspended', label: 'Suspended' },
                ].map(f => (
                  <Button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    variant={filter === f.id ? 'default' : 'outline'}
                    className={filter === f.id ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300'}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {f.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Order</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No orders found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-white">{order.file_name}</p>
                              <p className="text-xs text-gray-500">{order.id.substring(0, 8)}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white">{order.users?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{order.users?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="capitalize text-sm">{order.status.replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">{formatPrice(order.price)}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Orders</p>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{orders.filter(o => ['submitted', 'in_queue', 'printing', 'on_hold'].includes(o.status)).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-400">{orders.filter(o => ['finished', 'delivered'].includes(o.status)).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatPrice(orders.filter(o => o.status !== 'suspended').reduce((sum, o) => sum + (parseFloat(o.price?.toString() || '0') || 0), 0))}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
