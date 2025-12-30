import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, Plus, CreditCard, Smartphone, Building2, Gift, Clock, CheckCircle2, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiFormData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditPackage {
  id: string;
  amount: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface Transaction {
  id: string;
  type: "credit" | "debit" | "refund";
  amount: number;
  description: string;
  created_at: string;
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

const Credits = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [blikCode, setBlikCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);

  const creditPackages: CreditPackage[] = [
    { id: "small", amount: 50, price: 50 },
    { id: "medium", amount: 100, price: 100, popular: true },
    { id: "large", amount: 200, price: 200 },
    { id: "xl", amount: 500, price: 500, bestValue: true },
  ];

  const paymentMethods = [
    { id: "blik", name: "BLIK", icon: Smartphone, description: "Pay instantly with BLIK code" },
    { id: "card", name: "Card", icon: CreditCard, description: "Credit/Debit card" },
    { id: "transfer", name: "Transfer", icon: Building2, description: "Bank transfer (P24)" },
  ];

  useEffect(() => {
    fetchCreditsData();
    
    // Load saved payment methods from localStorage
    const savedMethods = localStorage.getItem("paymentMethods");
    if (savedMethods) {
      try {
        const methods = JSON.parse(savedMethods) as SavedPaymentMethod[];
        setSavedPaymentMethods(methods);
        // Auto-select default saved card if exists
        const defaultMethod = methods.find(m => m.isDefault);
        if (defaultMethod) {
          setSelectedPayment(`saved_${defaultMethod.id}`);
        }
      } catch (error) {
        console.error("Failed to parse saved payment methods:", error);
      }
    }
  }, []);

  const fetchCreditsData = async () => {
    try {
      setLoading(true);
      
      // Fetch credit balance
      const balanceRes = await apiFetch("/credits/balance");
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setCreditBalance(data.balance || 0);
      }

      // Fetch transaction history
      const transactionsRes = await apiFetch("/credits/transactions");
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch credits data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPackageDetails = () => {
    if (selectedPackage === "custom") {
      const amount = parseFloat(customAmount) || 0;
      return { amount, price: amount };
    }
    return creditPackages.find(p => p.id === selectedPackage);
  };

  const handlePurchase = async () => {
    const packageDetails = getSelectedPackageDetails();
    if (!packageDetails || packageDetails.amount <= 0) {
      toast.error(t('credits.toasts.selectPackage'));
      return;
    }

    if (!selectedPayment) {
      toast.error(t('credits.toasts.selectPayment'));
      return;
    }

    // For BLIK, validate code
    if (selectedPayment === "blik" && blikCode.length !== 6) {
      toast.error(t('credits.toasts.invalidBlik'));
      return;
    }

    setIsProcessing(true);

    try {
      // Get user data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        toast.error('Please log in to purchase credits');
        navigate('/login');
        return;
      }

      // Create a credits purchase order
      const formData = new FormData();
      formData.append('order_type', 'credits_purchase');
      formData.append('description', `Store Credit: ${packageDetails.amount} PLN`);
      formData.append('price', packageDetails.amount.toString());
      formData.append('credits_amount', packageDetails.credits.toString());
      formData.append('paymentMethod', 'pending'); // Will be set after payment selection

      toast.info('Creating order...');

      const orderResponse = await apiFormData('/orders', formData);

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      
      // Redirect to PaymentPage with order ID
      toast.success('Redirecting to payment...');
      navigate(`/payment/${orderData.order.id}`);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(error instanceof Error ? error.message : t('credits.toasts.paymentFailed'));
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit": return <Plus className="w-4 h-4 text-green-500" />;
      case "debit": return <CreditCard className="w-4 h-4 text-red-500" />;
      case "refund": return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      <DashboardSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-slide-up">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('credits.backToDashboard')}
            </Button>
            <h1 className="text-4xl font-bold mb-3 gradient-text">{t('credits.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('credits.subtitle')}
            </p>
          </div>

          {/* Current Balance Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 shadow-xl animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-500/10 rounded-2xl">
                    <Wallet className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('credits.currentBalance')}</p>
                    <p className="text-4xl font-bold text-green-800 dark:text-green-300">{creditBalance.toFixed(2)} PLN</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 dark:text-green-400">{t('credits.autoCheckout')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Credit Packages */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    {t('credits.getCredits')}
                  </CardTitle>
                  <CardDescription>{t('credits.choosePackage')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Predefined Packages */}
                  <div className="grid grid-cols-2 gap-4">
                    {creditPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover-lift ${
                          selectedPackage === pkg.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                        onClick={() => {
                          setSelectedPackage(pkg.id);
                          setCustomAmount("");
                        }}
                      >
                        {pkg.popular && (
                          <Badge className="absolute -top-2 -right-2 bg-primary">
                            <Zap className="w-3 h-3 mr-1" /> {t('credits.popular')}
                          </Badge>
                        )}
                        {pkg.bestValue && (
                          <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500">
                            <Crown className="w-3 h-3 mr-1" /> {t('credits.bestValue')}
                          </Badge>
                        )}
                        <div className="text-center">
                          <p className="text-3xl font-bold gradient-text">{pkg.amount} PLN</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {t('credits.pay')} {pkg.price} PLN
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="customAmount">{t('credits.customAmountLabel')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customAmount"
                        type="number"
                        placeholder={t('credits.customAmountPlaceholder')}
                        min="10"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedPackage("custom");
                        }}
                        className="text-lg"
                      />
                      <span className="flex items-center px-4 bg-muted rounded-lg font-medium">PLN</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('credits.minimumAmount')}</p>
                  </div>

                  {/* Payment Methods */}
                  {(selectedPackage || customAmount) && (
                    <div className="space-y-4 pt-4 border-t animate-slide-up">
                      <Label>{t('credits.selectPaymentMethod')}</Label>
                      
                      {/* Saved Cards */}
                      {savedPaymentMethods.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">{t('credits.savedCards')}</p>
                          <div className="grid gap-2">
                            {savedPaymentMethods.map((method) => (
                              <div
                                key={method.id}
                                className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                                  selectedPayment === `saved_${method.id}`
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40"
                                }`}
                                onClick={() => setSelectedPayment(`saved_${method.id}`)}
                              >
                                <div className={`p-2 rounded-lg mr-3 ${selectedPayment === `saved_${method.id}` ? 'bg-primary text-white' : 'bg-muted'}`}>
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">•••• {method.last4}</p>
                                  <p className="text-xs text-muted-foreground">{method.expiryDate}</p>
                                </div>
                                {method.isDefault && (
                                  <Badge variant="outline" className="text-xs">{t('credits.default')}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-card px-2 text-muted-foreground">{t('credits.or')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Standard Payment Methods */}
                      <div className="grid grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              selectedPayment === method.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                            onClick={() => setSelectedPayment(method.id)}
                          >
                            <div className={`p-2 rounded-lg mb-2 ${selectedPayment === method.id ? 'bg-primary text-white' : 'bg-muted'}`}>
                              <method.icon className="w-5 h-5" />
                            </div>
                            <p className="font-medium text-sm">{method.name}</p>
                          </div>
                        ))}
                      </div>

                      {/* BLIK Code */}
                      {selectedPayment === "blik" && (
                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl animate-scale-in">
                          <Label className="text-pink-800 dark:text-pink-300">{t('credits.enterBlikCode')}</Label>
                          <Input
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            value={blikCode}
                            onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-2xl font-mono tracking-[0.5em] h-14 mt-2"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary & Purchase */}
            <div className="space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">{t('credits.purchaseSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getSelectedPackageDetails() ? (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('credits.creditsLabel')}</span>
                          <span className="font-medium">{getSelectedPackageDetails()!.amount} PLN</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{t('credits.payLabel')}</span>
                          <span className="text-2xl font-bold gradient-text">
                            {getSelectedPackageDetails()!.price.toFixed(2)} PLN
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handlePurchase}
                        disabled={!selectedPayment || isProcessing}
                        className="w-full h-12 text-lg mt-4"
                        size="lg"
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('credits.processing')}
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Wallet className="mr-2 h-5 w-5" />
                            {t('credits.getCredits')}
                          </span>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>{t('credits.selectPackagePrompt')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="shadow-lg border animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t('credits.recentTransactions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {transactions.slice(0, 10).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.type)}
                            <div>
                              <p className="text-sm font-medium">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <span className={`font-bold text-sm ${tx.type === "debit" ? "text-red-500" : "text-green-500"}`}>
                            {tx.type === "debit" ? "-" : "+"}{tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">{t('credits.noTransactions')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Credits;
