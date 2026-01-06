import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { Eye, Palette, Download, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: OrderStatus;
  file_name: string;
  file_url?: string;
  price: number;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  created_at: string;
  user_email?: string;
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
  order_type?: 'print' | 'design';
  design_description?: string;
  design_requirements?: string;
  reference_images?: string[];
  parent_order_id?: string;
  users?: { name: string; email: string };
}

const AdminDesignAssistance = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

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
        // Filter only design assistance orders
        const designOrders = (data.orders || []).filter((order: Order) => order.order_type === 'design');
        setOrders(designOrders);
      } else {
        toast.error('Failed to fetch design assistance orders');
      }
    } catch (error) {
      console.error('Error fetching design assistance orders:', error);
      toast.error('Error loading design assistance orders');
    } finally {
      setLoading(false);
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
        fetchOrders();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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

  const handleDownload3DFile = (order: Order) => {
    if (!order.file_url) {
      toast.error('No file available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = order.file_url;
    link.download = order.file_name || 'design-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.design_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return `${price.toFixed(2)} PLN`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Palette className="w-8 h-8 text-purple-500" />
                Design Assistance Orders
              </h1>
              <p className="text-gray-400 mt-1">Manage custom design requests and assistance orders</p>
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
                  <p className="text-sm text-gray-400 mt-1">Total Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">
                    {orders.filter(o => o.status === 'submitted' || o.status === 'in_queue').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {orders.filter(o => o.status === 'printing').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {orders.filter(o => o.status === 'finished' || o.status === 'delivered').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">All Design Assistance Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-4 text-sm font-bold text-gray-400 pb-2 px-4 border-b border-gray-800">
                  <div>Order ID</div>
                  <div>Project Name</div>
                  <div>User</div>
                  <div>Description</div>
                  <div>Status</div>
                  <div>Payment</div>
                  <div>Price</div>
                  <div className="text-right">Actions</div>
                </div>
                
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No design assistance orders found</p>
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
                      <div className="text-sm text-gray-400 truncate" title={order.design_description}>
                        {order.design_description || 'No description'}
                      </div>
                      <div>
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
                            <SelectItem value="printing">In Progress</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
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
                          className="hover:bg-purple-500/20 text-purple-400"
                          onClick={() => fetchOrderDetails(order.id)}
                        >
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
      </main>
      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl text-white">Design Assistance Order Details</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Order ID: {selectedOrder?.id}
                </DialogDescription>
              </div>
              {selectedOrder?.file_url && (
                <Button
                  onClick={() => selectedOrder && handleDownload3DFile(selectedOrder)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          </DialogHeader>

          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              {/* 3D Model Viewer */}
              {selectedOrder.file_url && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Reference File / 3D Model</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-950 rounded-lg p-4">
                      <ModelViewerUrl url={selectedOrder.file_url} fileName={selectedOrder.file_name} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Design Details */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Design Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Project Name</label>
                      <p className="text-white font-medium">{selectedOrder.file_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <p className="text-white font-medium capitalize">{selectedOrder.status}</p>
                    </div>
                  </div>

                  {selectedOrder.design_description && (
                    <div>
                      <label className="text-sm text-gray-400">Description</label>
                      <p className="text-white">{selectedOrder.design_description}</p>
                    </div>
                  )}

                  {selectedOrder.design_requirements && (
                    <div>
                      <label className="text-sm text-gray-400">Requirements</label>
                      <p className="text-white whitespace-pre-wrap">{selectedOrder.design_requirements}</p>
                    </div>
                  )}

                  {selectedOrder.reference_images && selectedOrder.reference_images.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-400">Reference Images</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {selectedOrder.reference_images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Reference ${idx + 1}`} 
                            className="w-full h-32 object-cover rounded border border-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOrder.parent_order_id && (
                    <div>
                      <label className="text-sm text-gray-400">Linked to Print Order</label>
                      <p className="text-purple-400 font-mono">#{selectedOrder.parent_order_id.slice(0, 8)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer & Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Customer Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{selectedOrder.user_email || selectedOrder.users?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Name</label>
                      <p className="text-white">{selectedOrder.users?.name || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Payment Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Price</label>
                      <p className="text-white font-bold text-xl">{formatPrice(selectedOrder.price)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Payment Status</label>
                      <div className="mt-1">
                        {selectedOrder.payment_status && (
                          <PaymentStatusBadge status={selectedOrder.payment_status} amount={selectedOrder.paid_amount} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Timeline */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline currentStatus={selectedOrder.status} />
                </CardContent>
              </Card>

              {selectedOrder.notes && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No order details available
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)} className="border-gray-700 text-white hover:bg-gray-800">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignAssistance;
