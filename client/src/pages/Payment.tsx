import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CreditCard, Building2, Smartphone, Shield, Lock, CheckCircle2, FileText, Wallet } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiFormData } from "@/lib/api";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

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

// Saved payment method interface (from Settings)
interface SavedPaymentMethod {
  id: string;
  type: 'card';
  name: string;
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

// Billing information interface (from Settings)
interface BillingInfo {
  companyName: string;
  taxId: string;
  vatNumber: string;
  billingAddress: string;
  billingCity: string;
  billingZipCode: string;
  billingCountry: string;
  billingEmail: string;
  generateInvoice: boolean;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [upgradeData, setUpgradeData] = useState<UpgradeData | null>(null);
  const [isUpgradePayment, setIsUpgradePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [generateInvoice, setGenerateInvoice] = useState(false);

  // Helper function for PayU payment processing
  const processPayUPayment = async (
    amount: number,
    description: string,
    products: Array<{ name: string; unitPrice: number; quantity: number }>
  ) => {
    // TODO: Implement PayU payment flow for upgrades
    // This is a placeholder for the upgrade payment flow
    console.log('Processing PayU payment:', { amount, description, products });
    // For now, we'll just simulate success
    return Promise.resolve();
  };

  useEffect(() => {
    // Load billing information from localStorage
    const savedBillingInfo = localStorage.getItem("billingInfo");
    if (savedBillingInfo) {
      try {
        const billing = JSON.parse(savedBillingInfo) as BillingInfo;
        setBillingInfo(billing);
        // Auto-enable invoice generation if billing info has it enabled
        setGenerateInvoice(billing.generateInvoice);
      } catch (error) {
        console.error("Failed to parse billing info:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Check if this is an upgrade payment
    if (location.state?.isUpgrade) {
      setIsUpgradePayment(true);
      setUpgradeData(location.state as UpgradeData);
    } else if (location.state?.orderData) {
      // Regular new order payment
      setOrderData(location.state.orderData);
    } else {
      toast.error(t('payment.toasts.noOrderData'));
      navigate("/new-print");
    }
  }, [location.state, navigate]);



  const handleProceedToPayment = async () => {
    setIsProcessing(true);

    try {
      // For upgrades, redirect to PaymentPage with upgrade info
      if (isUpgradePayment && upgradeData) {
        toast.info('Upgrade payment flow needs integration');
        navigate('/orders');
        return;
      }

      if (!orderData) {
        toast.error('No order data available');
        return;
      }

      // Pass order data to PaymentPage for order creation there
      navigate('/payment/new', { 
        state: { orderData, generateInvoice } 
      });
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to proceed to payment');
      setIsProcessing(false);
    }
  };

  // Show loading for both new order and upgrade payment scenarios
  if (!orderData && !upgradeData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // Calculate display amount based on payment type
  const displayAmount = isUpgradePayment && upgradeData 
    ? upgradeData.amount 
    : orderData?.totalAmount || 0;

  const displayTitle = isUpgradePayment 
    ? `${t('payment.extraPaymentFor')} #${upgradeData?.orderNumber || ''}`
    : t('payment.completeOrder');

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
              {isUpgradePayment ? t('payment.backToEditOrder') : t('payment.backToOrder')}
            </Button>
            <h1 className="text-4xl font-bold mb-3 gradient-text">
              {isUpgradePayment ? displayTitle : t('payment.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isUpgradePayment ? t('payment.payDifference') : t('payment.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Review */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    {isUpgradePayment ? 'Order Upgrade Review' : t('payment.orderReview')}
                  </CardTitle>
                  <CardDescription>
                    {isUpgradePayment 
                      ? 'Review upgrade details and continue to payment' 
                      : t('payment.reviewAndContinue')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 bg-muted/30 rounded-lg text-center space-y-2">
                    <Lock className="w-12 h-12 mx-auto text-primary" />
                    <p className="font-medium">Your order will be created and you'll be redirected to secure payment</p>
                    <p className="text-sm text-muted-foreground">All payment methods are available on the next page</p>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-primary">{t('payment.securePayment')}</p>
                      <p className="text-muted-foreground">{t('payment.encryptedSecure')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <div className="flex items-center justify-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">{t('payment.ssl')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('payment.securePayment')}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {isUpgradePayment ? t('payment.upgradePayment') : t('payment.orderSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isUpgradePayment && upgradeData ? (
                    // Upgrade payment summary
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.order')}</span>
                          <span className="font-medium">#{upgradeData.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.previousPrice')}</span>
                          <span className="font-medium">{upgradeData.previousPrice?.toFixed(2) || '0.00'} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.newPrice')}</span>
                          <span className="font-medium">{upgradeData.totalAmount?.toFixed(2) || '0.00'} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">{t('payment.extraPayment')}</span>
                          <span className="text-3xl font-bold gradient-text">
                            {upgradeData.amount.toFixed(2)} PLN
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('payment.differenceExplanation')}
                        </p>
                      </div>

                      {/* Invoice Option */}
                      {billingInfo && billingInfo.companyName && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{t('payment.generateInvoice')}</p>
                                <p className="text-xs text-muted-foreground">{billingInfo.companyName}</p>
                              </div>
                            </div>
                            <Switch checked={generateInvoice} onCheckedChange={setGenerateInvoice} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : orderData?.isProject ? (
                    // Project (multi-file) order summary
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.project')}</span>
                          <span className="font-medium">{orderData.projectName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.files')}</span>
                          <span className="font-medium">{orderData.files.length} {t('payment.items')}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">{t('payment.filesInProject')}</p>
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
                          <span className="text-muted-foreground">{t('payment.subtotal')}</span>
                          <span>{orderData.projectTotal.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.delivery')}</span>
                          <span>{orderData.deliveryPrice.toFixed(2)} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">{t('payment.total')}</span>
                          <span className="text-3xl font-bold gradient-text">
                            {orderData.totalAmount.toFixed(2)} PLN
                          </span>
                        </div>
                      </div>

                      {/* Invoice Option */}
                      {billingInfo && billingInfo.companyName && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{t('payment.generateInvoice')}</p>
                                <p className="text-xs text-muted-foreground">{billingInfo.companyName}</p>
                              </div>
                            </div>
                            <Switch checked={generateInvoice} onCheckedChange={setGenerateInvoice} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : orderData ? (
                    // Single file order summary
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.material')}</span>
                          <span className="font-medium">{orderData.material}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.quality')}</span>
                          <span className="font-medium capitalize">{orderData.quality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.quantity')}</span>
                          <span className="font-medium">×{orderData.quantity}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.internalCosts')}</span>
                          <span>{orderData.priceBreakdown.internalCost.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.serviceFee')}</span>
                          <span>{orderData.priceBreakdown.serviceFee.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.vat')}</span>
                          <span>{orderData.priceBreakdown.vat.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.delivery')}</span>
                          <span>{orderData.deliveryPrice.toFixed(2)} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">{t('payment.total')}</span>
                          <span className="text-3xl font-bold gradient-text">
                            {orderData.totalAmount.toFixed(2)} PLN
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {/* Invoice Option */}
                  {billingInfo && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{t('payment.generateInvoice')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('payment.invoiceFor')} {billingInfo.companyName}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          checked={generateInvoice} 
                          onCheckedChange={setGenerateInvoice} 
                        />
                      </div>
                      {generateInvoice && (
                        <div className="mt-2 p-3 bg-primary/5 rounded-lg text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">{t('payment.invoiceWillGenerate')}</p>
                          <p>{billingInfo.companyName}</p>
                          <p>NIP: {billingInfo.taxId}</p>
                          <p>{billingInfo.billingAddress}, {billingInfo.billingZipCode} {billingInfo.billingCity}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!billingInfo && (
                    <div className="border-t pt-4 mt-4">
                      <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <FileText className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t('payment.wantInvoice')}{' '}
                          <button 
                            onClick={() => navigate('/settings')} 
                            className="text-primary hover:underline font-medium"
                          >
                            {t('payment.addBillingInfo')}
                          </button>
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isProcessing}
                    className="w-full h-14 text-lg mt-4"
                    size="lg"
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('payment.processing')}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {t('payment.continueToPayment')}
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t('payment.termsAgreement')}
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
