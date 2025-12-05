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
      let token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      let response = await fetch(`${API_URL}/orders/${orderId}`, {
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
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
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

      toast.success("Review submitted successfully!");
      fetchOrder(); // Refresh order data
    } catch (err) {
      toast.error("Failed to submit review");
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
      toast.error("Failed to open conversation");
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

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} PLN`;
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getQualityLabel = (layerHeight: string) => {
    const height = parseFloat(layerHeight);
    if (height <= 0.1) return 'Ultra Quality';
    if (height <= 0.15) return 'High Quality';
    if (height <= 0.2) return 'Standard Quality';
    return 'Draft Quality';
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case 'inpost': return 'InPost Locker';
      case 'courier': return 'Courier Delivery';
      case 'pickup': return 'Local Pickup';
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
            <span className="ml-3 text-muted-foreground">Loading order...</span>
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
            <p className="text-destructive text-lg">{error || 'Order not found'}</p>
            <Button onClick={() => navigate("/orders")} variant="outline" className="mt-4">
              Back to Orders
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">Placed on {formatDate(order.created_at)}</p>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <Button 
                variant="outline" 
                onClick={handleJobConversation}
                disabled={startingConversation}
                className="gap-2"
              >
                {startingConversation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Job Conversation
              </Button>
              <StatusBadge status={order.status} />
              {order.payment_status && (
                <PaymentStatusBadge 
                  status={order.payment_status} 
                  amount={order.paid_amount}
                />
              )}
            </div>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* File Preview */}
            <Card>
              <CardHeader>
                <CardTitle>3D Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelViewerUrl 
                  url={order.file_url} 
                  fileName={order.file_name}
                  height="300px"
                />
                <p className="text-sm text-muted-foreground mt-4">
                  File: {order.file_name}
                </p>
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Print Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Material</span>
                  <span className="font-medium">{order.material?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{capitalizeFirst(order.color)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Quality</span>
                  <span className="font-medium">{getQualityLabel(order.layer_height)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Layer Height</span>
                  <span className="font-medium">{order.layer_height}mm</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Infill</span>
                  <span className="font-medium">{order.infill}%</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{getShippingLabel(order.shipping_method)}</span>
                </div>
                {order.shipping_address && (
                  <div className="flex justify-between py-2 border-t">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right max-w-[200px]">{order.shipping_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Technical Details */}
          {(order.material_weight || order.print_time) && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {order.material_weight && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Material Weight</span>
                    <span className="font-medium">{(order.material_weight * 1000).toFixed(1)}g</span>
                  </div>
                )}
                {order.print_time && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Print Time</span>
                    <span className="font-medium">{Math.floor(order.print_time / 60)}h {order.print_time % 60}min</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tracking */}
          {order.tracking_code && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-lg">{order.tracking_code}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Existing Review */}
          {order.review && (
            <Card>
              <CardHeader>
                <CardTitle>Your Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.review}</p>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Share your experience with this print order..."
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <Button onClick={handleReviewSubmit}>Submit Review</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
