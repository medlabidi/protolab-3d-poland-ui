import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { Eye, PackageCheck, Download, Printer, Search, Loader2, Pencil, Package, Palette } from "lucide-react";
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
  payment_status?: PaymentStatus;
  paid_amount?: number;
  created_at: string;
  order_type: 'print' | 'design';
  material: string;
  color: string;
  price: number;
  file_name: string;
  file_url?: string;
  user_email?: string;
  quantity: number;
  layer_height: string;
  infill: string;
  shipping_method?: string;
  shipping_address?: string;
  material_weight?: number;
  print_time?: number;
  tracking_code?: string;
  notes?: string;
  design_description?: string;
  design_requirements?: string;
  reference_images?: string[];
  parent_order_id?: string;
  users?: { name: string; email: string };
}

const AdminPrintJobs = () => {
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

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
                          onClick={() => fetchOrderDetails(order.id)}
                          disabled={loadingOrderDetails}
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

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
            {loadingOrderDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-3 text-gray-300">Chargement...</span>
              </div>
            ) : selectedOrder ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-3 text-white">
                    Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}
                    <StatusBadge status={selectedOrder.status} />
                    {selectedOrder.payment_status && (
                      <PaymentStatusBadge 
                        status={selectedOrder.payment_status} 
                        amount={selectedOrder.paid_amount}
                      />
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {selectedOrder.order_type === 'design' ? '🎨 Design Assistance' : '📦 Print Job'} • 📅 {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')} • 💰 {selectedOrder.price.toFixed(2)} PLN
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Parent Order Link */}
                  {selectedOrder.parent_order_id && (
                    <Card className="bg-purple-900/20 border-purple-700">
                      <CardContent className="py-4 flex items-center justify-between">
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
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OrderTimeline currentStatus={selectedOrder.status} />
                    </CardContent>
                  </Card>

                  {/* Design Details Section (only for design orders) */}
                  {selectedOrder.order_type === 'design' && (
                    <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700/50">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Palette className="w-5 h-5 text-purple-400" />
                          Détails du projet de design
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                              {selectedOrder.reference_images.map((img, idx) => (
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
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {selectedOrder.file_url && (
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">
                            {selectedOrder.order_type === 'design' ? '📄 Reference File' : '🎨 3D Model'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ModelViewerUrl 
                            url={selectedOrder.file_url} 
                            fileName={selectedOrder.file_name}
                            height="250px"
                          />
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-sm text-gray-400">{selectedOrder.file_name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!selectedOrder.file_url) return;
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
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">⚙️ Parameters</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Material</p>
                            <p className="font-semibold text-white">{selectedOrder.material?.toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Color</p>
                            <p className="font-semibold text-white">{capitalizeFirst(selectedOrder.color)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Quality</p>
                            <p className="font-semibold text-white">{selectedOrder.layer_height}mm</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Infill</p>
                            <p className="font-semibold text-white">{selectedOrder.infill}%</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                          <span className="text-gray-400">📦 Quantity</span>
                          <span className="font-bold text-xl text-blue-400">{selectedOrder.quantity}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {selectedOrder.material_weight && (
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6 text-center">
                          <div className="text-3xl mb-1">⚖️</div>
                          <div className="text-2xl font-bold text-blue-400">
                            {(selectedOrder.material_weight * 1000).toFixed(1)}g
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Weight</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedOrder.print_time && (
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6 text-center">
                          <div className="text-3xl mb-1">⏱️</div>
                          <div className="text-2xl font-bold text-blue-400">
                            {Math.floor(selectedOrder.print_time / 60)}h {selectedOrder.print_time % 60}m
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Duration</p>
                        </CardContent>
                      </Card>
                    )}
                    <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700/50">
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl mb-1">💰</div>
                        <div className="text-2xl font-bold text-green-400">
                          {selectedOrder.price.toFixed(2)} PLN
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Prix</p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedOrder.tracking_code && (
                    <Card className="bg-gray-800 border-blue-700/50">
                      <CardHeader>
                        <CardTitle className="text-white">📦 Tracking</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="font-mono text-xl font-bold text-blue-400">{selectedOrder.tracking_code}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedOrder.notes && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">📝 Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedOrder.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowOrderDetails(false)} className="bg-gray-800 border-gray-700">
                    Fermer
                  </Button>
                  <Button onClick={() => navigate(`/admin/orders/${selectedOrder.id}`)} className="bg-blue-600 hover:bg-blue-700">
                    <Pencil className="w-4 h-4 mr-2" />
                    Voir détails complets
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPrintJobs;
