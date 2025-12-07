import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { ArrowLeft, Save, Loader2, Calculator, RefreshCw, AlertTriangle, Ban, FolderOpen, FileText, ChevronRight, Truck, Settings2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  order_number?: string;
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
  project_name?: string;
}

interface PartEdit {
  orderId: string;
  material: string;
  color: string;
  layerHeight: string;
  infill: string;
  quantity: number;
  originalPrice: number;
  newPrice: number;
}

// Price calculation constants (same as EditOrder.tsx)
const BASE_PRICE = 15;
const MATERIAL_MULTIPLIERS: Record<string, number> = {
  'PLA': 1.0, 'pla': 1.0,
  'PETG': 1.2, 'petg': 1.2,
  'ABS': 1.3, 'abs': 1.3,
  'TPU': 1.5, 'tpu': 1.5,
  'Nylon': 1.8, 'nylon': 1.8,
  'resin': 2.0, 'Resin': 2.0,
};

const QUALITY_MULTIPLIERS: Record<string, number> = {
  '0.1': 1.5, '0.1mm': 1.5,
  '0.15': 1.3, '0.15mm': 1.3,
  '0.2': 1.0, '0.2mm': 1.0,
  '0.3': 0.8, '0.3mm': 0.8,
};

const INFILL_MULTIPLIERS: Record<string, number> = {
  '10': 0.7, '10%': 0.7,
  '20': 0.85, '20%': 0.85,
  '50': 1.0, '50%': 1.0,
  '75': 1.2, '75%': 1.2,
  '100': 1.5, '100%': 1.5,
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

const colorValues = ["white", "black", "gray", "red", "blue", "green", "yellow", "orange", "purple", "pink"];

const qualityValues = [
  { value: "0.3", labelKey: "draft" },
  { value: "0.2", labelKey: "standard" },
  { value: "0.15", labelKey: "high" },
  { value: "0.1", labelKey: "ultra" },
];

const infillValues = ["10", "20", "50", "100"];

const shippingValues = ["pickup", "inpost", "courier"];

const EditProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectName } = useParams<{ projectName: string }>();
  const decodedProjectName = decodeURIComponent(projectName || '');
  const { t } = useLanguage();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Part edits state - stores changes for each order
  const [partEdits, setPartEdits] = useState<Record<string, PartEdit>>({});
  
  // Shared shipping state (for all orders in project)
  const [shippingMethod, setShippingMethod] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [originalShippingCost, setOriginalShippingCost] = useState(0);

  // Track initialization
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Active tab for accordion
  const [activeTab, setActiveTab] = useState("parts");

  useEffect(() => {
    fetchProjectOrders();
  }, [projectName]);

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

  const fetchProjectOrders = async (retry = true) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Fetch all user orders
      const response = await fetch(`${API_URL}/orders/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) return fetchProjectOrders(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      const allOrders = data.orders || [];
      
      // Filter orders belonging to this project
      const projectOrders = allOrders.filter(
        (o: Order) => o.project_name === decodedProjectName
      );

      if (projectOrders.length === 0) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      setOrders(projectOrders);
      
      // Initialize part edits for each order
      const initialEdits: Record<string, PartEdit> = {};
      projectOrders.forEach((order: Order) => {
        const lh = order.layer_height;
        const inf = order.infill;
        initialEdits[order.id] = {
          orderId: order.id,
          material: order.material || 'pla',
          color: order.color || 'white',
          layerHeight: typeof lh === 'string' ? lh.replace('mm', '') : String(lh || 0.2),
          infill: typeof inf === 'string' ? inf.replace('%', '') : String(inf || 20),
          quantity: order.quantity || 1,
          originalPrice: order.price || 0,
          newPrice: order.price || 0,
        };
      });
      setPartEdits(initialEdits);

      // Initialize shipping from first order
      const firstOrder = projectOrders[0];
      setShippingMethod(firstOrder.shipping_method || 'pickup');
      setShippingAddress(firstOrder.shipping_address || '');
      setOriginalShippingCost(SHIPPING_COSTS[firstOrder.shipping_method] || 0);

      setTimeout(() => setInitialLoadComplete(true), 100);
    } catch (err) {
      console.error('Error fetching project orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Calculate price for a single part
  const calculatePartPrice = (edit: PartEdit): number => {
    const materialMultiplier = MATERIAL_MULTIPLIERS[edit.material] || 1;
    const qualityMultiplier = QUALITY_MULTIPLIERS[edit.layerHeight] || 1;
    const infillMultiplier = INFILL_MULTIPLIERS[edit.infill] || 1;
    
    const printCost = BASE_PRICE * materialMultiplier * qualityMultiplier * infillMultiplier * edit.quantity;
    const energyCost = printCost * 0.05;
    const laborCost = printCost * 0.10;
    const depreciation = printCost * 0.03;
    const subtotal = printCost + energyCost + laborCost + depreciation;
    const vat = subtotal * 0.23;
    
    return Math.round((subtotal + vat) * 100) / 100;
  };

  // Update a part's parameters
  const updatePartEdit = (orderId: string, field: keyof PartEdit, value: string | number) => {
    setPartEdits(prev => {
      const updated = {
        ...prev,
        [orderId]: {
          ...prev[orderId],
          [field]: value,
        }
      };
      // Recalculate price for this part
      updated[orderId].newPrice = calculatePartPrice(updated[orderId]);
      return updated;
    });
  };

  // Get project status
  const getProjectStatus = (): OrderStatus => {
    const statuses = orders.map(o => o.status);
    if (statuses.every(s => s === 'delivered')) return 'delivered';
    if (statuses.every(s => s === 'finished' || s === 'delivered')) return 'finished';
    if (statuses.some(s => s === 'printing')) return 'printing';
    if (statuses.some(s => s === 'in_queue')) return 'in_queue';
    return 'submitted';
  };

  // Check if print params can be edited
  const canEditPrintParams = (status: OrderStatus) => 
    status === 'submitted' || status === 'in_queue';
  
  const canEditShipping = () => {
    const status = getProjectStatus();
    return status !== 'finished' && status !== 'delivered';
  };

  const cannotEdit = () => {
    const status = getProjectStatus();
    return status === 'finished' || status === 'delivered';
  };

  // Calculate totals
  const originalTotal = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const newPartsTotal = Object.values(partEdits).reduce((sum, edit) => sum + edit.newPrice, 0);
  const newShippingCost = SHIPPING_COSTS[shippingMethod] || 0;
  const newTotal = newPartsTotal + newShippingCost;
  const totalDifference = newTotal - originalTotal;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSave = async () => {
    // If price increased, redirect to payment
    if (totalDifference > 0.01) {
      const updates = orders.map(order => ({
        orderId: order.id,
        updates: {
          material: partEdits[order.id]?.material || order.material,
          color: partEdits[order.id]?.color || order.color,
          layer_height: partEdits[order.id]?.layerHeight || order.layer_height,
          infill: partEdits[order.id]?.infill || order.infill,
          quantity: partEdits[order.id]?.quantity || order.quantity,
          shipping_method: shippingMethod,
          shipping_address: shippingAddress,
          price: partEdits[order.id]?.newPrice || order.price,
        },
        originalPrice: order.price,
        newPrice: partEdits[order.id]?.newPrice || order.price,
      }));

      sessionStorage.setItem('pendingProjectUpdate', JSON.stringify({
        projectName: decodedProjectName,
        updates,
        originalTotal,
        newTotal,
        totalDifference,
      }));
      
      navigate('/payment', {
        state: {
          projectName: decodedProjectName,
          amount: totalDifference,
          isUpgrade: true,
          isProject: true,
          totalAmount: newTotal,
          previousPrice: originalTotal,
          orderCount: orders.length,
        }
      });
      return;
    }
    
    // If price decreased, redirect to refund
    if (totalDifference < -0.01) {
      const updates = orders.map(order => ({
        orderId: order.id,
        updates: {
          material: partEdits[order.id]?.material || order.material,
          color: partEdits[order.id]?.color || order.color,
          layer_height: partEdits[order.id]?.layerHeight || order.layer_height,
          infill: partEdits[order.id]?.infill || order.infill,
          quantity: partEdits[order.id]?.quantity || order.quantity,
          shipping_method: shippingMethod,
          shipping_address: shippingAddress,
          price: partEdits[order.id]?.newPrice || order.price,
        },
        originalPrice: order.price,
        newPrice: partEdits[order.id]?.newPrice || order.price,
      }));

      sessionStorage.setItem('pendingProjectUpdate', JSON.stringify({
        projectName: decodedProjectName,
        updates,
        originalTotal,
        newTotal,
        totalDifference,
      }));
      
      navigate('/refund', {
        state: {
          projectName: decodedProjectName,
          isProject: true,
          originalPrice: originalTotal,
          newPrice: newTotal,
          refundAmount: Math.abs(totalDifference),
          reason: 'price_reduction',
          orderCount: orders.length,
        }
      });
      return;
    }

    // If price is the same, just save the updates
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      let successCount = 0;
      let failCount = 0;

      for (const order of orders) {
        const edit = partEdits[order.id];
        const updateData: Record<string, unknown> = {};
        
        if (canEditPrintParams(order.status)) {
          updateData.material = edit.material;
          updateData.color = edit.color;
          updateData.layer_height = edit.layerHeight;
          updateData.infill = edit.infill;
          updateData.quantity = edit.quantity;
          updateData.price = edit.newPrice;
        }
        
        if (canEditShipping()) {
          updateData.shipping_method = shippingMethod;
          updateData.shipping_address = shippingAddress;
        }

        const response = await fetch(`${API_URL}/orders/${order.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (failCount > 0 && successCount === 0) {
        toast.error(t('editProject.toasts.updateFailed'));
      } else if (failCount > 0) {
        toast.warning(`${t('editProject.toasts.partialUpdate')}: ${successCount} ${t('editProject.toasts.succeeded')}, ${failCount} ${t('editProject.toasts.failed')}`);
      } else {
        toast.success(t('editProject.toasts.updateSuccess'));
      }
      
      navigate('/orders');
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error(err instanceof Error ? err.message : t('editProject.toasts.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('editProject.loading')}</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto text-center py-12">
            <p className="text-destructive text-lg">{error || t('editProject.projectNotFound')}</p>
            <Button onClick={() => navigate("/orders")} variant="outline" className="mt-4">
              {t('editProject.backToOrders')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (cannotEdit()) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ban className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{t('editProject.cannotEditTitle')}</h2>
                  <p className="text-muted-foreground mb-6">
                    {t('editProject.cannotEditDescription')}
                  </p>
                  <Button onClick={() => navigate('/orders')}>
                    {t('editProject.backToOrders')}
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
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      <DashboardSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 animate-slide-up">
            <Button variant="outline" size="icon" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">{t('editProject.title')}: {decodedProjectName}</h1>
                <p className="text-muted-foreground">{orders.length} {t('editProject.parts')} • {t('editProject.created')} {formatDate(orders[0]?.created_at)}</p>
              </div>
            </div>
            <div className="ml-auto">
              <StatusBadge status={getProjectStatus()} />
            </div>
          </div>

          {/* Warning for printing orders */}
          {orders.some(o => o.status === 'printing') && (
            <Card className="border-yellow-500/50 bg-yellow-500/5 animate-scale-in">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">{t('editProject.printingWarningTitle')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('editProject.printingWarningDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parts" className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                {t('editProject.tabs.parts')}
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                {t('editProject.tabs.shipping')}
              </TabsTrigger>
            </TabsList>

            {/* Parts Tab */}
            <TabsContent value="parts" className="space-y-4">
              <Accordion type="multiple" defaultValue={orders.map(o => o.id)} className="space-y-4">
                {orders.map((order, index) => {
                  const edit = partEdits[order.id];
                  const canEdit = canEditPrintParams(order.status);
                  const priceDiff = edit ? edit.newPrice - edit.originalPrice : 0;
                  
                  return (
                    <AccordionItem 
                      key={order.id} 
                      value={order.id}
                      className="border-2 rounded-xl overflow-hidden bg-card shadow-lg animate-scale-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-bold text-primary">{order.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.material?.toUpperCase()} • {order.color} • {t('editProject.qty')}: {edit?.quantity || order.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mr-4">
                            <StatusBadge status={order.status} />
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{t('editProject.price')}</p>
                              <p className={`font-bold ${priceDiff !== 0 ? (priceDiff > 0 ? 'text-blue-600' : 'text-green-600') : ''}`}>
                                {(edit?.newPrice ?? order.price ?? 0).toFixed(2)} PLN
                              </p>
                            </div>
                            {priceDiff !== 0 && (
                              <Badge variant={priceDiff > 0 ? "default" : "secondary"} className={priceDiff > 0 ? 'bg-blue-500' : 'bg-green-500'}>
                                {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="grid lg:grid-cols-2 gap-6 pt-4">
                          {/* 3D Preview */}
                          <div>
                            <ModelViewerUrl 
                              url={order.file_url} 
                              fileName={order.file_name}
                              height="200px"
                            />
                          </div>

                          {/* Parameters */}
                          <div className="space-y-4">
                            {!canEdit && (
                              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                {t('editProject.paramsLocked')} - {t('editProject.orderIs')} {order.status}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t('editProject.labels.material')}</Label>
                                <Select 
                                  value={edit?.material || order.material} 
                                  onValueChange={(v) => updatePartEdit(order.id, 'material', v)}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materials.map((mat) => (
                                      <SelectItem key={mat.value} value={mat.value}>{mat.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>{t('editProject.labels.color')}</Label>
                                <Select 
                                  value={edit?.color || order.color} 
                                  onValueChange={(v) => updatePartEdit(order.id, 'color', v)}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorValues.map((c) => (
                                      <SelectItem key={c} value={c}>{t(`editProject.colors.${c}`)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t('editProject.labels.quality')}</Label>
                                <Select 
                                  value={edit?.layerHeight || '0.2'} 
                                  onValueChange={(v) => updatePartEdit(order.id, 'layerHeight', v)}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {qualityValues.map((q) => (
                                      <SelectItem key={q.value} value={q.value}>{t(`editProject.qualities.${q.labelKey}`)} ({q.value}mm)</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>{t('editProject.labels.infill')}</Label>
                                <Select 
                                  value={edit?.infill || '20'} 
                                  onValueChange={(v) => updatePartEdit(order.id, 'infill', v)}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {infillValues.map((i) => (
                                      <SelectItem key={i} value={i}>{i}% - {t(`editProject.infill.${i}`)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>{t('editProject.labels.quantity')}</Label>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={edit?.quantity || order.quantity}
                                onChange={(e) => updatePartEdit(order.id, 'quantity', parseInt(e.target.value) || 1)}
                                disabled={!canEdit}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping">
              <Card className="shadow-lg animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    {t('editProject.shippingDetails.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('editProject.shippingDetails.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('editProject.shippingDetails.methodLabel')}</Label>
                    <Select 
                      value={shippingMethod} 
                      onValueChange={setShippingMethod}
                      disabled={!canEditShipping()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('editProject.shippingDetails.selectMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingValues.map((method) => (
                          <SelectItem key={method} value={method}>
                            {t(`editProject.shippingMethods.${method}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {shippingMethod && shippingMethod !== 'pickup' && (
                    <div className="space-y-2">
                      <Label>{t('editProject.shippingDetails.addressLabel')}</Label>
                      <Textarea
                        placeholder={t('editProject.shippingDetails.addressPlaceholder')}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        disabled={!canEditShipping()}
                        rows={3}
                      />
                    </div>
                  )}

                  {shippingMethod === 'pickup' && (
                    <p className="text-sm text-muted-foreground">
                      {t('editProject.shippingDetails.pickupAddress')}: Zielonogórska 13, 30-406 Kraków
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Price Summary */}
          <Card className="shadow-xl border-2 animate-scale-in sticky bottom-4 bg-card/95 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('editProject.priceSummary.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4 items-center">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t('editProject.priceSummary.originalTotal')}</p>
                  <p className="text-xl font-bold">{originalTotal.toFixed(2)} PLN</p>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t('editProject.priceSummary.newPartsTotal')}</p>
                  <p className="text-xl font-bold">{newPartsTotal.toFixed(2)} PLN</p>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t('editProject.priceSummary.shipping')}</p>
                  <p className="text-xl font-bold">{newShippingCost.toFixed(2)} PLN</p>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${
                  totalDifference > 0.01 
                    ? 'bg-blue-500/10 border border-blue-500/30' 
                    : totalDifference < -0.01 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-muted/50'
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {totalDifference > 0.01 ? t('editProject.priceSummary.extraPayment') : totalDifference < -0.01 ? t('editProject.priceSummary.refund') : t('editProject.priceSummary.difference')}
                  </p>
                  <p className={`text-xl font-bold ${
                    totalDifference > 0.01 ? 'text-blue-600' : totalDifference < -0.01 ? 'text-green-600' : ''
                  }`}>
                    {totalDifference > 0 ? '+' : ''}{totalDifference.toFixed(2)} PLN
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSave} 
                    className="w-full hover-lift"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('editProject.buttons.processing')}
                      </>
                    ) : totalDifference > 0.01 ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('editProject.buttons.payExtra')} {totalDifference.toFixed(2)} PLN
                      </>
                    ) : totalDifference < -0.01 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('editProject.buttons.getRefund')} {Math.abs(totalDifference).toFixed(2)} PLN
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('editProject.buttons.saveChanges')}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/orders')}
                    className="w-full"
                    size="sm"
                  >
                    {t('editProject.buttons.cancel')}
                  </Button>
                </div>
              </div>

              {totalDifference > 0.01 && (
                <div className="mt-4 bg-blue-500/10 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                  <strong>{t('editProject.notes.noteLabel')}:</strong> {t('editProject.notes.extraPaymentNote')} <strong>{totalDifference.toFixed(2)} PLN</strong>.
                </div>
              )}

              {totalDifference < -0.01 && (
                <div className="mt-4 bg-green-500/10 p-3 rounded-lg text-sm text-green-700 dark:text-green-400">
                  <strong>{t('editProject.notes.goodNews')}!</strong> {t('editProject.notes.refundNote')} <strong>{Math.abs(totalDifference).toFixed(2)} PLN</strong>.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditProject;
