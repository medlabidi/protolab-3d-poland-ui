import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  Loader2,
  Save,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  material: string;
  color: string;
  layer_height: number;
  infill: number;
  quantity: number;
  status: string;
  payment_status: string;
  price: number;
  paid_amount: number;
  material_weight?: number;
  print_time?: number;
  shipping_method: string;
  tracking_code?: string;
  created_at: string;
  // Advanced settings
  support_type?: 'none' | 'normal' | 'tree';
  infill_pattern?: 'grid' | 'honeycomb' | 'triangles' | 'gyroid';
  custom_layer_height?: number;
  custom_infill?: number;
}

const AdminOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [materialWeight, setMaterialWeight] = useState("");
  const [printTime, setPrintTime] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setStatus(data.order.status);
        setTrackingCode(data.order.tracking_code || "");
        setMaterialWeight(data.order.material_weight?.toString() || "");
        setPrintTime(data.order.print_time?.toString() || "");
      } else {
        toast.error('Failed to fetch order');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to fetch order');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('Order status updated');
        fetchOrder();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTracking = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackingCode }),
      });

      if (response.ok) {
        toast.success('Tracking code updated');
        fetchOrder();
      } else {
        toast.error('Failed to update tracking');
      }
    } catch (error) {
      console.error('Failed to update tracking:', error);
      toast.error('Failed to update tracking');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePricing = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/pricing`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          materialWeight: parseFloat(materialWeight),
          printTime: parseFloat(printTime)
        }),
      });

      if (response.ok) {
        toast.success('Pricing updated');
        fetchOrder();
      } else {
        toast.error('Failed to update pricing');
      }
    } catch (error) {
      console.error('Failed to update pricing:', error);
      toast.error('Failed to update pricing');
    } finally {
      setSaving(false);
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
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/orders')}
                className="text-gray-400 hover:text-white -ml-2 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              <h1 className="text-3xl font-bold text-white">Order Details</h1>
              <p className="text-gray-400 mt-1">Order ID: {order.id.slice(0, 13)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/conversations')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                View Conversation
              </Button>
              <Badge className={`${getStatusColor(order.status)} text-white text-lg px-4 py-2`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Info */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">File Name</Label>
                      <p className="text-white font-medium mt-1">{order.file_name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Created At</Label>
                      <p className="text-white font-medium mt-1">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Material</Label>
                      <p className="text-white font-medium mt-1">{order.material}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Color</Label>
                      <p className="text-white font-medium mt-1">{order.color}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Layer Height</Label>
                      <p className="text-white font-medium mt-1">{order.layer_height}mm</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Infill</Label>
                      <p className="text-white font-medium mt-1">{order.infill}%</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Quantity</Label>
                      <p className="text-white font-medium mt-1">{order.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Shipping</Label>
                      <p className="text-white font-medium mt-1 capitalize">{order.shipping_method}</p>
                    </div>
                  </div>
                  
                  {/* Advanced Settings (if any are set) */}
                  {(order.support_type && order.support_type !== 'none') || 
                   (order.infill_pattern && order.infill_pattern !== 'grid') || 
                   order.custom_layer_height || 
                   order.custom_infill ? (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <Label className="text-blue-400 text-sm font-semibold mb-4 block">Advanced Settings</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {order.support_type && order.support_type !== 'none' && (
                          <div>
                            <Label className="text-gray-400">Support Type</Label>
                            <p className="text-white font-medium mt-1 capitalize">{order.support_type}</p>
                          </div>
                        )}
                        
                        {order.infill_pattern && order.infill_pattern !== 'grid' && (
                          <div>
                            <Label className="text-gray-400">Infill Pattern</Label>
                            <p className="text-white font-medium mt-1 capitalize">{order.infill_pattern}</p>
                          </div>
                        )}
                        
                        {order.custom_layer_height && (
                          <div>
                            <Label className="text-gray-400">Custom Layer Height</Label>
                            <p className="text-white font-medium mt-1">{order.custom_layer_height}mm</p>
                          </div>
                        )}
                        
                        {order.custom_infill && (
                          <div>
                            <Label className="text-gray-400">Custom Infill</Label>
                            <p className="text-white font-medium mt-1">{order.custom_infill}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Pricing & Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Material Weight (g)</Label>
                      <Input
                        type="number"
                        value={materialWeight}
                        onChange={(e) => setMaterialWeight(e.target.value)}
                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400">Print Time (hours)</Label>
                      <Input
                        type="number"
                        value={printTime}
                        onChange={(e) => setPrintTime(e.target.value)}
                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdatePricing}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Update Pricing
                  </Button>
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Order Price:</span>
                      <span className="text-2xl font-bold text-white">{order.price.toFixed(2)} PLN</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Paid Amount:</span>
                      <span className="text-lg font-semibold text-green-400">{order.paid_amount.toFixed(2)} PLN</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              {/* Status Update */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white text-sm">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={saving || status === order.status}
                    className="w-full"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Update Status
                  </Button>
                </CardContent>
              </Card>

              {/* Tracking */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-gray-400">Tracking Code</Label>
                    <Input
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="Enter tracking code"
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateTracking}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Update Tracking
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white text-sm">Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Badge className={`${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'} text-white w-full justify-center py-2`}>
                    {order.payment_status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOrderDetails;
