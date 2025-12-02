import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Building2, Smartphone, Shield, Lock, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiFormData } from "@/lib/api";
import { useNotifications } from "@/contexts/NotificationContext";

// Single file order data
interface SingleOrderData {
  isProject?: false;
  file: File;
  material: string;
  quality: string;
  quantity: number;
  deliveryOption: string;
  locker?: { id: string; name: string; address: string };
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
  };
  priceBreakdown: {
    internalCost: number;
    serviceFee: number;
    vat: number;
    totalPrice: number;
  };
  deliveryPrice: number;
  totalAmount: number;
}

// Project (multi-file) order data
interface ProjectOrderData {
  isProject: true;
  projectName: string;
  files: Array<{
    file: File;
    material: string;
    quality: string;
    quantity: number;
    modelAnalysis: any;
    estimatedPrice: number;
  }>;
  deliveryOption: string;
  locker?: { id: string; name: string; address: string };
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
  };
  projectTotal: number;
  deliveryPrice: number;
  totalAmount: number;
}

type OrderData = SingleOrderData | ProjectOrderData;

interface UpgradeData {
  orderId?: string;
  orderNumber?: string;
  projectName?: string;
  isProject?: boolean;
  orderCount?: number;
  amount: number;
  isUpgrade: true;
  totalAmount: number;
  previousPrice?: number;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [upgradeData, setUpgradeData] = useState<UpgradeData | null>(null);
  const [isUpgradePayment, setIsUpgradePayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [blikCode, setBlikCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  useEffect(() => {
    // Check if this is an upgrade payment
    if (location.state?.isUpgrade) {
      setIsUpgradePayment(true);
      setUpgradeData(location.state as UpgradeData);
    } else if (location.state?.orderData) {
      // Regular new order payment
      setOrderData(location.state.orderData);
    } else {
      toast.error("No order data found. Please start again.");
      navigate("/new-print");
    }
  }, [location.state, navigate]);

  const paymentMethods = [
    {
      id: "blik",
      name: "BLIK",
      icon: Smartphone,
      description: "Pay instantly with BLIK code",
      popular: true,
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: CreditCard,
      description: "Visa, Mastercard, Maestro",
      popular: false,
    },
    {
      id: "transfer",
      name: "Bank Transfer",
      icon: Building2,
      description: "Direct bank transfer (P24)",
      popular: false,
    },
  ];

  const handlePayment = async () => {
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedPayment === "blik" && blikCode.length !== 6) {
      toast.error("Please enter a valid 6-digit BLIK code");
      return;
    }

    if (selectedPayment === "card") {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        toast.error("Please fill in all card details");
        return;
      }
    }

    setIsProcessing(true);

    try {
      if (isUpgradePayment && upgradeData) {
        // Check if this is a project upgrade or single order upgrade
        if (upgradeData.isProject) {
          // Handle project upgrade payment
          const pendingUpdate = sessionStorage.getItem('pendingProjectUpdate');
          if (!pendingUpdate) {
            throw new Error('No pending project update found');
          }

          const projectUpdateData = JSON.parse(pendingUpdate);

          // Simulate payment processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Update all orders in the project
          let successCount = 0;
          let failCount = 0;

          for (const orderUpdate of projectUpdateData.updates) {
            const updatesWithPayment = {
              ...orderUpdate.updates,
              payment_status: 'paid',
              paid_amount: orderUpdate.newPrice,
            };

            const response = await apiFetch(`/orders/${orderUpdate.orderId}`, {
              method: 'PATCH',
              body: JSON.stringify(updatesWithPayment),
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
          }

          // Clear the pending update from session storage
          sessionStorage.removeItem('pendingProjectUpdate');

          // Send payment confirmation email for project upgrade
          try {
            await apiFetch('/orders/email/payment-confirmation', {
              method: 'POST',
              body: JSON.stringify({
                projectName: upgradeData.projectName,
                totalAmount: upgradeData.amount,
                itemCount: upgradeData.orderCount || projectUpdateData.updates.length,
                paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
              }),
            });
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
          }

          // Add notification for project update
          addNotification({
            type: "order_update",
            title: "Project Updated",
            message: `Your project "${upgradeData.projectName}" has been updated with new specifications.`,
          });

          if (failCount > 0) {
            toast.warning(`Payment successful! ${successCount} orders updated, ${failCount} failed.`);
          } else {
            toast.success(`Payment of ${upgradeData.amount.toFixed(2)} PLN successful! Project has been updated.`);
          }
          navigate('/orders');
        } else {
          // Handle single order upgrade payment
          const pendingUpdate = sessionStorage.getItem('pendingOrderUpdate');
          if (!pendingUpdate) {
            throw new Error('No pending order update found');
          }

          const updateData = JSON.parse(pendingUpdate);

          // Simulate payment processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Update the order with new details and set payment status to paid with new amount
          const updatesWithPayment = {
            ...updateData.updates,
            payment_status: 'paid',
            paid_amount: upgradeData.totalAmount,
          };

          const response = await apiFetch(`/orders/${upgradeData.orderId}`, {
            method: 'PATCH',
            body: JSON.stringify(updatesWithPayment),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update order');
          }

          // Clear the pending update from session storage
          sessionStorage.removeItem('pendingOrderUpdate');

          // Send payment confirmation email for upgrade
          try {
            await apiFetch('/orders/email/payment-confirmation', {
              method: 'POST',
              body: JSON.stringify({
                orderNumber: upgradeData.orderNumber,
                totalAmount: upgradeData.amount,
                itemCount: 1,
                paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
              }),
            });
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
          }

          // Add notification for order update
          addNotification({
            type: "order_update",
            title: "Order Updated",
            message: `Your order #${upgradeData.orderNumber} has been updated with new specifications.`,
            orderId: upgradeData.orderId,
          });

          toast.success(`Payment of ${upgradeData.amount.toFixed(2)} PLN successful! Your order has been updated.`);
          navigate(`/orders/${upgradeData.orderId}`);
        }
      } else if (orderData) {
        // Handle new order payment
        if (orderData.isProject) {
          // Project (multi-file) order
          // For project orders, we need to create multiple order items or a single project order
          // For now, we'll create separate orders for each file
          for (const projectFile of orderData.files) {
            const formData = new FormData();
            formData.append('file', projectFile.file);
            formData.append('material', projectFile.material.split('-')[0]);
            formData.append('color', projectFile.material.split('-')[1] || 'white');
            formData.append('layerHeight', projectFile.quality === 'draft' ? '0.3' : projectFile.quality === 'standard' ? '0.2' : projectFile.quality === 'high' ? '0.15' : '0.1');
            formData.append('infill', projectFile.quality === 'draft' ? '10' : projectFile.quality === 'standard' ? '20' : projectFile.quality === 'high' ? '50' : '100');
            formData.append('quantity', projectFile.quantity.toString());
            formData.append('shippingMethod', orderData.deliveryOption);
            formData.append('paymentMethod', selectedPayment);
            formData.append('price', projectFile.estimatedPrice.toString());
            formData.append('projectName', orderData.projectName);

            // Add delivery-specific details
            if (orderData.deliveryOption === 'inpost' && orderData.locker) {
              formData.append('shippingAddress', JSON.stringify({
                lockerCode: orderData.locker.name,
                lockerAddress: orderData.locker.address
              }));
            } else if (orderData.deliveryOption === 'dpd' && orderData.shippingAddress) {
              formData.append('shippingAddress', JSON.stringify(orderData.shippingAddress));
            } else if (orderData.deliveryOption === 'pickup') {
              formData.append('shippingAddress', JSON.stringify({
                type: 'pickup',
                address: 'Zielonogórska 13, 30-406 Kraków'
              }));
            }

            const response = await apiFormData('/orders', formData);

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to create order');
            }
          }

          // Simulate payment processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Send payment confirmation email
          try {
            await apiFetch('/orders/email/payment-confirmation', {
              method: 'POST',
              body: JSON.stringify({
                projectName: orderData.projectName,
                totalAmount: orderData.totalAmount,
                itemCount: orderData.files.length,
                paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
              }),
            });
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
            // Don't fail the payment if email fails
          }

          // Add notification for project order
          addNotification({
            type: "order_created",
            title: "Project Submitted",
            message: `Your project "${orderData.projectName}" with ${orderData.files.length} file(s) has been submitted successfully.`,
          });

          toast.success(`Payment successful! ${orderData.files.length} orders have been placed.`);
          navigate('/orders');
        } else {
          // Single file order
          const formData = new FormData();
          formData.append('file', orderData.file);
          formData.append('material', orderData.material.split('-')[0]);
          formData.append('color', orderData.material.split('-')[1] || 'white');
          formData.append('layerHeight', orderData.quality === 'draft' ? '0.3' : orderData.quality === 'standard' ? '0.2' : orderData.quality === 'high' ? '0.15' : '0.1');
          formData.append('infill', orderData.quality === 'draft' ? '10' : orderData.quality === 'standard' ? '20' : orderData.quality === 'high' ? '50' : '100');
          formData.append('quantity', orderData.quantity.toString());
          formData.append('shippingMethod', orderData.deliveryOption);
          formData.append('paymentMethod', selectedPayment);
          formData.append('price', orderData.totalAmount.toString());

          // Add delivery-specific details
          if (orderData.deliveryOption === 'inpost' && orderData.locker) {
            formData.append('shippingAddress', JSON.stringify({
              lockerCode: orderData.locker.name,
              lockerAddress: orderData.locker.address
            }));
          } else if (orderData.deliveryOption === 'dpd' && orderData.shippingAddress) {
            formData.append('shippingAddress', JSON.stringify(orderData.shippingAddress));
          } else if (orderData.deliveryOption === 'pickup') {
            formData.append('shippingAddress', JSON.stringify({
              type: 'pickup',
              address: 'Zielonogórska 13, 30-406 Kraków'
            }));
          }

          const response = await apiFormData('/orders', formData);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create order');
          }

          // Simulate payment processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Send payment confirmation email
          try {
            await apiFetch('/orders/email/payment-confirmation', {
              method: 'POST',
              body: JSON.stringify({
                totalAmount: orderData.totalAmount,
                itemCount: 1,
                paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
              }),
            });
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
            // Don't fail the payment if email fails
          }

          // Add notification for single order
          addNotification({
            type: "order_created",
            title: "Order Submitted",
            message: `Your print order for "${orderData.file.name}" has been submitted successfully.`,
          });

          toast.success("Payment successful! Your order has been placed.");
          navigate('/orders');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading for both new order and upgrade payment scenarios
  if (!orderData && !upgradeData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Calculate display amount based on payment type
  const displayAmount = isUpgradePayment && upgradeData 
    ? upgradeData.amount 
    : orderData?.totalAmount || 0;

  const displayTitle = isUpgradePayment 
    ? `Extra Payment for Order #${upgradeData?.orderNumber || ''}` 
    : 'Complete Your Order';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      <DashboardSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-slide-up">
            <Button 
              variant="ghost" 
              onClick={() => isUpgradePayment ? navigate(`/orders/${upgradeData?.orderId}/edit`) : navigate('/new-print')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isUpgradePayment ? 'Back to Edit Order' : 'Back to Order'}
            </Button>
            <h1 className="text-4xl font-bold mb-3 gradient-text">
              {isUpgradePayment ? displayTitle : 'Payment'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isUpgradePayment ? 'Pay the difference for your updated order' : 'Complete your order securely'}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>Choose how you'd like to pay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover-lift ${
                        selectedPayment === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="w-5 h-5"
                      />
                      <div className={`p-3 rounded-lg ${selectedPayment === method.id ? 'bg-primary text-white' : 'bg-muted'}`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">{method.name}</p>
                          {method.popular && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  ))}

                  {/* BLIK Code Input */}
                  {selectedPayment === "blik" && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl animate-scale-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Smartphone className="w-5 h-5 text-pink-600" />
                        <p className="font-bold text-pink-800">Enter BLIK Code</p>
                      </div>
                      <p className="text-sm text-pink-700 mb-4">
                        Open your banking app and generate a 6-digit BLIK code
                      </p>
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={blikCode}
                        onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-3xl font-mono tracking-[0.5em] h-16 border-2 border-pink-300 focus:border-pink-500"
                      />
                      <p className="text-xs text-pink-600 mt-2 text-center">
                        Code expires in 2 minutes
                      </p>
                    </div>
                  )}

                  {/* Card Details Input */}
                  {selectedPayment === "card" && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl animate-scale-in space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <p className="font-bold text-blue-800">Card Details</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                          maxLength={19}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              setCardDetails({ ...cardDetails, expiry: value });
                            }}
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            type="password"
                            placeholder="•••"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Info */}
                  {selectedPayment === "transfer" && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl animate-scale-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-green-600" />
                        <p className="font-bold text-green-800">Bank Transfer (Przelewy24)</p>
                      </div>
                      <p className="text-sm text-green-700">
                        You'll be redirected to your bank's website to complete the payment securely.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['PKO BP', 'mBank', 'ING', 'Santander', 'Pekao', 'Alior'].map((bank) => (
                          <span key={bank} className="px-3 py-1 bg-white border border-green-200 rounded-full text-xs font-medium text-green-700">
                            {bank}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Secure Payment
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {isUpgradePayment ? 'Upgrade Payment' : 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isUpgradePayment && upgradeData ? (
                    // Upgrade payment summary
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order</span>
                          <span className="font-medium">#{upgradeData.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Previous Price</span>
                          <span className="font-medium">{upgradeData.previousPrice?.toFixed(2) || '0.00'} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New Price</span>
                          <span className="font-medium">{upgradeData.totalAmount?.toFixed(2) || '0.00'} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Extra Payment</span>
                          <span className="text-3xl font-bold gradient-text">
                            {upgradeData.amount.toFixed(2)} PLN
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          This is the difference between your new and previous order total
                        </p>
                      </div>
                    </>
                  ) : orderData?.isProject ? (
                    // Project (multi-file) order summary
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Project</span>
                          <span className="font-medium">{orderData.projectName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Files</span>
                          <span className="font-medium">{orderData.files.length} items</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">FILES IN PROJECT</p>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {orderData.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="truncate text-xs">{file.file.name}</span>
                              </div>
                              <span className="font-medium text-xs flex-shrink-0 ml-2">{file.estimatedPrice.toFixed(2)} PLN</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{orderData.projectTotal.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery</span>
                          <span>{orderData.deliveryPrice.toFixed(2)} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total</span>
                          <span className="text-3xl font-bold gradient-text">
                            {orderData.totalAmount.toFixed(2)} PLN
                          </span>
                        </div>
                      </div>
                    </>
                  ) : orderData ? (
                    // Single file order summary
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Material</span>
                          <span className="font-medium">{orderData.material}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quality</span>
                          <span className="font-medium capitalize">{orderData.quality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-medium">×{orderData.quantity}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Internal Costs</span>
                          <span>{orderData.priceBreakdown.internalCost.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Fee</span>
                          <span>{orderData.priceBreakdown.serviceFee.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT (23%)</span>
                          <span>{orderData.priceBreakdown.vat.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery</span>
                          <span>{orderData.deliveryPrice.toFixed(2)} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total</span>
                          <span className="text-3xl font-bold gradient-text">
                            {orderData.totalAmount.toFixed(2)} PLN
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <Button
                    onClick={handlePayment}
                    disabled={!selectedPayment || isProcessing}
                    className="w-full h-14 text-lg mt-4"
                    size="lg"
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Pay {displayAmount.toFixed(2)} PLN
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By completing this payment, you agree to our Terms of Service
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
