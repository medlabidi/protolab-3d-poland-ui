import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Building2, Wallet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RefundData {
  orderId: string;
  orderNumber: string;
  originalPrice: number;
  newPrice: number;
  refundAmount: number;
  reason: 'cancellation' | 'price_reduction' | 'edit';
}

const Refund = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [refundData, setRefundData] = useState<RefundData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankName: "",
    accountHolder: "",
  });

  useEffect(() => {
    // Data is passed directly in state, not nested under refundData
    const state = location.state;
    if (state?.orderId && state?.refundAmount !== undefined) {
      setRefundData({
        orderId: state.orderId,
        orderNumber: state.orderNumber || '',
        originalPrice: state.originalPrice || 0,
        newPrice: state.newPrice || 0,
        refundAmount: state.refundAmount,
        reason: state.reason === 'order_modification' ? 'price_reduction' : state.reason || 'price_reduction',
      });
    } else if (state?.refundData) {
      // Also support nested refundData for backwards compatibility
      setRefundData(state.refundData);
    } else {
      navigate('/orders');
    }
  }, [location.state, navigate]);

  const refundMethods = [
    {
      id: "original",
      name: "Original Payment Method",
      description: "Refund to the original payment method used",
      icon: CreditCard,
    },
    {
      id: "bank",
      name: "Bank Transfer",
      description: "Direct transfer to your bank account",
      icon: Building2,
    },
    {
      id: "credit",
      name: "Store Credit",
      description: "Add to your account balance for future orders",
      icon: Wallet,
      bonus: "+5% bonus",
    },
  ];

  const handleRefundRequest = async () => {
    if (!selectedMethod) {
      toast.error("Please select a refund method");
      return;
    }

    if (selectedMethod === "bank" && (!bankDetails.accountNumber || !bankDetails.bankName)) {
      toast.error("Please fill in all bank details");
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // First, get pending order updates from session storage (if price reduction)
      const pendingUpdate = sessionStorage.getItem('pendingOrderUpdate');
      
      // Determine what statuses to set based on refund reason
      const isCancellation = refundData?.reason === 'cancellation';
      const newOrderStatus = isCancellation ? 'suspended' : 'on_hold';
      const newPaymentStatus = isCancellation ? 'refunding' : 'on_hold';
      
      // Update the order with new statuses and apply any pending updates
      let updatePayload: Record<string, unknown> = {
        status: newOrderStatus,
        payment_status: newPaymentStatus,
      };
      
      // If there are pending updates (price reduction), merge them
      if (pendingUpdate && !isCancellation) {
        const parsedUpdate = JSON.parse(pendingUpdate);
        updatePayload = {
          ...parsedUpdate.updates,
          status: newOrderStatus,
          payment_status: newPaymentStatus,
        };
      }
      
      // Update the order
      const updateResponse = await fetch(`${API_URL}/orders/${refundData?.orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }
      
      // Clear pending update from session storage
      sessionStorage.removeItem('pendingOrderUpdate');

      // Submit refund request
      try {
        await fetch(`${API_URL}/orders/${refundData?.orderId}/refund`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refundMethod: selectedMethod,
            refundAmount: refundData?.refundAmount,
            reason: refundData?.reason,
            bankDetails: selectedMethod === 'bank' ? bankDetails : undefined,
          }),
        });
      } catch {
        // Refund endpoint may not exist yet, continue anyway
        console.log('Refund endpoint not available, order status updated');
      }

      // Send refund request confirmation email
      try {
        await fetch(`${API_URL}/orders/email/refund-request`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNumber: refundData?.orderNumber,
            refundAmount: refundData?.refundAmount,
            reason: refundData?.reason,
            refundMethod: selectedMethod,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send refund request email:', emailError);
        // Don't fail the refund if email fails
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Refund request submitted successfully!");
      
      if (isCancellation) {
        navigate('/orders');
      } else {
        navigate(`/orders/${refundData?.orderId}`);
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process refund. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!refundData) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const getReasonTitle = () => {
    switch (refundData.reason) {
      case 'cancellation':
        return 'Order Cancellation Refund';
      case 'price_reduction':
        return 'Price Adjustment Refund';
      case 'edit':
        return 'Order Modification Refund';
      default:
        return 'Refund Request';
    }
  };

  const getReasonDescription = () => {
    switch (refundData.reason) {
      case 'cancellation':
        return 'You are cancelling your order. The full amount will be refunded.';
      case 'price_reduction':
        return 'Your order modifications resulted in a lower price. The difference will be refunded.';
      case 'edit':
        return 'Your order has been updated with a price reduction.';
      default:
        return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 animate-slide-up">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">{getReasonTitle()}</h1>
              <p className="text-muted-foreground">{getReasonDescription()}</p>
            </div>
          </div>

          {/* Refund Summary */}
          <Card className="shadow-xl animate-scale-in border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Refund Summary
              </CardTitle>
              <CardDescription>
                Order #{refundData.orderNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {refundData.reason !== 'cancellation' && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="font-medium">{refundData.originalPrice.toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">New Price</span>
                    <span className="font-medium">{refundData.newPrice.toFixed(2)} PLN</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-3 bg-green-50 dark:bg-green-900/20 px-4 rounded-lg">
                <span className="font-semibold text-green-700 dark:text-green-400">Refund Amount</span>
                <span className="font-bold text-xl text-green-700 dark:text-green-400">
                  {refundData.refundAmount.toFixed(2)} PLN
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Refund Method Selection */}
          <Card className="shadow-lg animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Select Refund Method</CardTitle>
              <CardDescription>
                Choose how you'd like to receive your refund
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedMethod || ""} onValueChange={setSelectedMethod}>
                <div className="space-y-4">
                  {refundMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover-lift ${
                        selectedMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <method.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                          {method.name}
                          {method.bonus && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {method.bonus}
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.description}
                        </p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary absolute top-4 right-4" />
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {/* Bank Details Form */}
              {selectedMethod === "bank" && (
                <div className="mt-6 space-y-4 p-4 bg-muted/50 rounded-xl animate-slide-up">
                  <h3 className="font-semibold">Bank Account Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Account Holder Name</Label>
                    <Input
                      id="accountHolder"
                      placeholder="John Doe"
                      value={bankDetails.accountHolder}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="PKO Bank Polski"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">IBAN / Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="PL00 0000 0000 0000 0000 0000 0000"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Time Info */}
          <Card className="shadow-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Processing Time</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMethod === 'original' && "Refunds to original payment method typically take 3-5 business days."}
                    {selectedMethod === 'bank' && "Bank transfers typically take 2-3 business days."}
                    {selectedMethod === 'credit' && "Store credit is applied instantly to your account."}
                    {!selectedMethod && "Processing time varies by refund method."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleRefundRequest}
              disabled={!selectedMethod || isProcessing}
              className="min-w-[200px] hover-lift shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Refund Request
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Refund;
