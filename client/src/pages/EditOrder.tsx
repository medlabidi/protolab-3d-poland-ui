import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { ArrowLeft, Save, Loader2, X, Calculator, RefreshCw, AlertTriangle, Ban } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  material: string;
  color: string;
  layer_height: string;
  infill: string;
  quantity: number;
  file_name: string;
  file_url: string;
  shipping_method: string;
  shipping_address?: string;
  price: number;
}

// Price calculation constants (same as NewPrint.tsx)
const BASE_PRICE = 15; // Base price in PLN
const MATERIAL_MULTIPLIERS: Record<string, number> = {
  'PLA': 1.0,
  'pla': 1.0,
  'PETG': 1.2,
  'petg': 1.2,
  'ABS': 1.3,
  'abs': 1.3,
  'TPU': 1.5,
  'tpu': 1.5,
  'Nylon': 1.8,
  'nylon': 1.8,
  'resin': 2.0,
  'Resin': 2.0,
};

const QUALITY_MULTIPLIERS: Record<string, number> = {
  '0.1': 1.5,
  '0.1mm': 1.5,
  '0.15': 1.3,
  '0.15mm': 1.3,
  '0.2': 1.0,
  '0.2mm': 1.0,
  '0.3': 0.8,
  '0.3mm': 0.8,
};

const INFILL_MULTIPLIERS: Record<string, number> = {
  '10': 0.7,
  '10%': 0.7,
  '20': 0.85,
  '20%': 0.85,
  '50': 1.0,
  '50%': 1.0,
  '75': 1.2,
  '75%': 1.2,
  '100': 1.5,
  '100%': 1.5,
};

const SHIPPING_COSTS: Record<string, number> = {
  'pickup': 0,
  'inpost': 12.99,
  'courier': 24.99,
  'standard': 12.99,
  'express': 24.99,
};

const materials = [
  { value: "pla", label: "PLA" },
  { value: "abs", label: "ABS" },
  { value: "petg", label: "PETG" },
  { value: "tpu", label: "TPU" },
  { value: "nylon", label: "Nylon" },
  { value: "resin", label: "Resin" },
];

const colors = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "gray", label: "Gray" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
];

const qualities = [
  { value: "0.3", label: "Draft (0.3mm)", description: "Fastest, lower detail" },
  { value: "0.2", label: "Standard (0.2mm)", description: "Balanced quality" },
  { value: "0.15", label: "High (0.15mm)", description: "High detail" },
  { value: "0.1", label: "Ultra (0.1mm)", description: "Maximum detail" },
];

const infillOptions = [
  { value: "10", label: "10% - Light" },
  { value: "20", label: "20% - Standard" },
  { value: "50", label: "50% - Strong" },
  { value: "100", label: "100% - Solid" },
];

const shippingMethods = [
  { value: "pickup", label: "Local Pickup (Free)" },
  { value: "inpost", label: "InPost Locker (12.99 PLN)" },
  { value: "courier", label: "Courier Delivery (24.99 PLN)" },
];

const EditOrder = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [layerHeight, setLayerHeight] = useState("");
  const [infill, setInfill] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shippingMethod, setShippingMethod] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Price state
  const [newPrice, setNewPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);

  // Status-based restrictions
  const canEditPrintParams = order?.status === 'submitted' || order?.status === 'in_queue';
  const canEditShipping = order?.status !== 'finished' && order?.status !== 'delivered';
  const cannotEdit = order?.status === 'finished' || order?.status === 'delivered';

  // Track if initial load is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    // Only recalculate price after initial load is complete and when parameters change
    if (order && initialLoadComplete) {
      calculateNewPrice();
    }
  }, [material, layerHeight, infill, quantity, shippingMethod, initialLoadComplete]);

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.tokens.accessToken;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    return null;
  };

  const fetchOrder = async (retry = true) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchOrder(false);
        }
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      const fetchedOrder = data.order;
      setOrder(fetchedOrder);
      setOriginalPrice(fetchedOrder.price || 0);
      
      // Initialize form state with order data
      // Handle both string and number types for layer_height and infill
      setMaterial(fetchedOrder.material || "pla");
      setColor(fetchedOrder.color || "");
      const lh = fetchedOrder.layer_height;
      setLayerHeight(typeof lh === 'string' ? lh.replace('mm', '') : String(lh || 0.2));
      const inf = fetchedOrder.infill;
      setInfill(typeof inf === 'string' ? inf.replace('%', '') : String(inf || 20));
      setQuantity(fetchedOrder.quantity || 1);
      setShippingMethod(fetchedOrder.shipping_method || "pickup");
      setShippingAddress(fetchedOrder.shipping_address || "");
      setNewPrice(fetchedOrder.price || 0);
      
      // Mark initial load as complete - this will allow price recalculation on future changes
      setTimeout(() => setInitialLoadComplete(true), 100);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewPrice = () => {
    const materialMultiplier = MATERIAL_MULTIPLIERS[material] || 1;
    const qualityMultiplier = QUALITY_MULTIPLIERS[layerHeight] || 1;
    const infillMultiplier = INFILL_MULTIPLIERS[infill] || 1;
    const shippingCost = SHIPPING_COSTS[shippingMethod] || 0;
    
    // Calculate base print cost
    const printCost = BASE_PRICE * materialMultiplier * qualityMultiplier * infillMultiplier * quantity;
    
    // Add energy cost (5% of print cost)
    const energyCost = printCost * 0.05;
    
    // Add labor cost (10% of print cost)
    const laborCost = printCost * 0.10;
    
    // Add depreciation (3% of print cost)
    const depreciation = printCost * 0.03;
    
    // Subtotal before VAT
    const subtotal = printCost + energyCost + laborCost + depreciation + shippingCost;
    
    // Add VAT (23%)
    const vat = subtotal * 0.23;
    
    // Total price
    const total = Math.round((subtotal + vat) * 100) / 100;
    
    setNewPrice(total);
  };

  const priceDifference = newPrice - originalPrice;

  const handleSave = async () => {
    if (!order) return;

    // If price increased, redirect to payment
    if (priceDifference > 0.01) {
      // Store the update data in session storage for payment page
      sessionStorage.setItem('pendingOrderUpdate', JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        updates: {
          material: canEditPrintParams ? material : order.material,
          color: canEditPrintParams ? color : order.color,
          layer_height: canEditPrintParams ? layerHeight : order.layer_height,
          infill: canEditPrintParams ? infill : order.infill,
          quantity: canEditPrintParams ? quantity : order.quantity,
          shipping_method: canEditShipping ? shippingMethod : order.shipping_method,
          shipping_address: canEditShipping ? shippingAddress : order.shipping_address,
          price: newPrice,
        },
        originalPrice,
        newPrice,
        priceDifference,
      }));
      
      navigate('/payment', {
        state: {
          orderId: order.id,
          amount: priceDifference,
          isUpgrade: true,
          orderNumber: order.order_number,
          totalAmount: newPrice,
          previousPrice: originalPrice,
        }
      });
      return;
    }
    
    // If price decreased, redirect to refund page
    if (priceDifference < -0.01) {
      // Store pending updates in session storage (will be applied on refund confirmation)
      sessionStorage.setItem('pendingOrderUpdate', JSON.stringify({
        orderId: order.id,
        updates: {
          material: canEditPrintParams ? material : order.material,
          color: canEditPrintParams ? color : order.color,
          layer_height: canEditPrintParams ? layerHeight : order.layer_height,
          infill: canEditPrintParams ? infill : order.infill,
          quantity: canEditPrintParams ? quantity : order.quantity,
          shipping_method: canEditShipping ? shippingMethod : order.shipping_method,
          shipping_address: canEditShipping ? shippingAddress : order.shipping_address,
          price: newPrice,
        },
        originalPrice,
        newPrice,
        priceDifference,
      }));
      
      navigate('/refund', {
        state: {
          orderId: order.id,
          orderNumber: order.order_number,
          originalPrice,
          newPrice,
          refundAmount: Math.abs(priceDifference),
          reason: 'price_reduction',
        }
      });
      return;
    }

    // If price is the same, just save the updates
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      const updateData: Record<string, unknown> = {};
      
      if (canEditPrintParams) {
        updateData.material = material;
        updateData.color = color;
        updateData.layer_height = layerHeight;
        updateData.infill = infill;
        updateData.quantity = quantity;
        updateData.price = newPrice;
      }
      
      if (canEditShipping) {
        updateData.shipping_method = shippingMethod;
        updateData.shipping_address = shippingAddress;
      }
      
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success(t('editOrder.toasts.updateSuccess'));
      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err instanceof Error ? err.message : t('editOrder.toasts.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    
    navigate('/refund', {
      state: {
        orderId: order.id,
        orderNumber: order.order_number,
        originalPrice: order.price,
        newPrice: 0,
        refundAmount: order.price,
        reason: 'cancellation',
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('editOrder.loading')}</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto text-center py-12">
            <p className="text-destructive text-lg">{error || t('editOrder.notFound')}</p>
            <Button onClick={() => navigate("/orders")} variant="outline" className="mt-4">
              {t('editOrder.backToOrders')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (cannotEdit) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ban className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{t('editOrder.cannotEditTitle')}</h2>
                  <p className="text-muted-foreground mb-6">
                    {t('editOrder.cannotEditStatus')} "{order.status}".
                  </p>
                  <Button onClick={() => navigate(`/orders/${orderId}`)}>
                    {t('editOrder.viewOrderDetails')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 animate-slide-up">
            <Button variant="outline" size="icon" onClick={() => navigate(`/orders/${orderId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">{t('editOrder.title')} #{order.order_number || order.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">{t('editOrder.placedOn')} {formatDate(order.created_at)}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Status Warning for Printing */}
          {order.status === 'printing' && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">{t('editOrder.limitedEditingTitle')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('editOrder.limitedEditingDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* File Preview */}
              <Card className="shadow-lg animate-scale-in">
                <CardHeader>
                  <CardTitle>{t('editOrder.modelPreview')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelViewerUrl 
                    url={order.file_url} 
                    fileName={order.file_name}
                    height="300px"
                  />
                  <p className="text-sm text-muted-foreground mt-4">
                    {t('editOrder.file')}: {order.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('editOrder.fileNote')}
                  </p>
                </CardContent>
              </Card>

              {/* Shipping Details */}
              <Card className="shadow-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle>{t('editOrder.shippingDetails')}</CardTitle>
                  <CardDescription>{t('editOrder.shippingDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('editOrder.shippingMethod')}</Label>
                    <Select value={shippingMethod} onValueChange={setShippingMethod} disabled={!canEditShipping}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('editOrder.selectShippingMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">{t('editOrder.shipping.pickup')}</SelectItem>
                        <SelectItem value="inpost">{t('editOrder.shipping.inpost')}</SelectItem>
                        <SelectItem value="courier">{t('editOrder.shipping.courier')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {shippingMethod && shippingMethod !== 'pickup' && (
                    <div className="space-y-2">
                      <Label>{t('editOrder.shippingAddress')}</Label>
                      <Textarea
                        placeholder={t('editOrder.enterShippingAddress')}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        disabled={!canEditShipping}
                        rows={3}
                      />
                    </div>
                  )}

                  {shippingMethod === 'pickup' && (
                    <p className="text-sm text-muted-foreground">
                      {t('editOrder.pickupAddress')}: Zielonogórska 13, 30-406 Kraków
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Print Parameters */}
              <Card className="shadow-lg animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle>{t('editOrder.printParameters')}</CardTitle>
                  <CardDescription>
                    {canEditPrintParams 
                      ? t('editOrder.printParamsDescription') 
                      : t('editOrder.printParamsLocked')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('editOrder.material')}</Label>
                      <Select value={material} onValueChange={setMaterial} disabled={!canEditPrintParams}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('editOrder.selectMaterial')} />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((mat) => (
                            <SelectItem key={mat.value} value={mat.value}>
                              {mat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('editOrder.color')}</Label>
                      <Select value={color} onValueChange={setColor} disabled={!canEditPrintParams}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('editOrder.selectColor')} />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {t(`editOrder.colors.${c.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('editOrder.printQuality')}</Label>
                      <Select value={layerHeight} onValueChange={setLayerHeight} disabled={!canEditPrintParams}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('editOrder.selectQuality')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.3">{t('editOrder.qualities.draft')}</SelectItem>
                          <SelectItem value="0.2">{t('editOrder.qualities.standard')}</SelectItem>
                          <SelectItem value="0.15">{t('editOrder.qualities.high')}</SelectItem>
                          <SelectItem value="0.1">{t('editOrder.qualities.ultra')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('editOrder.infillDensity')}</Label>
                      <Select value={infill} onValueChange={setInfill} disabled={!canEditPrintParams}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('editOrder.selectInfill')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">{t('editOrder.infill.light')}</SelectItem>
                          <SelectItem value="20">{t('editOrder.infill.standard')}</SelectItem>
                          <SelectItem value="50">{t('editOrder.infill.strong')}</SelectItem>
                          <SelectItem value="100">{t('editOrder.infill.solid')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('editOrder.quantity')}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      disabled={!canEditPrintParams}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Cancel Order */}
              {canEditPrintParams && (
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">{t('editOrder.cancelOrder')}</CardTitle>
                    <CardDescription>
                      {t('editOrder.cancelDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelOrder}
                    >
                      {t('editOrder.cancelAndRefund')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Price Summary - Bottom of page */}
          <Card className="shadow-xl border-2 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('editOrder.priceSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 items-center">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t('editOrder.originalPrice')}</p>
                  <p className="text-2xl font-bold">{originalPrice.toFixed(2)} PLN</p>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t('editOrder.newPrice')}</p>
                  <p className="text-2xl font-bold">{newPrice.toFixed(2)} PLN</p>
                </div>
                
                <div className={`text-center p-4 rounded-lg ${
                  priceDifference > 0.01 
                    ? 'bg-blue-500/10 border border-blue-500/30' 
                    : priceDifference < -0.01 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-muted/50'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {priceDifference > 0.01 ? t('editOrder.extraPayment') : priceDifference < -0.01 ? t('editOrder.refundAmount') : t('editOrder.difference')}
                  </p>
                  <p className={`text-2xl font-bold ${
                    priceDifference > 0.01 
                      ? 'text-blue-600' 
                      : priceDifference < -0.01 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                  }`}>
                    {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(2)} PLN
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSave} 
                    className="w-full hover-lift"
                    size="lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('editOrder.processing')}
                      </>
                    ) : priceDifference > 0.01 ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('editOrder.proceedToExtraPayment')}
                      </>
                    ) : priceDifference < -0.01 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('editOrder.proceedToRefund')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('editOrder.saveChanges')}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/orders/${orderId}`)}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('editOrder.cancel')}
                  </Button>
                </div>
              </div>

              {priceDifference > 0.01 && (
                <div className="mt-4 bg-blue-500/10 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                  <strong>{t('editOrder.note')}:</strong> {t('editOrder.extraPaymentNote')} <strong>{priceDifference.toFixed(2)} PLN</strong>. 
                  {t('editOrder.redirectToPayment')}
                </div>
              )}

              {priceDifference < -0.01 && (
                <div className="mt-4 bg-green-500/10 p-4 rounded-lg text-sm text-green-700 dark:text-green-400">
                  <strong>{t('editOrder.goodNews')}</strong> {t('editOrder.refundNote')} <strong>{Math.abs(priceDifference).toFixed(2)} PLN</strong>. 
                  {t('editOrder.redirectToRefund')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditOrder;
