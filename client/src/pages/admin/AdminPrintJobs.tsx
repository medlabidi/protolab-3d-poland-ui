import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { Eye, PackageCheck, Download, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  created_at: string;
  material: string;
  color: string;
  price: number;
  file_name: string;
  user_email?: string;
  quantity: number;
  layer_height: string;
  infill: string;
}

const AdminPrintJobs = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only print jobs (orders with files for printing)
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to fetch print jobs');
      }
    } catch (error) {
      console.error('Error fetching print jobs:', error);
      toast.error('Error loading print jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} PLN`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Loading print jobs...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <PackageCheck className="w-8 h-8 text-blue-500" />
                Print Jobs
              </h1>
              <p className="text-gray-400 mt-1">Manage all 3D printing orders</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800 text-white w-64"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{orders.length}</div>
                  <p className="text-sm text-gray-400 mt-1">Total Print Jobs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">
                    {orders.filter(o => o.status === 'printing').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Printing Now</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {orders.filter(o => o.status === 'in_queue').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">In Queue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {orders.filter(o => o.status === 'finished').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">All Print Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-4 text-sm font-bold text-gray-400 pb-2 px-4 border-b border-gray-800">
                  <div>Order ID</div>
                  <div>File Name</div>
                  <div>User</div>
                  <div>Material</div>
                  <div>Status</div>
                  <div>Payment</div>
                  <div>Price</div>
                  <div className="text-right">Actions</div>
                </div>
                
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <PackageCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No print jobs found</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-8 gap-4 items-center py-4 px-4 rounded-lg hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                    >
                      <div className="font-mono text-sm text-gray-300">
                        #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-white truncate" title={order.file_name}>
                        {order.file_name}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {order.user_email || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-semibold">{order.material?.toUpperCase()}</span>
                        <span className="text-gray-500 ml-1">({order.color})</span>
                      </div>
                      <div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div>
                        {order.payment_status && (
                          <PaymentStatusBadge status={order.payment_status} />
                        )}
                      </div>
                      <div className="font-bold text-green-400">
                        {formatPrice(order.price)}
                      </div>
                      <div className="text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="hover:bg-blue-500/20 text-blue-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-orange-500/20 text-orange-400"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-green-500/20 text-green-400"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPrintJobs;
