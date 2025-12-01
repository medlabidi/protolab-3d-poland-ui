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
import { Package, DollarSign, Clock, Eye, Loader2, MoreHorizontal, Pencil, Trash2, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { API_URL } from "@/config/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedPrints: 0,
    totalSpent: "0 PLN",
  });

  useEffect(() => {
    fetchDashboardData();
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
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    return null;
  };

  const fetchDashboardData = async (retry = true) => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch user orders
      let response = await fetch(`${API_URL}/orders/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchDashboardData(false);
        }
        return;
      }

      if (!response.ok) {
        console.error('Failed to fetch orders:', response.status, response.statusText);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const userOrders = data.orders || [];
      setOrders(userOrders.slice(0, 5)); // Get recent 5 orders

      // Calculate stats from real data
      const active = userOrders.filter((o: any) => 
        ['submitted', 'in_queue', 'printing', 'on_hold'].includes(o.status)
      ).length;
      
      const completed = userOrders.filter((o: any) => 
        o.status === 'finished' || o.status === 'delivered'
      ).length;
      
      // Calculate total spent, excluding cancelled/suspended orders
      // Use paid_amount if available, otherwise use price
      const total = userOrders
        .filter((o: any) => o.status !== 'suspended' && o.payment_status !== 'refunded')
        .reduce((sum: number, o: any) => {
          const amount = parseFloat(o.paid_amount) || parseFloat(o.price) || 0;
          return sum + amount;
        }, 0);

      setStats({
        activeOrders: active,
        completedPrints: completed,
        totalSpent: `${total.toFixed(2)} PLN`,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: t.dashboard.activeOrders,
      value: stats.activeOrders.toString(),
      icon: Clock,
      description: "Currently in progress",
    },
    {
      title: t.dashboard.completedPrints,
      value: stats.completedPrints.toString(),
      icon: Package,
      description: "Successfully delivered",
    },
    {
      title: t.dashboard.totalSpent,
      value: stats.totalSpent,
      icon: DollarSign,
      description: "Lifetime spending",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-2 gradient-text">{t.dashboard.overview}</h1>
            <p className="text-muted-foreground text-lg">{t.dashboard.welcome}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {statsConfig.map((stat, index) => (
              <Card 
                key={stat.title}
                className="hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/50 shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2 gradient-text">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <Card className="shadow-xl border-2 border-transparent hover:border-primary/10 transition-all animate-slide-up bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                {t.dashboard.recentOrders}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-4 text-sm font-bold text-muted-foreground pb-4 px-4">
                  <div>File Name</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div>Material</div>
                  <div className="text-right">Actions</div>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">No orders yet</p>
                    <p className="text-sm">Start by creating your first 3D print order!</p>
                    <Button
                      onClick={() => navigate('/orders')}
                      className="mt-4"
                    >
                      View Orders
                    </Button>
                  </div>
                ) : (
                  orders.map((order, index) => (
                    <div 
                      key={order.id} 
                      className="grid grid-cols-5 gap-4 items-center py-4 px-4 rounded-lg hover:bg-primary/5 transition-all hover-lift border border-transparent hover:border-primary/20"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="font-bold text-primary truncate" title={order.file_name}>{order.file_name || 'Unnamed'}</div>
                      <div>
                        <StatusBadge status={order.status as OrderStatus} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm font-medium">{order.material || 'N/A'}</div>
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
