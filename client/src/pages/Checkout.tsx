import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  FileText, 
  Loader2, 
  Edit2,
  Building2,
  Receipt,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { API_URL } from '@/config/api';

interface Order {
  id: string;
  user_id: string;
  file_name: string;
  material: string;
  color: string;
  layer_height: number;
  infill: number;
  quantity: number;
  price: number;
  shipping_method: string;
  shipping_address: string | null;
  material_weight: number;
  print_time: number;
  status: string;
  payment_status: string;
  quality?: string;
  advanced_mode?: boolean;
  support_type?: string;
  infill_pattern?: string;
}

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  lockerCode?: string;
  lockerAddress?: string;
  type?: string;
  address?: string;
}

interface BusinessInfo {
  company_name?: string;
  nip?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const isProjectOrders = searchParams.get('projectOrders') === 'true';
  const isProjectMode = searchParams.get('projectMode') === 'true';

  const [order, setOrder] = useState<Order | null>(null);
  const [projectOrders, setProjectOrders] = useState<Order[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Address editing
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({});
  
  // Invoice/Business info
  const [requestInvoice, setRequestInvoice] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const [hasBusinessInfo, setHasBusinessInfo] = useState(false);

  useEffect(() => {
    if (isProjectMode) {
      loadProjectData();
      fetchBusinessInfo();
    } else if (orderId) {
      if (isProjectOrders) {
        fetchProjectOrders();
      } else {
        fetchOrder();
      }
      fetchBusinessInfo();
    } else {
      setError('No order data provided');
      setLoading(false);
    }
  }, [orderId, isProjectOrders, isProjectMode]);

  const loadProjectData = () => {
    try {
      const dataStr = sessionStorage.getItem('projectCheckoutData');
      if (!dataStr) {
        throw new Error('No project data found');
      }
      
      const data = JSON.parse(dataStr);
      setProjectData(data);
      setShippingAddress(data.shippingAddress || {});
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load project data');
      setLoading(false);
    }
  };

  const fetchProjectOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get order IDs from session storage
      const orderIdsStr = sessionStorage.getItem('projectOrderIds');
      if (!orderIdsStr) {
        throw new Error('No project orders found');
      }

      const orderIds = JSON.parse(orderIdsStr);
      const orders: Order[] = [];

      // Fetch all orders
      for (const id of orderIds) {
        const response = await fetch(`${API_URL}/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch order ${id}`);
        }

        const data = await response.json();
        orders.push(data.order || data);
      }

      setProjectOrders(orders);
      // Set first order as main order for address
      if (orders.length > 0) {
        setOrder(orders[0]);
        if (orders[0].shipping_address) {
          try {
            setShippingAddress(JSON.parse(orders[0].shipping_address));
          } catch (e) {
            console.error('Failed to parse shipping address:', e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project orders');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      const orderData = data.order || data;
      setOrder(orderData);
      
      // Parse shipping address if exists
      if (orderData.shipping_address) {
        try {
          setShippingAddress(JSON.parse(orderData.shipping_address));
        } catch (e) {
          console.error('Failed to parse shipping address:', e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const response = await apiFetch('/users/business-info');
      if (response.ok) {
        const data = await response.json();
        if (data.businessInfo) {
          setBusinessInfo(data.businessInfo);
          setHasBusinessInfo(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch business info:', error);
    }
  };

  const handleUpdateAddress = async () => {
    if (!order) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping_address: JSON.stringify(shippingAddress),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      toast.success('Delivery address updated');
      setIsEditingAddress(false);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update address');
    }
  };

  const handleProceedToPayment = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      let orderToProcess: Order | null = order;
      let totalAmount = order?.price || 0;

      // If in project mode, create all orders first
      if (isProjectMode && projectData) {
        const createdOrders: string[] = [];
        const projectFiles = (window as any).__projectFiles || [];
        
        toast.info(`Creating ${projectData.files.length} orders...`);

        for (let i = 0; i < projectData.files.length; i++) {
          const fileData = projectData.files[i];
          const file = projectFiles[i];
          
          if (!file) {
            throw new Error(`File ${fileData.fileName} not found`);
          }

          const formData = new FormData();
          formData.append('file', file);
          formData.append('material', fileData.material.split('-')[0]);
          formData.append('color', fileData.material.split('-')[1] || 'white');
          
          // Use custom values if advanced mode, otherwise quality preset
          let layerHeight: string;
          let infill: string;
          
          if (fileData.advancedMode) {
            layerHeight = fileData.customLayerHeight || '0.2';
            infill = fileData.customInfill || '20';
          } else {
            layerHeight = fileData.quality === 'draft' ? '0.3' : fileData.quality === 'standard' ? '0.2' : fileData.quality === 'high' ? '0.15' : '0.1';
            infill = fileData.quality === 'draft' ? '10' : fileData.quality === 'standard' ? '20' : fileData.quality === 'high' ? '30' : '40';
          }
          
          formData.append('layerHeight', layerHeight);
          formData.append('infill', infill);
          formData.append('quantity', fileData.quantity.toString());
          formData.append('shippingMethod', projectData.deliveryOption);
          formData.append('paymentMethod', 'pending');
          formData.append('price', fileData.estimatedPrice.toString());
          formData.append('projectName', projectData.projectName);
          formData.append('advancedMode', (fileData.advancedMode || false).toString());
          
          if (!fileData.advancedMode) {
            formData.append('quality', fileData.quality);
          }
          
          if (fileData.advancedMode) {
            formData.append('infillPattern', fileData.infillPattern || 'grid');
            if (fileData.customLayerHeight) {
              formData.append('customLayerHeight', fileData.customLayerHeight);
            }
            if (fileData.customInfill) {
              formData.append('customInfill', fileData.customInfill);
            }
          }

          if (projectData.shippingAddress) {
            formData.append('shippingAddress', JSON.stringify(projectData.shippingAddress));
          }

          const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to create order for ${fileData.fileName}`);
          }

          const result = await response.json();
          createdOrders.push(result.id);
        }

        // Use first order for payment
        const firstOrderResponse = await fetch(`${API_URL}/orders/${createdOrders[0]}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!firstOrderResponse.ok) {
          throw new Error('Failed to fetch created order');
        }

        const firstOrderData = await firstOrderResponse.json();
        orderToProcess = firstOrderData.order || firstOrderData;
        totalAmount = projectData.totalAmount;
      }

      if (!orderToProcess) {
        throw new Error('No order to process');
      }

      // Create PayU payment with full user data
      const payuResponse = await fetch(`${API_URL}/payments/payu/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderToProcess.id,
          amount: totalAmount,
          description: isProjectMode 
            ? `Project: ${projectData.projectName} (${projectData.files.length} files)`
            : `Order #${orderToProcess.id.slice(0, 8)} - ${orderToProcess.file_name}`,
          userId: orderToProcess.user_id,
          requestInvoice,
          businessInfo: requestInvoice ? businessInfo : null,
          shippingAddress,
        }),
      });

      if (!payuResponse.ok) {
        const errorData = await payuResponse.json();
        throw new Error(errorData.error || 'Payment creation failed');
      }

      const payuData = await payuResponse.json();

      // Redirect to PayU payment page
      if (payuData.redirectUri) {
        window.location.href = payuData.redirectUri;
      } else {
        throw new Error('No payment redirect URL received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const renderDeliveryInfo = () => {
    const method = isProjectMode ? projectData?.deliveryOption : order?.shipping_method;
    if (!method) return null;

    let deliveryIcon = <MapPin className="h-5 w-5" />;
    let deliveryTitle = 'Delivery Method';
    let deliveryDetails = '';

    switch (method) {
      case 'pickup':
        deliveryTitle = 'Local Pickup';
        deliveryDetails = shippingAddress?.address || 'Zielonogórska 13, 30-406 Kraków';
        break;
      case 'inpost':
        deliveryIcon = <Package className="h-5 w-5" />;
        deliveryTitle = 'InPost Parcel Locker';
        deliveryDetails = `${shippingAddress?.lockerCode || ''} - ${shippingAddress?.lockerAddress || ''}`;
        break;
      case 'dpd':
      case 'courier':
        deliveryIcon = <Package className="h-5 w-5" />;
        deliveryTitle = 'Courier Delivery';
        if (shippingAddress?.fullName) {
          deliveryDetails = `${shippingAddress.fullName}\n${shippingAddress.street}\n${shippingAddress.postalCode} ${shippingAddress.city}\nPhone: ${shippingAddress.phone}`;
        }
        break;
    }

    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {deliveryIcon}
            Delivery Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium dark:text-gray-100">{deliveryTitle}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line mt-1">
              {deliveryDetails}
            </div>
          </div>

          {(method === 'dpd' || method === 'courier') && !isEditingAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingAddress(true)}
              className="w-full"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Delivery Address
            </Button>
          )}

          {isEditingAddress && (
            <div className="space-y-3 p-4 border rounded-lg dark:border-gray-600">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={shippingAddress?.fullName || ''}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={shippingAddress?.phone || ''}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  placeholder="+48 123 456 789"
                />
              </div>
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={shippingAddress?.street || ''}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={shippingAddress?.postalCode || ''}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingAddress?.city || ''}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateAddress} size="sm" className="flex-1">
                  Save Address
                </Button>
                <Button 
                  onClick={() => setIsEditingAddress(false)} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || (!order && !isProjectMode)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
            <CardDescription className="dark:text-gray-300">
              {error || 'Order not found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/orders')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="dark:text-gray-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold dark:text-gray-100">Checkout</h1>
            <p className="text-gray-600 dark:text-gray-400">Review your order before payment</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Summary - Show project data if project mode */}
            {isProjectMode && projectData ? (
              <>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {projectData.projectName} ({projectData.files.length} files)
                    </CardTitle>
                  </CardHeader>
                </Card>
                
                {projectData.files.map((fileData: any, index: number) => (
                  <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        File #{index + 1}: {fileData.fileName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Material:</span>
                        <span className="font-medium dark:text-gray-100">{fileData.material}</span>
                      </div>
                      {fileData.advancedMode ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Mode:</span>
                            <span className="font-medium text-primary dark:text-blue-400">Advanced Settings</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Layer Height:</span>
                            <span className="font-medium dark:text-gray-100">{fileData.customLayerHeight}mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Infill:</span>
                            <span className="font-medium dark:text-gray-100">{fileData.customInfill}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Infill Pattern:</span>
                            <span className="font-medium dark:text-gray-100 capitalize">{fileData.infillPattern || 'grid'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                          <span className="font-medium dark:text-gray-100 capitalize">{fileData.quality}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Quantity:</span>
                        <span className="font-medium dark:text-gray-100">{fileData.quantity}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold">Price:</span>
                        <span className="font-bold text-primary">{fileData.estimatedPrice.toFixed(2)} PLN</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : isProjectOrders && projectOrders.length > 0 ? (
              <>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Project Orders ({projectOrders.length} items)
                    </CardTitle>
                  </CardHeader>
                </Card>
                
                {projectOrders.map((projectOrder, index) => (
                  <Card key={projectOrder.id} className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Order #{index + 1}: {projectOrder.file_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Material:</span>
                        <span className="font-medium dark:text-gray-100">{projectOrder.material} - {projectOrder.color}</span>
                      </div>
                      {projectOrder.advanced_mode ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Mode:</span>
                            <span className="font-medium text-primary dark:text-blue-400">Advanced Settings</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Layer Height:</span>
                            <span className="font-medium dark:text-gray-100">{projectOrder.layer_height}mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Infill:</span>
                            <span className="font-medium dark:text-gray-100">{projectOrder.infill}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Infill Pattern:</span>
                            <span className="font-medium dark:text-gray-100 capitalize">{projectOrder.infill_pattern || 'grid'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                          <span className="font-medium dark:text-gray-100">
                            {projectOrder.quality ? 
                              (projectOrder.quality === 'draft' ? 'Draft' :
                               projectOrder.quality === 'standard' ? 'Standard' :
                               projectOrder.quality === 'high' ? 'High Quality' :
                               projectOrder.quality === 'ultra' ? 'Ultra High Quality' : 'Custom') :
                              'Custom'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Quantity:</span>
                        <span className="font-medium dark:text-gray-100">{projectOrder.quantity}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold">Price:</span>
                        <span className="font-bold text-primary">{projectOrder.price.toFixed(2)} PLN</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : order ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">File:</span>
                    <span className="font-medium dark:text-gray-100">{order.file_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Material:</span>
                    <span className="font-medium dark:text-gray-100">{order.material} - {order.color}</span>
                  </div>
                  {/* Show quality or advanced settings based on advanced_mode flag */}
                  {order.advanced_mode ? (
                    // Advanced mode - show technical parameters
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Mode:</span>
                        <span className="font-medium text-primary dark:text-blue-400">Advanced Settings</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Layer Height:</span>
                        <span className="font-medium dark:text-gray-100">{order.layer_height}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Infill:</span>
                        <span className="font-medium dark:text-gray-100">{order.infill}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Infill Pattern:</span>
                        <span className="font-medium dark:text-gray-100 capitalize">{order.infill_pattern || 'grid'}</span>
                      </div>
                    </>
                  ) : (
                    // Standard mode - show quality preset
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                      <span className="font-medium dark:text-gray-100">
                        {order.quality ? 
                          (order.quality === 'draft' ? 'Draft' :
                           order.quality === 'standard' ? 'Standard' :
                           order.quality === 'high' ? 'High Quality' :
                           order.quality === 'ultra' ? 'Ultra High Quality' : 'Custom') :
                          // Fallback to detecting from values
                          (order.layer_height === 0.3 && order.infill === 10 ? 'Draft' :
                           order.layer_height === 0.2 && order.infill === 20 ? 'Standard' :
                           order.layer_height === 0.15 && order.infill === 30 ? 'High Quality' :
                           order.layer_height === 0.1 && order.infill === 40 ? 'Ultra High Quality' :
                           'Custom')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Quantity:</span>
                    <span className="font-medium dark:text-gray-100">{order.quantity}</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Delivery Information */}
            {renderDeliveryInfo()}

            {/* Invoice Request */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Invoice (Faktura)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requestInvoice"
                    checked={requestInvoice}
                    onCheckedChange={(checked) => setRequestInvoice(checked as boolean)}
                  />
                  <label
                    htmlFor="requestInvoice"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-100"
                  >
                    I need an invoice for this purchase
                  </label>
                </div>

                {requestInvoice && (
                  <div className="space-y-3 p-4 border rounded-lg dark:border-gray-600">
                    {hasBusinessInfo ? (
                      <Alert>
                        <Building2 className="h-4 w-4" />
                        <AlertDescription className="dark:text-gray-200">
                          Using your saved business information:
                          <div className="mt-2 space-y-1 text-sm">
                            <div><strong>Company:</strong> {businessInfo.company_name}</div>
                            <div><strong>NIP:</strong> {businessInfo.nip}</div>
                            <div><strong>Address:</strong> {businessInfo.address}, {businessInfo.postal_code} {businessInfo.city}</div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={businessInfo.company_name || ''}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, company_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="nip">NIP (Tax ID)</Label>
                          <Input
                            id="nip"
                            value={businessInfo.nip || ''}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, nip: e.target.value })}
                            placeholder="1234567890"
                          />
                        </div>
                        <div>
                          <Label htmlFor="business_address">Address</Label>
                          <Input
                            id="business_address"
                            value={businessInfo.address || ''}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="business_postal_code">Postal Code</Label>
                            <Input
                              id="business_postal_code"
                              value={businessInfo.postal_code || ''}
                              onChange={(e) => setBusinessInfo({ ...businessInfo, postal_code: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="business_city">City</Label>
                            <Input
                              id="business_city"
                              value={businessInfo.city || ''}
                              onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    <Alert>
                      <Download className="h-4 w-4" />
                      <AlertDescription className="dark:text-gray-200">
                        Invoice will be sent to your email and available for download after payment.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-4 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {isProjectMode && projectData ? (
                    <>
                      {projectData.files.map((fileData: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">File #{index + 1}:</span>
                          <span className="dark:text-gray-100">{fileData.estimatedPrice.toFixed(2)} PLN</span>
                        </div>
                      ))}
                      <Separator className="dark:bg-gray-600" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                        <span className="dark:text-gray-100">
                          {projectData.files.reduce((sum: number, f: any) => sum + f.estimatedPrice, 0).toFixed(2)} PLN
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Delivery:</span>
                        <span className="dark:text-gray-100">{projectData.deliveryPrice.toFixed(2)} PLN</span>
                      </div>
                      <Separator className="dark:bg-gray-600" />
                      <div className="flex justify-between font-bold text-lg">
                        <span className="dark:text-gray-100">Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {projectData.totalAmount.toFixed(2)} PLN
                        </span>
                      </div>
                    </>
                  ) : isProjectOrders && projectOrders.length > 0 ? (
                    <>
                      {projectOrders.map((projectOrder, index) => (
                        <div key={projectOrder.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Order #{index + 1}:</span>
                          <span className="dark:text-gray-100">{projectOrder.price.toFixed(2)} PLN</span>
                        </div>
                      ))}
                      <Separator className="dark:bg-gray-600" />
                      <div className="flex justify-between font-bold text-lg">
                        <span className="dark:text-gray-100">Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {projectOrders.reduce((sum, po) => sum + po.price, 0).toFixed(2)} PLN
                        </span>
                      </div>
                    </>
                  ) : order ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Print Cost:</span>
                        <span className="dark:text-gray-100">{order.price.toFixed(2)} PLN</span>
                      </div>
                      <Separator className="dark:bg-gray-600" />
                      <div className="flex justify-between font-bold text-lg">
                        <span className="dark:text-gray-100">Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">{order.price.toFixed(2)} PLN</span>
                      </div>
                    </>
                  ) : null}
                </div>

                <Button
                  onClick={handleProceedToPayment}
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Secure payment powered by PayU
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
