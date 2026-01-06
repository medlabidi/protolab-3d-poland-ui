import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { ArrowLeft, Star, Loader2, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  paid_amount?: number;
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
  material_weight?: number;
  print_time?: number;
  tracking_code?: string;
  review?: string;
  notes?: string;
}

const OrderDetails = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { orderId } = useParams();
  const [rating, setRating] = useState(0);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [startingConversation, setStartingConversation] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

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
      setError(null);
      let token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      console.log('Fetching order:', orderId);
      console.log('API URL:', `${API_URL}/orders/${orderId}`);
      
      let response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (response.status === 401 && retry) {
        console.log('Token expired, refreshing...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchOrder(false);
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to fetch order (${response.status})`);
      }

      const data = await response.json();
      console.log('Order data received:', data);
      
      if (!data.order) {
        throw new Error('No order data in response');
      }
      
      setOrder(data.order);
      toast.success('Order loaded successfully');
    } catch (err) {
      console.error('Error fetching order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      toast.error(t('orderDetails.review.selectRating'));
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          review: `${rating} stars: ${reviewText}` 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast.success(t('orderDetails.review.submitted'));
      fetchOrder(); // Refresh order data
    } catch (err) {
      toast.error(t('orderDetails.review.failed'));
    }
  };

  const handleJobConversation = async () => {
    setStartingConversation(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/order/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subject: `Job conversation for order #${orderId?.slice(0, 8)}` 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to open conversation');
      }

      const data = await response.json();
      const conversationId = data.conversation?.id;
      
      // Navigate to conversations page with the conversation ID
      navigate(`/conversations?open=${conversationId}`);
    } catch (err) {
      console.error('Error opening conversation:', err);
      toast.error(t('orderDetails.conversation.failed'));
    } finally {
      setStartingConversation(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    return `${(price ?? 0).toFixed(2)} PLN`;
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getQualityLabel = (layerHeight: string) => {
    const height = parseFloat(layerHeight);
    if (height <= 0.1) return t('orderDetails.quality.ultra');
    if (height <= 0.15) return t('orderDetails.quality.high');
    if (height <= 0.2) return t('orderDetails.quality.standard');
    return t('orderDetails.quality.draft');
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case 'inpost': return t('orderDetails.shipping.inpost');
      case 'courier': return t('orderDetails.shipping.courier');
      case 'pickup': return t('orderDetails.shipping.pickup');
      default: return capitalizeFirst(method);
    }
  };

  const canReview = order && (order.status === "finished" || order.status === "delivered") && !order.review;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('orderDetails.loading')}</span>
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
            <p className="text-destructive text-lg">{error || t('orderDetails.notFound')}</p>
            <Button onClick={() => navigate("/orders")} variant="outline" className="mt-4">
              {t('orderDetails.backToOrders')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 animate-slide-up">
            <Button variant="outline" size="icon" onClick={() => navigate("/orders")} className="mt-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold gradient-text">Commande #{order.id.slice(0, 8)}</h1>
                <StatusBadge status={order.status} />
                {order.payment_status && (
                  <PaymentStatusBadge 
                    status={order.payment_status} 
                    amount={order.paid_amount}
                  />
                )}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>📅 Créée le {formatDate(order.created_at)}</span>
                <span>•</span>
                <span>💰 Prix total: {order.price.toFixed(2)} PLN</span>
                {order.paid_amount && (
                  <>
                    <span>•</span>
                    <span>✅ Payé: {order.paid_amount.toFixed(2)} PLN</span>
                  </>
                )}
              </div>
            </div>
            <Button 
              variant="default" 
              onClick={handleJobConversation}
              disabled={startingConversation}
              className="gap-2"
            >
              {startingConversation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {t('orderDetails.jobConversation')}
            </Button>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orderDetails.orderProgress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* File Preview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('orderDetails.model3d')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelViewerUrl 
                  url={order.file_url} 
                  fileName={order.file_name}
                  height="300px"
                />
                <p className="text-sm text-muted-foreground mt-4">
                  {t('orderDetails.file')}: {order.file_name}
                </p>
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  ⚙️ {t('orderDetails.printParameters')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Matériau</span>
                    <p className="font-semibold text-lg">{order.material?.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Couleur</span>
                    <p className="font-semibold text-lg">{capitalizeFirst(order.color)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Qualité</span>
                    <p className="font-semibold">{getQualityLabel(order.layer_height)}</p>
                    <p className="text-xs text-muted-foreground">{order.layer_height}mm / couche</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Remplissage</span>
                    <p className="font-semibold">{order.infill}%</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">📦 Quantité</span>
                    <span className="font-bold text-xl">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">🚚 Livraison</span>
                    <span className="font-medium">{getShippingLabel(order.shipping_method)}</span>
                  </div>
                  {order.shipping_address && (
                    <div className="bg-muted/50 rounded-lg p-3 mt-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">📍 Adresse</span>
                      <p className="text-sm font-medium">{order.shipping_address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Details & Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Technical Stats */}
            {order.material_weight && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚖️</div>
                    <div className="text-3xl font-bold text-primary">
                      {(order.material_weight * 1000).toFixed(1)}g
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Poids matériau</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {order.print_time && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⏱️</div>
                    <div className="text-3xl font-bold text-primary">
                      {Math.floor(order.print_time / 60)}h {order.print_time % 60}min
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Temps d'impression</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Price Summary */}
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">💰</div>
                  <div className="text-3xl font-bold text-primary">
                    {order.price.toFixed(2)} PLN
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Prix total</p>
                  {order.paid_amount && order.paid_amount > 0 && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                      ✅ {order.paid_amount.toFixed(2)} PLN payé
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tracking */}
          {order.tracking_code && (
            <Card className="border-2 border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  📦 {t('orderDetails.tracking')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Code de suivi</p>
                  <p className="font-mono text-2xl font-bold text-primary">{order.tracking_code}</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigator.clipboard.writeText(order.tracking_code!)}>
                    📋 Copier le code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-500/5">
                <CardTitle className="flex items-center gap-2">
                  📝 {t('orderDetails.notes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Review */}
          {order.review && (
            <Card className="border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-500/5">
                <CardTitle className="flex items-center gap-2">
                  ⭐ {t('orderDetails.yourReview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm whitespace-pre-wrap">{order.review}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          {canReview && (
            <Card className="border-2 border-primary hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  ⭐ {t('orderDetails.leaveReview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Votre évaluation</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Votre commentaire</p>
                  <Textarea
                    placeholder={t('orderDetails.reviewPlaceholder')}
                    rows={5}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <Button 
                  onClick={handleReviewSubmit}
                  disabled={!rating || !reviewText.trim()}
                  className="w-full"
                  size="lg"
                >
                  ⭐ {t('orderDetails.submitReview')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
