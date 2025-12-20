import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/config/api';

interface BlikPaymentProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function BlikPayment({ orderId, amount, onSuccess, onError }: BlikPaymentProps) {
  const [blikCode, setBlikCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'blik' | 'standard'>('blik');

  const handleBlikPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/payments/blik`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          blikCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Payment failed');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process payment';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStandardPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      // Redirect to PayU payment page
      if (data.redirectUri) {
        window.location.href = data.redirectUri;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process payment';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatBlikCode = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setBlikCode(cleaned);
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Payment initiated successfully!</strong>
          <p className="mt-2">
            Please check your banking app to authorize the payment. This usually takes just a few seconds.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Choose your payment method to complete the order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center items-center space-x-4 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Amount to pay:</span>
          <span className="text-2xl font-bold">{amount.toFixed(2)} PLN</span>
        </div>

        {/* Payment Method Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('blik')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'blik'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <Smartphone className="h-8 w-8" />
              <span className="font-medium">BLIK</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('standard')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'standard'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <CreditCard className="h-8 w-8" />
              <span className="font-medium">Card/Transfer</span>
            </div>
          </button>
        </div>

        {/* BLIK Payment Form */}
        {paymentMethod === 'blik' && (
          <form onSubmit={handleBlikPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blikCode">BLIK Authorization Code</Label>
              <Input
                id="blikCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={blikCode}
                onChange={(e) => formatBlikCode(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={loading}
                required
              />
              <p className="text-sm text-muted-foreground">
                Open your banking app and generate a 6-digit BLIK code
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || blikCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Pay with BLIK
                </>
              )}
            </Button>
          </form>
        )}

        {/* Standard Payment */}
        {paymentMethod === 'standard' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You will be redirected to PayU payment gateway where you can choose from various
              payment methods including credit cards, bank transfers, and more.
            </p>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleStandardPayment}
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </Button>
          </div>
        )}

        {/* Test Instructions for Sandbox */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Sandbox Testing:</strong>
            <p className="mt-2 text-sm">
              For BLIK testing, use code: <code className="font-mono font-bold">777123</code>
              <br />
              This is a test environment - no real money will be charged.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default BlikPayment;
