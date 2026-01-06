import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Pencil,
  Palette,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { OrderTimeline } from "@/components/OrderTimeline";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  file_name: string;
  status: string;
  price: number;
  paid_amount?: number;
  payment_status?: string;
  created_at: string;
  order_type: 'print' | 'design';
  users?: { name: string; email: string };
  order_number?: string;
  model_url?: string;
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

const AdminOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingOrderDetails(true);
    setShowOrderDetails(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la commande",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

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
                          onClick={() => fetchOrderDetails(order.id)}
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

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedOrder?.order_type === 'design' ? '🎨 Design Assistance' : '📦 Print Job'} - Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete order information
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

              {/* Order Details Grid */}
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

export default AdminOrders;
