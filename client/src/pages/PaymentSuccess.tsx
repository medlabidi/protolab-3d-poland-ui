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

      // Wait a bit for PayU webhook notification to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Fetch order details to verify payment status
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://protolab.info/api'}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const order = data.order || data;
        setOrderDetails(order);
        
        // Check payment status from database (updated by webhook)
        if (order.payment_status === 'completed' || order.payment_status === 'paid') {
          setStatus('success');
          toast.success('Payment successful! Your order is confirmed.');
        } else if (order.payment_status === 'pending' || order.payment_status === 'on_hold') {
          setStatus('checking');
          toast.info('Payment is being processed. This may take a few moments.');
          // Retry after a delay
          setTimeout(() => checkPaymentStatus(), 3000);
        } else if (order.payment_status === 'failed') {
          setStatus('failed');
          toast.error('Payment failed. Please try again or contact support.');
        } else {
          setStatus('failed');
          toast.error('Payment verification failed. Please contact support.');
        }
      } else {
        setStatus('failed');
        toast.error('Failed to verify payment status');
      }
    } catch (error) {
      console.error('Payment check error:', error);
      setStatus('failed');
      toast.error('Failed to verify payment status');
    }
  };

  const handleContinue = () => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-blue-500 dark:text-blue-400 animate-spin" />
              </div>
              <CardTitle className="text-2xl dark:text-gray-100">Processing Payment</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Please wait while we confirm your payment...
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Thank you for your payment. Your transaction has been completed.
              </CardDescription>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">Payment Failed</CardTitle>
              <CardDescription className="dark:text-gray-300">
                We couldn't verify your payment. Please check your account or contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {status !== 'checking' && (
          <CardContent className="space-y-4">
            {orderDetails && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Order ID:</span>
                  <span className="font-mono text-xs dark:text-gray-200">{orderDetails.id || searchParams.get('orderId')}</span>
                </div>
                {orderDetails.price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                    <span className="font-medium dark:text-gray-100">{orderDetails.price} PLN</span>
                  </div>
                )}
                {orderDetails.file_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">File:</span>
                    <span className="font-medium dark:text-gray-100 truncate max-w-[200px]">{orderDetails.file_name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <span className="font-medium dark:text-gray-100 capitalize">{orderDetails.payment_status || 'Processing'}</span>
                </div>
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

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              If you have any questions, please contact our support team.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
