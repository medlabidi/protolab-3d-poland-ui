import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CreditCard, Building2, Wallet } from 'lucide-react';
import { API_URL } from '@/config/api';
import { PayUSecureForm } from '@/components/PayUSecureForm';
import { PayUDisclosures } from '@/components/PayUDisclosures';

interface Order {
  id: string;
  file_name: string;
  material: string;
  color: string;
  quantity: number;
  price: number;
  payment_status: string;
  status: string;
  user_id: string;
  order_type?: string;
  credits_amount?: number;
  notes?: string;
}

interface PayMethod {
  value: string;
  name: string;
  brandImageUrl: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
}

interface PaymentMethods {
  cardPayMethods: PayMethod[];
  pblPayMethods: PayMethod[];
  installmentPayMethods: PayMethod[];
  payByLinks: PayMethod[];
}

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment method selection
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pbl' | 'blik'>('pbl');
  const [selectedPbl, setSelectedPbl] = useState<string>('');
  const [blikCode, setBlikCode] = useState<string>('');
  const [cardToken, setCardToken] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      Promise.all([fetchOrder(), fetchPaymentMethods()]);
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
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);

      // Redirect if already paid
      if (data.order.payment_status === 'paid') {
        navigate(`/orders/${orderId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_URL}/payu-methods?lang=pl`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.data);
      
      // Set default PBL selection if available
      if (data.data.pblPayMethods?.length > 0) {
        setSelectedPbl(data.data.pblPayMethods[0].value);
      }
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
      // Continue even if payment methods fail - fallback to basic options
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Build payMethods object based on selection
      let payMethodsData: any = null;

      switch (selectedMethod) {
        case 'card':
          if (!cardToken) {
            throw new Error('Please enter card details');
          }
          payMethodsData = {
            payMethod: {
              type: 'CARD_TOKEN',
              value: cardToken,
            },
          };
          break;

        case 'pbl':
          if (!selectedPbl) {
            throw new Error('Please select a payment method');
          }
          payMethodsData = {
            payMethod: {
              type: 'PBL',
              value: selectedPbl,
            },
          };
          break;

        case 'blik':
          if (!blikCode || blikCode.length !== 6) {
            throw new Error('Please enter a valid 6-digit BLIK code');
          }
          payMethodsData = {
            payMethod: {
              type: 'PBL',
              value: 'blik',
              authorizationCode: blikCode,
            },
          };
          break;
      }

      // Create PayU order with selected payment method
      const response = await fetch(`${API_URL}/payments/payu/create`, {
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
          payMethods: payMethodsData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const data = await response.json();

      // Handle different response types
      if (data.redirectUri) {
        // Redirect to payment page (for PBL methods)
        window.location.href = data.redirectUri;
      } else if (data.statusCode === 'SUCCESS') {
        // Payment completed (for BLIK with code)
        navigate('/payment-success');
      } else {
        throw new Error('Unexpected payment response');
      }

    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Redirect to order details after successful payment
    setTimeout(() => {
      navigate(`/orders/${orderId}`);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
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

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background p-4">
      <div className="max-w-5xl mx-auto space-y-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/orders/${orderId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Order
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Summary - Left Column */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{order.order_type === 'credits_purchase' ? 'Purchase Summary' : 'Order Summary'}</CardTitle>
              <CardDescription>
                {order.order_type === 'credits_purchase' 
                  ? `Credits Purchase #${orderId?.slice(0, 8)}` 
                  : `Order #${orderId?.slice(0, 8) || 'N/A'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_type === 'credits_purchase' ? (
                // Credits purchase summary
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credits Amount</span>
                    <span className="font-medium">{order.credits_amount || 0} PLN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium">{order.notes || 'Store Credits'}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {order.price.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular print order summary
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-medium truncate ml-2">{order.file_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium">{order.material}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Color:</span>
                  <span className="font-medium">{order.color}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold">
                      {order.price.toFixed(2)} PLN
                    </span>
                  </div>
                </div>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods - Right Column */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>Choose how you want to pay</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pbl">
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank
                  </TabsTrigger>
                  <TabsTrigger value="card">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="blik">
                    <Wallet className="h-4 w-4 mr-2" />
                    BLIK
                  </TabsTrigger>
                </TabsList>

                {/* Bank Transfer (PBL) */}
                <TabsContent value="pbl" className="space-y-4 mt-4">
                  <Label>Select Your Bank</Label>
                  {paymentMethods && paymentMethods.pblPayMethods.length > 0 ? (
                    <RadioGroup value={selectedPbl} onValueChange={setSelectedPbl}>
                      <div className="grid grid-cols-2 gap-3">
                        {paymentMethods.pblPayMethods
                          .filter(method => method.status === 'ENABLED')
                          .map((method) => (
                            <div key={method.value} className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted">
                              <RadioGroupItem value={method.value} id={method.value} />
                              <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer flex-1">
                                {method.brandImageUrl && (
                                  <img src={method.brandImageUrl} alt={method.name} className="h-6 w-auto" />
                                )}
                                <span className="text-sm">{method.name}</span>
                              </Label>
                            </div>
                          ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <Alert>
                      <AlertDescription>Loading payment methods...</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Card Payment */}
                <TabsContent value="card" className="space-y-4 mt-4">
                  <PayUSecureForm
                    onTokenReceived={setCardToken}
                    amount={order.price}
                  />
                </TabsContent>

                {/* BLIK Payment */}
                <TabsContent value="blik" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="blikCode">BLIK Code</Label>
                    <Input
                      id="blikCode"
                      type="text"
                      placeholder="000000"
                      value={blikCode}
                      onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                    <p className="text-sm text-muted-foreground">
                      Open your banking app and generate a BLIK code
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Payment Button */}
              <div className="mt-6 space-y-4">
                <Button
                  onClick={handlePayment}
                  disabled={processing || (selectedMethod === 'card' && !cardToken) || (selectedMethod === 'pbl' && !selectedPbl)}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay {order.price.toFixed(2)} PLN</>
                  )}
                </Button>

                {/* Legal Disclosures */}
                <PayUDisclosures lang="pl" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
