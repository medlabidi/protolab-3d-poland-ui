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

  const [order, setOrder] = useState<Order | null>(null);
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
    if (orderId) {
      fetchOrder();
      fetchBusinessInfo();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [orderId]);

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
    if (!order) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Create PayU payment with full user data
      const payuResponse = await fetch(`${API_URL}/payments/payu/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.price,
          description: `Order #${order.id.slice(0, 8)} - ${order.file_name}`,
          userId: order.user_id,
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
    if (!order) return null;

    const method = order.shipping_method;
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

  if (error || !order) {
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
            {/* Order Summary */}
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
                {/* Show quality details based on standard vs advanced mode */}
                {(order.layer_height === 0.2 && order.infill === 20) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                    <span className="font-medium dark:text-gray-100">Standard</span>
                  </div>
                ) : (order.layer_height === 0.3 && order.infill === 10) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                    <span className="font-medium dark:text-gray-100">Draft</span>
                  </div>
                ) : (order.layer_height === 0.15 && order.infill === 50) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                    <span className="font-medium dark:text-gray-100">High</span>
                  </div>
                ) : (order.layer_height === 0.1 && order.infill === 100) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Quality:</span>
                    <span className="font-medium dark:text-gray-100">Ultra High</span>
                  </div>
                ) : (
                  // Advanced mode - show technical parameters
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Layer Height:</span>
                      <span className="font-medium dark:text-gray-100">{order.layer_height}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Infill:</span>
                      <span className="font-medium dark:text-gray-100">{order.infill}%</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Quantity:</span>
                  <span className="font-medium dark:text-gray-100">{order.quantity}</span>
                </div>
              </CardContent>
            </Card>

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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Print Cost:</span>
                    <span className="dark:text-gray-100">{order.price.toFixed(2)} PLN</span>
                  </div>
                  <Separator className="dark:bg-gray-600" />
                  <div className="flex justify-between font-bold text-lg">
                    <span className="dark:text-gray-100">Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">{order.price.toFixed(2)} PLN</span>
                  </div>
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
