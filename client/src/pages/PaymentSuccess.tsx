import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const orderId = searchParams.get('orderId');
      
      if (!orderId) {
        setStatus('failed');
        toast.error('Invalid payment reference');
        return;
      }

      // Get pending purchase info
      const pendingPurchase = sessionStorage.getItem('pendingCreditPurchase');
      if (pendingPurchase) {
        const purchaseData = JSON.parse(pendingPurchase);
        setOrderDetails(purchaseData);
        sessionStorage.removeItem('pendingCreditPurchase');
      }

      // Wait a bit for PayU notification to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if this is a credit purchase
      if (orderId.startsWith('credit_')) {
        // Fetch updated credit balance
        const response = await apiFetch('/credits/balance');
        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          toast.success(`Payment successful! Your new balance is ${data.balance} PLN`);
        } else {
          setStatus('success');
          toast.success('Payment successful! Credits will be added shortly.');
        }
      } else {
        // Regular order payment
        const response = await apiFetch(`/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);
          setStatus('success');
          toast.success('Payment successful! Your order is being processed.');
        } else {
          setStatus('success');
          toast.success('Payment successful! Order details will be updated shortly.');
        }
      }
    } catch (error) {
      console.error('Payment check error:', error);
      setStatus('failed');
      toast.error('Failed to verify payment status');
    }
  };

  const handleContinue = () => {
    if (orderDetails?.orderId?.startsWith('credit_')) {
      navigate('/credits');
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Processing Payment</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment...
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Thank you for your payment. Your transaction has been completed.
              </CardDescription>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
              <CardDescription>
                We couldn't verify your payment. Please check your account or contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {status !== 'checking' && (
          <CardContent className="space-y-4">
            {orderDetails && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{orderDetails.amount} PLN</span>
                </div>
                {orderDetails.orderId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono text-xs">{orderDetails.orderId}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={handleContinue} 
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {status === 'failed' && (
                <Button 
                  onClick={() => navigate('/credits')} 
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-gray-500">
              If you have any questions, please contact our support team.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
