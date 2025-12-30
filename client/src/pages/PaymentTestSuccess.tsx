import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentTestSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState({
    orderId: searchParams.get('orderId') || 'N/A',
    error: searchParams.get('error') || null,
  });

  useEffect(() => {
    // Log all URL parameters for debugging
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    console.log('Payment callback params:', params);
    
    if (params.orderId) {
      setPaymentDetails({
        orderId: params.orderId,
        error: params.error || null,
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Test Completed</CardTitle>
          <CardDescription>
            This is a test payment callback page for PayU sandbox integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900">Payment Error</p>
              <p className="text-sm text-red-700">{paymentDetails.error}</p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900">Payment Successful!</p>
              <p className="text-sm text-green-700">Test payment completed successfully in PayU sandbox</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Payment Details:</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono">{paymentDetails.orderId}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> PayU will send a notification to the webhook endpoint 
              (<code className="text-xs">/api/payu-notify-test</code>) to confirm the payment status.
            </p>
          </div>

          <div className="pt-4 text-center">
            <a
              href="/payu-test"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Another Test
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
