import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Package, Loader2, MoreHorizontal, Pencil, Trash2, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: OrderStatus;
  created_at: string;
  material: string;
  color: string;
  price: number;
  file_name: string;
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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
    
    // Refresh failed, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    return null;
  };

  const fetchOrders = async (retry = true) => {
    try {
      setLoading(true);
      let token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      let response = await fetch(`${API_URL}/orders/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchOrders(false); // Retry with new token
        }
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} PLN`;
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-2 gradient-text">My Orders</h1>
            <p className="text-muted-foreground text-lg">Track and manage your 3D printing orders</p>
          </div>

          <Card className="shadow-xl border-2 border-transparent hover:border-primary/10 transition-all animate-slide-up bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                All Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading orders...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  <p>{error}</p>
                  <Button onClick={fetchOrders} variant="outline" className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No orders yet</p>
                  <p className="mt-2">Start by creating your first 3D print order!</p>
                  <Button onClick={() => navigate('/new-print')} className="mt-4">
                    Create New Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-4 text-sm font-bold text-muted-foreground pb-4 px-4">
                    <div>File Name</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Material</div>
                    <div>Price</div>
                    <div className="text-right">Actions</div>
                  </div>
                  
                  {orders.map((order, index) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-6 gap-4 items-center py-4 px-4 rounded-xl hover:bg-primary/5 transition-all hover-lift border border-transparent hover:border-primary/20 animate-scale-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="font-bold text-primary truncate" title={order.file_name}>
                        {order.file_name}
                      </div>
                      <div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                      <div className="text-sm">
                        <span className="font-semibold">{capitalizeFirst(order.material)}</span>
                        <span className="text-muted-foreground ml-1">({capitalizeFirst(order.color)})</span>
                      </div>
                      <div className="font-bold gradient-text">{formatPrice(order.price)}</div>
                      <div className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(order.id);
                              toast.success('Order ID copied to clipboard');
                            }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Order ID
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download File
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => toast.error('Delete functionality coming soon')}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Orders;
