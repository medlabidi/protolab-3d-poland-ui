import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface PayUSecureFormProps {
  onTokenReceived: (token: string) => void;
  amount: number;
}

// Extend Window interface for PayU SDK
declare global {
  interface Window {
    PayU?: {
      SecureForm: {
        init: (config: {
          lang: string;
        }) => void;
        add: (type: string, config: {
          placeholder: string;
          style: Record<string, string>;
        }) => {
          render: (selector: string) => void;
          clear: () => void;
          focus: () => void;
        };
        tokenize: (type: string) => Promise<{
          status: string;
          body: {
            token: string;
            mask: string;
          };
          error?: {
            messages: string[];
          };
        }>;
      };
    };
  }
}

export function PayUSecureForm({ onTokenReceived, amount }: PayUSecureFormProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const cardFormRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    loadPayUSDK();

    return () => {
      // Cleanup if needed
      if (cardFormRef.current) {
        try {
          cardFormRef.current.clear();
        } catch (e) {
          console.error('Error clearing secure form:', e);
        }
      }
    };
  }, []);

  const loadPayUSDK = () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setError('Payment form only available in browser');
      setLoading(false);
      return;
    }

    // Check if already loaded
    if (scriptLoadedRef.current || window.PayU) {
      console.log('[PAYU-SECURE-FORM] SDK already available, initializing...');
      initializeSecureForm();
      return;
    }

    // Try multiple SDK URLs (sandbox first, then production)
    const sdkUrls = [
      'https://secure.snd.payu.com/javascript/sdk', // Sandbox
      'https://secure.payu.com/javascript/sdk',     // Production
    ];
    
    let currentUrlIndex = 0;
    console.log('[PAYU-SECURE-FORM] Loading SDK from:', sdkUrls[currentUrlIndex]);

    const script = document.createElement('script');
    script.src = sdkUrls[currentUrlIndex];
    script.type = 'text/javascript';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      console.log('[PAYU-SECURE-FORM] SDK script loaded');
      scriptLoadedRef.current = true;
      
      // Give more time for SDK to initialize with extended checking
      let retryCount = 0;
      const maxRetries = 20; // Increased retries
      
      const checkSDK = () => {
        // More thorough SDK availability check
        const hasPayU = typeof window !== 'undefined' && window.PayU;
        const hasSecureForm = hasPayU && window.PayU.SecureForm;
        const hasInit = hasSecureForm && typeof window.PayU.SecureForm.init === 'function';
        const hasAdd = hasSecureForm && typeof window.PayU.SecureForm.add === 'function';
        
        console.log('[PAYU-SECURE-FORM] SDK Check:', {
          hasPayU: !!hasPayU,
          hasSecureForm: !!hasSecureForm,
          hasInit: !!hasInit,
          hasAdd: !!hasAdd,
          retry: retryCount + 1
        });
        
        if (hasPayU && hasSecureForm && hasInit && hasAdd) {
          console.log('[PAYU-SECURE-FORM] SDK fully available after', retryCount, 'retries');
          initializeSecureForm();
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkSDK, 300); // Longer intervals
        } else {
          console.error('[PAYU-SECURE-FORM] SDK failed to initialize after', maxRetries, 'retries');
          console.error('[PAYU-SECURE-FORM] Final SDK state:', {
            windowPayU: typeof window !== 'undefined' ? !!window.PayU : 'no window',
            PayUKeys: typeof window !== 'undefined' && window.PayU ? Object.keys(window.PayU) : 'none'
          });
          setError('Payment form failed to load. Please refresh the page and try again.');
          setLoading(false);
        }
      };
      
      setTimeout(checkSDK, 200);
    };

    script.onerror = (e) => {
      console.error('[PAYU-SECURE-FORM] Failed to load SDK from:', sdkUrls[currentUrlIndex], e);
      
      // Try next URL if available
      currentUrlIndex++;
      if (currentUrlIndex < sdkUrls.length) {
        console.log('[PAYU-SECURE-FORM] Trying next SDK URL:', sdkUrls[currentUrlIndex]);
        script.remove();
        
        const newScript = document.createElement('script');
        newScript.src = sdkUrls[currentUrlIndex];
        newScript.type = 'text/javascript';
        newScript.async = true;
        newScript.crossOrigin = 'anonymous';
        newScript.onload = script.onload;
        newScript.onerror = script.onerror;
        document.body.appendChild(newScript);
        return;
      }
      
      setError('Failed to load payment form from all sources. Please refresh the page.');
      setLoading(false);
    };

    document.body.appendChild(script);
  };

  const initializeSecureForm = () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    try {
      console.log('[PAYU-SECURE-FORM] Checking PayU availability:', !!window.PayU);
      console.log('[PAYU-SECURE-FORM] SecureForm available:', !!(window.PayU?.SecureForm));

      if (!window.PayU || !window.PayU.SecureForm) {
        console.error('[PAYU-SECURE-FORM] PayU SDK not available');
        setError('PayU SDK not available. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Initialize Secure Form
      console.log('[PAYU-SECURE-FORM] Initializing SecureForm...');
      window.PayU.SecureForm.init({ lang: 'pl' });

      // Add card form
      cardFormRef.current = window.PayU.SecureForm.add('card', {
        placeholder: {
          number: '0000 0000 0000 0000',
          date: 'MM/YY',
          cvv: 'CVV',
        } as any,
        style: {
          basic: {
            'font-size': '16px',
            'font-family': 'system-ui, -apple-system, sans-serif',
            'color': '#1a1a1a',
          },
          invalid: {
            'color': '#ef4444',
          },
          placeholder: {
            'color': '#9ca3af',
          },
        } as any,
      });

      // Render in container
      cardFormRef.current.render('#payu-card-form');

      console.log('[PAYU-SECURE-FORM] Form initialized successfully');
      setLoading(false);

    } catch (err) {
      console.error('[PAYU-SECURE-FORM] Initialization error:', err);
      setError(`Failed to initialize payment form: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleTokenize = async () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setError('Not available');
      return;
    }

    if (!window.PayU || !cardFormRef.current) {
      setError('Payment form not ready');
      return;
    }

    setTokenizing(true);
    setError(null);

    try {
      console.log('[PAYU-SECURE-FORM] Tokenizing card...');
      
      const response = await window.PayU.SecureForm.tokenize('MULTI');

      if (response.status === 'SUCCESS') {
        const token = response.body.token;
        const mask = response.body.mask;
        
        console.log('[PAYU-SECURE-FORM] Token received:', mask);
        onTokenReceived(token);
        
      } else {
        const errorMessages = response.error?.messages || ['Tokenization failed'];
        setError(errorMessages.join(', '));
        console.error('[PAYU-SECURE-FORM] Tokenization failed:', errorMessages);
      }

    } catch (err: any) {
      console.error('[PAYU-SECURE-FORM] Tokenization error:', err);
      setError(err.message || 'Failed to process card information');
    } finally {
      setTokenizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        Enter your card details securely
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* PayU Secure Form Container */}
      <div 
        id="payu-card-form" 
        className={`min-h-[120px] border rounded-lg p-4 bg-white ${loading ? 'hidden' : ''}`}
      />

      {!loading && (
        <button
          type="button"
          onClick={handleTokenize}
          disabled={tokenizing}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {tokenizing ? (
            <>
              <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Validate Card'
          )}
        </button>
      )}

      <div className="text-xs text-muted-foreground mt-2">
        <p>🔒 Your card information is securely processed by PayU and never stored on our servers.</p>
      </div>
    </div>
  );
}
