/**
 * TEMPORARY PayU Sandbox Test Page
 * 
 * Simple UI to test PayU sandbox integration
 * DELETE THIS FILE AFTER TESTING
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export default function PayUTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/payu-test');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Test failed');
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">PayU Sandbox Test</h1>
          <p className="text-muted-foreground">Test PayU sandbox integration and connectivity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>
              Tests OAuth authentication and order creation with PayU sandbox (secure.snd.payu.com)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runTest} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Test...
                </>
              ) : (
                'Run PayU Sandbox Test'
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Test Failed:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {result && result.success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Test Successful!</strong> PayU sandbox is properly configured.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Authentication Result */}
            {result.steps?.authentication && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.steps.authentication.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Step 1: OAuth Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(result.steps.authentication, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Order Creation Result */}
            {result.steps?.orderCreation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.steps.orderCreation.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Step 2: Order Creation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(result.steps.orderCreation, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Payment URL */}
            {result.paymentUrl && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Complete Test Payment</CardTitle>
                  <CardDescription>
                    Click the button below to open PayU sandbox payment page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => window.open(result.paymentUrl, '_blank')}
                    size="lg"
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Open PayU Payment Page
                  </Button>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Test Instructions:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      {result.instructions?.map((instruction: string, i: number) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Sandbox Test Cards:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Card: 4444 3333 2222 1111</li>
                        <li>• Expiry: Any future date</li>
                        <li>• CVV: Any 3 digits</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <p className="text-sm text-muted-foreground">
                    Payment URL: <code className="bg-muted px-2 py-1 rounded text-xs">{result.paymentUrl}</code>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Raw Response */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">⚠️ Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <p>• This is testing against PayU SANDBOX (secure.snd.payu.com)</p>
            <p>• Use test card: 4444 3333 2222 1111 for successful payments</p>
            <p>• Check server logs (Vercel dashboard) for notification callbacks</p>
            <p>• Notification endpoint: /api/payu-notify-test</p>
            <p>• Delete test endpoints after verification is complete</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
