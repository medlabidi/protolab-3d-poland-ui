import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { 
  ArrowLeft, Package, User, Calendar, DollarSign, 
  Truck, FileText, Clock, Weight, Layers, Info,
  Mail, Phone, MapPin, CreditCard, Palette
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  created_at: string;
  updated_at?: string;
  order_type: 'print' | 'design';
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
  material_weight?: number;
  print_time?: number;
  tracking_code?: string;
  notes?: string;
  user_email?: string;
  design_description?: string;
  design_requirements?: string;
  reference_images?: string[];
  parent_order_id?: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const AdminOrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [creatingPrint, setCreatingPrint] = useState(false);
  const [printFormData, setPrintFormData] = useState({
    material: 'PLA',
    color: 'white',
    layerHeight: 0.2,
    infill: 20,
    quantity: 1,
    price: 0,
  });

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        navigate('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getQualityLabel = (layerHeight: string) => {
    const height = parseFloat(layerHeight);
    if (height <= 0.1) return 'Haute qualité';
    if (height <= 0.2) return 'Standard';
    return 'Draft';
  };
  const createPrintOrder = async (printData: {
    material: string;
    color: string;
    layerHeight: number;
    infill: number;
    quantity: number;
    price: number;
  }) => {
    if (!order) return;
    
    try {
      setCreatingPrint(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/admin/orders/${order.id}/create-print`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      });

      if (!response.ok) {
        throw new Error('Failed to create print order');
      }

      const data = await response.json();
      toast.success('Commande d\'impression créée avec succès!');
      setShowPrintDialog(false);
      
      // Navigate to the new print order
      navigate(`/admin/orders/${data.order.id}`);
    } catch (err) {
      console.error('Error creating print order:', err);
      toast.error('Échec de la création de la commande');
    } finally {
      setCreatingPrint(false);
    }
  };
  const getShippingLabel = (method: string) => {
    const labels: Record<string, string> = {
      standard: 'Standard',
      express: 'Express',
      pickup: 'Retrait en magasin',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Chargement des détails...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/orders")} 
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6 text-center py-12">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-red-400 text-xl font-semibold mb-2">
                  {error || 'Commande introuvable'}
                </p>
                <p className="text-gray-500">
                  Cette commande n'existe pas ou a été supprimée.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header avec bouton retour */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/orders")}
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
            <div className="h-8 w-px bg-gray-700" />
            <h1 className="text-2xl font-bold text-white">
              {order.order_type === 'design' ? '🎨 Design Assistance' : '📦 Print Job'}
            </h1>
            {order.order_type === 'design' && (
              <>
                <div className="flex-1" />
                <Button
                  onClick={() => setShowPrintDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Créer commande d'impression
                </Button>
              </>
            )}
          </div>

          {/* Order Summary Card */}
          <Card className={`bg-gradient-to-br ${
            order.order_type === 'design' 
              ? 'from-purple-900/30 to-purple-800/30 border-purple-700/50'
              : 'from-blue-900/30 to-blue-800/30 border-blue-700/50'
          } shadow-xl`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                {/* Left: Order Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    {order.order_type === 'design' ? (
                      <Palette className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Package className="w-6 h-6 text-blue-400" />
                    )}
                    <h2 className="text-2xl font-bold text-white">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <StatusBadge status={order.status} />
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.order_type === 'design'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {order.order_type === 'design' ? 'Design' : 'Print'}
                    </span>
                    {order.parent_order_id && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        Depuis design
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium text-white">{order.file_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Créé le {formatDate(order.created_at)}</span>
                    </div>
                    {order.users && (
                      <>
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{order.users.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{order.users.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Price & Payment */}
                <div className="flex flex-col items-end justify-between">
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Prix total</p>
                    <p className="text-4xl font-bold text-green-400">
                      {order.price.toFixed(2)} PLN
                    </p>
                  </div>
                  
                  {order.payment_status && (
                    <div className="mt-4">
                      <PaymentStatusBadge 
                        status={order.payment_status} 
                        amount={order.paid_amount}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Progression de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Parent Order Link for Print orders created from Design */}
          {order.parent_order_id && (
            <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Créé depuis un projet de design</p>
                      <p className="text-white font-medium">Ordre parent: #{order.parent_order_id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/orders/${order.parent_order_id}`)}
                    className="bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
                  >
                    Voir le design
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Model Viewer */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-white flex items-center gap-2">
                  {order.order_type === 'design' ? (
                    <>
                      <Palette className="w-5 h-5 text-purple-400" />
                      Fichier de référence
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 text-blue-400" />
                      Modèle 3D
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <ModelViewerUrl 
                    url={order.file_url} 
                    fileName={order.file_name}
                  />
                </div>
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Fichier</p>
                  <p className="text-white font-medium">{order.file_name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Parameters - Different for Design vs Print */}
            {order.order_type === 'design' ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-purple-400" />
                    Détails du projet de design
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {order.design_description && (
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>
                      <p className="text-white leading-relaxed">{order.design_description}</p>
                    </div>
                  )}
                  
                  {order.design_requirements && (
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Exigences</p>
                      <p className="text-white leading-relaxed whitespace-pre-wrap">{order.design_requirements}</p>
                    </div>
                  )}

                  {order.reference_images && order.reference_images.length > 0 && (
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Images de référence</p>
                      <div className="grid grid-cols-2 gap-2">
                        {order.reference_images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Reference ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg border border-purple-700/50">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Quantité demandée</p>
                    <p className="text-2xl font-bold text-purple-400">{order.quantity} pièce(s)</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Paramètres d'impression
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                {/* Material & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Matériau</p>
                    <p className="text-lg font-bold text-white">{order.material?.toUpperCase()}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Couleur</p>
                    <p className="text-lg font-bold text-white">{capitalizeFirst(order.color)}</p>
                  </div>
                </div>

                {/* Quality & Infill */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Qualité</p>
                    <p className="text-lg font-bold text-white">{getQualityLabel(order.layer_height)}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.layer_height}mm / couche</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remplissage</p>
                    <p className="text-lg font-bold text-white">{order.infill}%</p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantité</p>
                  <p className="text-2xl font-bold text-blue-400">{order.quantity} pièce(s)</p>
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Technical Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            {order.material_weight && (
              <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700/50">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Weight className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {(order.material_weight * 1000).toFixed(1)}g
                    </div>
                    <p className="text-sm text-gray-400">Poids matériau estimé</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {order.print_time && (
              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700/50">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Clock className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {Math.floor(order.print_time / 60)}h {order.print_time % 60}min
                    </div>
                    <p className="text-sm text-gray-400">Temps d'impression</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700/50">
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <DollarSign className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {order.price.toFixed(2)} PLN
                  </div>
                  <p className="text-sm text-gray-400">Prix total</p>
                  {order.paid_amount && order.paid_amount > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full">
                      <CreditCard className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">
                        {order.paid_amount.toFixed(2)} PLN payé
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Info */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Informations de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Méthode de livraison</p>
                  <p className="text-lg font-semibold text-white">
                    {getShippingLabel(order.shipping_method)}
                  </p>
                </div>
                
                {order.shipping_address && (
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Adresse de livraison
                    </p>
                    <p className="text-sm text-white leading-relaxed">{order.shipping_address}</p>
                  </div>
                )}

                {order.tracking_code && (
                  <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/50 md:col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Code de suivi</p>
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-mono text-xl font-bold text-blue-400">{order.tracking_code}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(order.tracking_code!);
                          toast.success('Code de suivi copié!');
                        }}
                      >
                        📋 Copier
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-yellow-400" />
                  Notes de la commande
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="p-4 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/orders")}
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            <Button 
              variant="default"
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              🖨️ Imprimer
            </Button>
          </div>
        </div>

        {/* Dialog pour créer une commande d'impression */}
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-400" />
                Créer une commande d'impression
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Créer une nouvelle commande d'impression liée au design {order?.file_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Matériau</Label>
                  <Input
                    id="material"
                    value={printFormData.material}
                    onChange={(e) => setPrintFormData({ ...printFormData, material: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    value={printFormData.color}
                    onChange={(e) => setPrintFormData({ ...printFormData, color: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="layerHeight">Hauteur de couche (mm)</Label>
                  <Input
                    id="layerHeight"
                    type="number"
                    step="0.05"
                    value={printFormData.layerHeight}
                    onChange={(e) => setPrintFormData({ ...printFormData, layerHeight: parseFloat(e.target.value) })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infill">Remplissage (%)</Label>
                  <Input
                    id="infill"
                    type="number"
                    value={printFormData.infill}
                    onChange={(e) => setPrintFormData({ ...printFormData, infill: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={printFormData.quantity}
                    onChange={(e) => setPrintFormData({ ...printFormData, quantity: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (PLN)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={printFormData.price}
                    onChange={(e) => setPrintFormData({ ...printFormData, price: parseFloat(e.target.value) })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPrintDialog(false)}
                className="bg-gray-800 border-gray-700"
                disabled={creatingPrint}
              >
                Annuler
              </Button>
              <Button
                onClick={() => createPrintOrder(printFormData)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={creatingPrint}
              >
                {creatingPrint ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Créer la commande
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminOrderDetails;
