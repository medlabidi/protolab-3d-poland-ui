import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CreditCard, Wallet } from 'lucide-react';
import { API_URL } from '@/config/api';
import { toast } from 'sonner';
import { apiFormData } from '@/lib/api';

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
  const location = useLocation();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment method selection
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'blik' | 'credits'>('card');
  const [blikCode, setBlikCode] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      // Fetch existing order
      Promise.all([fetchOrder(), fetchPaymentMethods()]);
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
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);

      // Redirect if already paid (but not if on_hold - that means awaiting payment)
      if (data.order.payment_status === 'paid') {
        navigate(`/orders/${data.order.id}`);
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

      if (selectedMethod === 'credits') {
        // Handle credits payment using existing order update system
        const creditsResponse = await fetch(`${API_URL}/orders/${order.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_method: 'credits'
          })
        });

        if (!creditsResponse.ok) {
          const errorData = await creditsResponse.json();
          throw new Error(errorData.error || 'Credits payment failed');
        }

        // Credits payment successful - redirect to order details
        navigate(`/orders/${order.id}`);
        return;
      }

      // Handle different payment methods with correct endpoints
      let response;
      
      if (selectedMethod === 'blik') {
        // BLIK payment - use dedicated BLIK endpoint
        if (!blikCode || blikCode.length !== 6) {
          throw new Error('Please enter a valid 6-digit BLIK code');
        }

        response = await fetch(`${API_URL}/payments/blik`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            blikCode: blikCode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'BLIK payment failed');
        }

        const data = await response.json();
        
        if (data.success) {
          toast.success('BLIK payment initiated. Please confirm in your banking app.');
          // Redirect to success page or order details
          navigate(`/payment-success?orderId=${order.id}`);
        } else {
          throw new Error(data.message || 'BLIK payment failed');
        }
      } else {
        // Card or other payment methods - use standard create endpoint
        response = await fetch(`${API_URL}/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment failed');
        }

        const data = await response.json();

        // Redirect to PayU payment page
        if (data.redirectUri) {
          window.location.href = data.redirectUri;
        } else {
          throw new Error('No redirect URL received from payment gateway');
        }
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
      navigate(`/orders/${order?.id || orderId}`);
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
          onClick={() => navigate('/orders')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
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
                  <TabsTrigger value="card">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="blik">
                    <Wallet className="h-4 w-4 mr-2" />
                    BLIK
                  </TabsTrigger>
                  <TabsTrigger value="credits">
                    <Wallet className="h-4 w-4 mr-2" />
                    Credits
                  </TabsTrigger>
                </TabsList>

{/* Card Payment */}
                <TabsContent value="card" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="p-6 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <h3 className="font-semibold">Secure Card Payment</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        You'll be redirected to PayU's secure payment page to enter your card details safely.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-12 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                        <div className="h-8 w-12 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                        <div className="h-8 w-12 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">AMEX</div>
                        <span className="text-xs text-muted-foreground ml-2">+ more cards accepted</span>
                      </div>
                    </div>
                  </div>
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

                {/* Credits Payment */}
                <TabsContent value="credits" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Pay with Store Credits</h3>
                        <p className="text-sm text-muted-foreground">Use your account balance to pay for this order</p>
                      </div>
                      <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <Alert>
                      <AlertDescription>
                        Your credits will be deducted instantly after clicking "Pay with Credits".
                      </AlertDescription>
                    </Alert>
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
                  disabled={processing || (selectedMethod === 'blik' && (!blikCode || blikCode.length !== 6))}
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
                      {selectedMethod === 'credits' ? (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Pay with Credits ({order.price.toFixed(2)} PLN)
                        </>
                      ) : (
                        <>Pay {order.price.toFixed(2)} PLN</>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
