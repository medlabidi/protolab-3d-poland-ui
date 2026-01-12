import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Truck,
  FileText,
  Download,
  Loader2,
  Printer,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  file_name: string;
  file_url: string;
  material: string;
  color: string;
  status: string;
  payment_status: string;
  price: number;
  quantity: number;
  layer_height: number;
  infill: number;
  shipping_method: string;
  shipping_address?: string;
  tracking_code?: string;
  project_name?: string;
  created_at: string;
  user_id: string;
  users?: {
    name: string;
    email: string;
  };
}

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [projectOrders, setProjectOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [generatingLabel, setGeneratingLabel] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setStatus(data.order.status);
        setPaymentStatus(data.order.payment_status);
        setTrackingCode(data.order.tracking_code || "");

        // If this order has a project_name, fetch all orders with the same project
        if (data.order.project_name) {
          fetchProjectOrders(data.order.project_name);
        }
      } else {
        toast.error('Failed to fetch order details');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to fetch order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectOrders = async (projectName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders?project_name=${projectName}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjectOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch project orders:', error);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, payment_status: paymentStatus, tracking_code: trackingCode }),
      });

      if (response.ok) {
        toast.success('Order updated successfully');
        fetchOrderDetails();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleGenerateShippingLabel = async () => {
    if (!order) return;
    
    setGeneratingLabel(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/shipping/generate-label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          shippingMethod: order.shipping_method,
          address: order.shipping_address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Download the label PDF
        if (data.labelUrl) {
          window.open(data.labelUrl, '_blank');
        }
        
        toast.success('Shipping label generated successfully');
        setTrackingCode(data.trackingCode);
        fetchOrderDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate shipping label');
      }
    } catch (error) {
      console.error('Failed to generate label:', error);
      toast.error('Failed to generate shipping label');
    } finally {
      setGeneratingLabel(false);
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
      case 'refund_requested': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'refunding': return 'bg-orange-500';
      case 'refunded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

  if (!order) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="text-center text-gray-400">Order not found</div>
        </main>
      </div>
    );
  }

  const isProject = projectOrders.length > 1;
  const totalProjectPrice = isProject ? projectOrders.reduce((sum, o) => sum + o.price, 0) : order.price;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/admin/orders')}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Order Details</h1>
                <p className="text-gray-400 font-mono text-sm mt-1">ID: {order.id}</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/admin/conversations?order=${order.id}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              View Conversation
            </Button>
          </div>

          {/* Project Info (if multiple files) */}
          {isProject && (
            <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Project: {order.project_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-sm">Total Files</p>
                    <p className="text-2xl font-bold text-white">{projectOrders.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Quantity</p>
                    <p className="text-2xl font-bold text-white">
                      {projectOrders.reduce((sum, o) => sum + o.quantity, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Price</p>
                    <p className="text-2xl font-bold text-green-400">{totalProjectPrice.toFixed(2)} PLN</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white font-medium">{order.users?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{order.users?.email || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files in Project */}
          {isProject ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Project Files ({projectOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectOrders.map((projectOrder, index) => (
                  <div 
                    key={projectOrder.id} 
                    className={`p-4 rounded-lg border ${
                      projectOrder.id === order.id 
                        ? 'bg-blue-900/20 border-blue-700' 
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400 text-sm">File #{index + 1}</span>
                          {projectOrder.id === order.id && (
                            <Badge className="bg-blue-600 text-white text-xs">Current</Badge>
                          )}
                        </div>
                        <h4 className="text-white font-semibold mb-2">{projectOrder.file_name}</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Material</p>
                            <p className="text-white">{projectOrder.material} - {projectOrder.color}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Quantity</p>
                            <p className="text-white">{projectOrder.quantity}x</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Price</p>
                            <p className="text-green-400 font-semibold">{projectOrder.price.toFixed(2)} PLN</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-gray-400">Layer Height</p>
                            <p className="text-white">{projectOrder.layer_height}mm</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Infill</p>
                            <p className="text-white">{projectOrder.infill}%</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-gray-300"
                        onClick={() => window.open(projectOrder.file_url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            /* Single File Details */
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">File Name</p>
                    <p className="text-white font-medium">{order.file_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Material</p>
                    <p className="text-white font-medium">{order.material} - {order.color}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Layer Height</p>
                    <p className="text-white font-medium">{order.layer_height}mm</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Infill</p>
                    <p className="text-white font-medium">{order.infill}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Quantity</p>
                    <p className="text-white font-medium">{order.quantity}x</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-green-400 font-semibold text-lg">{order.price.toFixed(2)} PLN</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300"
                    onClick={() => window.open(order.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Management */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-500" />
                Status Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Order Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
                      <SelectItem value="refund_requested">Refund Requested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Payment Status</label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="refunding">Refunding</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleUpdateStatus} className="w-full bg-blue-600 hover:bg-blue-700">
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Shipping Method</p>
                  <p className="text-white font-medium capitalize">{order.shipping_method}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tracking Code</p>
                  <p className="text-white font-medium">{trackingCode || 'Not generated'}</p>
                </div>
              </div>
              {order.shipping_address && (
                <div>
                  <p className="text-gray-400 text-sm">Shipping Address</p>
                  <p className="text-white font-medium whitespace-pre-line">{order.shipping_address}</p>
                </div>
              )}
              <Button
                onClick={handleGenerateShippingLabel}
                disabled={generatingLabel || (order.shipping_method === 'pickup')}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {generatingLabel ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Label...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Shipping Label
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Badge className={`${getStatusColor(order.status)} text-white`}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`${getPaymentStatusColor(order.payment_status)} text-white`}>
                    {order.payment_status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-white font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminOrderDetail;
