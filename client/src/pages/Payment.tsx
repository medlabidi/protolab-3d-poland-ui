import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CreditCard, Building2, Smartphone, Shield, Lock, CheckCircle2, FileText } from "lucide-react";
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
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [blikCode, setBlikCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  useEffect(() => {
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

  const paymentMethods = [
    {
      id: "blik",
      name: "BLIK",
      icon: Smartphone,
      description: t('payment.methods.blikDesc'),
      popular: true,
    },
    {
      id: "card",
      name: t('payment.methods.card'),
      icon: CreditCard,
      description: t('payment.methods.cardDesc'),
      popular: false,
    },
    {
      id: "transfer",
      name: t('payment.methods.transfer'),
      icon: Building2,
      description: t('payment.methods.transferDesc'),
      popular: false,
    },
  ];

  const handlePayment = async () => {
    if (!selectedPayment) {
      toast.error(t('payment.toasts.selectPayment'));
      return;
    }

    // Handle saved card payment
    if (selectedPayment.startsWith("saved_")) {
      // Saved card - no additional validation needed
    } else if (selectedPayment === "blik" && blikCode.length !== 6) {
      toast.error(t('payment.toasts.invalidBlik'));
      return;
    }

    if (selectedPayment === "card") {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        toast.error(t('payment.toasts.fillCardDetails'));
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

          // Generate and send invoice if requested for project upgrade
          if (generateInvoice && billingInfo && billingInfo.companyName) {
            try {
              const invoiceResponse = await apiFetch('/orders/email/invoice', {
                method: 'POST',
                body: JSON.stringify({
                  projectName: upgradeData.projectName,
                  items: [{
                    description: `Project Upgrade - ${upgradeData.projectName}`,
                    quantity: 1,
                    unitPrice: upgradeData.amount,
                    total: upgradeData.amount,
                  }],
                  subtotal: upgradeData.amount,
                  deliveryPrice: 0,
                  totalAmount: upgradeData.amount,
                  paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
                  billingInfo,
                }),
              });

              if (invoiceResponse.ok) {
                const invoiceData = await invoiceResponse.json();
                const existingHistory = localStorage.getItem('billingHistory');
                const history = existingHistory ? JSON.parse(existingHistory) : [];
                history.unshift({
                  id: invoiceData.invoiceNumber,
                  invoiceNumber: invoiceData.invoiceNumber,
                  date: new Date().toISOString(),
                  amount: upgradeData.amount,
                  description: `Project Upgrade: ${upgradeData.projectName}`,
                  status: 'paid',
                  type: 'invoice',
                });
                localStorage.setItem('billingHistory', JSON.stringify(history));
                toast.success(t('payment.toasts.invoiceGenerated'));
              }
            } catch (invoiceError) {
              console.error('Failed to generate invoice:', invoiceError);
            }
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
            toast.success(`${t('payment.toasts.paymentOf')} ${upgradeData.amount.toFixed(2)} PLN ${t('payment.toasts.successProjectUpdated')}`);
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

          // Generate and send invoice if requested for single order upgrade
          if (generateInvoice && billingInfo && billingInfo.companyName) {
            try {
              const invoiceResponse = await apiFetch('/orders/email/invoice', {
                method: 'POST',
                body: JSON.stringify({
                  orderNumber: upgradeData.orderNumber,
                  items: [{
                    description: `Order Upgrade #${upgradeData.orderNumber}`,
                    quantity: 1,
                    unitPrice: upgradeData.amount,
                    total: upgradeData.amount,
                  }],
                  subtotal: upgradeData.amount,
                  deliveryPrice: 0,
                  totalAmount: upgradeData.amount,
                  paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
                  billingInfo,
                }),
              });

              if (invoiceResponse.ok) {
                const invoiceData = await invoiceResponse.json();
                const existingHistory = localStorage.getItem('billingHistory');
                const history = existingHistory ? JSON.parse(existingHistory) : [];
                history.unshift({
                  id: invoiceData.invoiceNumber,
                  invoiceNumber: invoiceData.invoiceNumber,
                  date: new Date().toISOString(),
                  amount: upgradeData.amount,
                  description: `Order Upgrade #${upgradeData.orderNumber}`,
                  status: 'paid',
                  type: 'invoice',
                });
                localStorage.setItem('billingHistory', JSON.stringify(history));
                toast.success(t('payment.toasts.invoiceGenerated'));
              }
            } catch (invoiceError) {
              console.error('Failed to generate invoice:', invoiceError);
            }
          }

          // Add notification for order update
          addNotification({
            type: "order_update",
            title: "Order Updated",
            message: `Your order #${upgradeData.orderNumber} has been updated with new specifications.`,
            orderId: upgradeData.orderId,
          });

          toast.success(`${t('payment.toasts.paymentOf')} ${upgradeData.amount.toFixed(2)} PLN ${t('payment.toasts.successOrderUpdated')}`);
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

          // Generate and send invoice if requested
          if (generateInvoice && billingInfo && billingInfo.companyName) {
            try {
              const invoiceItems = orderData.files.map(file => ({
                description: `3D Print - ${file.file.name}`,
                quantity: file.quantity,
                unitPrice: file.estimatedPrice / file.quantity,
                total: file.estimatedPrice,
              }));

              const invoiceResponse = await apiFetch('/orders/email/invoice', {
                method: 'POST',
                body: JSON.stringify({
                  projectName: orderData.projectName,
                  items: invoiceItems,
                  subtotal: orderData.projectTotal,
                  deliveryPrice: orderData.deliveryPrice,
                  totalAmount: orderData.totalAmount,
                  paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
                  billingInfo,
                }),
              });

              if (invoiceResponse.ok) {
                const invoiceData = await invoiceResponse.json();
                // Save invoice to billing history
                const existingHistory = localStorage.getItem('billingHistory');
                const history = existingHistory ? JSON.parse(existingHistory) : [];
                history.unshift({
                  id: invoiceData.invoiceNumber,
                  invoiceNumber: invoiceData.invoiceNumber,
                  date: new Date().toISOString(),
                  amount: orderData.totalAmount,
                  description: `Project: ${orderData.projectName} (${orderData.files.length} files)`,
                  status: 'paid',
                  type: 'invoice',
                });
                localStorage.setItem('billingHistory', JSON.stringify(history));
                toast.success(t('payment.toasts.invoiceGenerated'));
              }
            } catch (invoiceError) {
              console.error('Failed to generate invoice:', invoiceError);
              // Don't fail the payment if invoice generation fails
            }
          }

          // Add notification for project order
          addNotification({
            type: "order_created",
            title: "Project Submitted",
            message: `Your project "${orderData.projectName}" with ${orderData.files.length} file(s) has been submitted successfully.`,
          });

          toast.success(`${t('payment.toasts.paymentSuccessful')} ${orderData.files.length} ${t('payment.toasts.ordersPlaced')}`);
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

          // Generate and send invoice if requested
          if (generateInvoice && billingInfo && billingInfo.companyName) {
            try {
              const invoiceResponse = await apiFetch('/orders/email/invoice', {
                method: 'POST',
                body: JSON.stringify({
                  orderNumber: `ORD-${Date.now()}`,
                  items: [{
                    description: `3D Print - ${orderData.file.name}`,
                    quantity: orderData.quantity,
                    unitPrice: orderData.priceBreakdown?.totalPrice / orderData.quantity || orderData.totalAmount / orderData.quantity,
                    total: orderData.priceBreakdown?.totalPrice || (orderData.totalAmount - orderData.deliveryPrice),
                  }],
                  subtotal: orderData.priceBreakdown?.totalPrice || (orderData.totalAmount - orderData.deliveryPrice),
                  deliveryPrice: orderData.deliveryPrice,
                  totalAmount: orderData.totalAmount,
                  paymentMethod: selectedPayment === 'blik' ? 'BLIK' : selectedPayment === 'card' ? 'Card' : 'Bank Transfer',
                  billingInfo,
                }),
              });

              if (invoiceResponse.ok) {
                const invoiceData = await invoiceResponse.json();
                // Save invoice to billing history
                const existingHistory = localStorage.getItem('billingHistory');
                const history = existingHistory ? JSON.parse(existingHistory) : [];
                history.unshift({
                  id: invoiceData.invoiceNumber,
                  invoiceNumber: invoiceData.invoiceNumber,
                  date: new Date().toISOString(),
                  amount: orderData.totalAmount,
                  description: `3D Print - ${orderData.file.name}`,
                  status: 'paid',
                  type: 'invoice',
                });
                localStorage.setItem('billingHistory', JSON.stringify(history));
                toast.success(t('payment.toasts.invoiceGenerated'));
              }
            } catch (invoiceError) {
              console.error('Failed to generate invoice:', invoiceError);
              // Don't fail the payment if invoice generation fails
            }
          }

          // Add notification for single order
          addNotification({
            type: "order_created",
            title: "Order Submitted",
            message: `Your print order for "${orderData.file.name}" has been submitted successfully.`,
          });

          toast.success(t('payment.toasts.paymentSuccess'));
          navigate('/orders');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : t('payment.toasts.paymentFailed'));
    } finally {
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
            {/* Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl border-2 border-primary/10 animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    {t('payment.paymentMethod')}
                  </CardTitle>
                  <CardDescription>{t('payment.choosePayment')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Saved Payment Methods */}
                  {savedPaymentMethods.length > 0 && (
                    <>
                      <div className="mb-2">
                        <p className="text-sm font-medium text-muted-foreground mb-3">{t('payment.savedCards')}</p>
                        {savedPaymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover-lift mb-2 ${
                              selectedPayment === `saved_${method.id}`
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                            onClick={() => setSelectedPayment(`saved_${method.id}`)}
                          >
                            <input
                              type="radio"
                              name="payment"
                              checked={selectedPayment === `saved_${method.id}`}
                              onChange={() => setSelectedPayment(`saved_${method.id}`)}
                              className="w-5 h-5"
                            />
                            <div className={`p-3 rounded-lg ${selectedPayment === `saved_${method.id}` ? 'bg-primary text-white' : 'bg-muted'}`}>
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-lg">•••• •••• •••• {method.last4}</p>
                                {method.isDefault && (
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {t('payment.default')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {method.name} • {t('payment.expires')} {method.expiryDate}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="relative py-3">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">{t('payment.orPayWith')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Standard Payment Methods */}
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
                              {t('payment.popular')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  ))}

                  {/* BLIK Code Input */}
                  {selectedPayment === "blik" && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl animate-scale-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Smartphone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        <p className="font-bold text-pink-800 dark:text-pink-300">{t('payment.enterBlikCode')}</p>
                      </div>
                      <p className="text-sm text-pink-700 dark:text-pink-400 mb-4">
                        {t('payment.blikInstructions')}
                      </p>
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={blikCode}
                        onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-3xl font-mono tracking-[0.5em] h-16 border-2 border-pink-300 dark:border-pink-700 focus:border-pink-500"
                      />
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-2 text-center">
                        {t('payment.codeExpires')}
                      </p>
                    </div>
                  )}

                  {/* Card Details Input */}
                  {selectedPayment === "card" && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl animate-scale-in space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <p className="font-bold text-blue-800 dark:text-blue-300">{t('payment.cardDetails')}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardName">{t('payment.cardholderName')}</Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">{t('payment.cardNumber')}</Label>
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
                          <Label htmlFor="expiry">{t('payment.expiryDate')}</Label>
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
                    <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl animate-scale-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <p className="font-bold text-green-800 dark:text-green-300">{t('payment.bankTransfer')}</p>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {t('payment.bankTransferDesc')}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['PKO BP', 'mBank', 'ING', 'Santander', 'Pekao', 'Alior'].map((bank) => (
                          <span key={bank} className="px-3 py-1 bg-card border border-green-200 dark:border-green-800 rounded-full text-xs font-medium text-green-700 dark:text-green-400">
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
                    {t('payment.securePayment')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('payment.encryptedSecure')}
                  </p>
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
                        {t('payment.processing')}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {t('payment.pay')} {displayAmount.toFixed(2)} PLN
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
