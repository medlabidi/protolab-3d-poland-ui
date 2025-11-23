import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { Package, DollarSign, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const stats = [
    {
      title: t.dashboard.activeOrders,
      value: "3",
      icon: Clock,
      description: "Currently in progress",
    },
    {
      title: t.dashboard.completedPrints,
      value: "12",
      icon: Package,
      description: "Successfully delivered",
    },
    {
      title: t.dashboard.totalSpent,
      value: "1,245 PLN",
      icon: DollarSign,
      description: "Lifetime spending",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      status: "printing" as OrderStatus,
      date: "2024-01-15",
      material: "PLA",
      price: "89.00 PLN",
    },
    {
      id: "ORD-002",
      status: "in-queue" as OrderStatus,
      date: "2024-01-14",
      material: "ABS",
      price: "125.50 PLN",
    },
    {
      id: "ORD-003",
      status: "finished" as OrderStatus,
      date: "2024-01-12",
      material: "PETG",
      price: "67.00 PLN",
    },
  ];

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
            {stats.map((stat, index) => (
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
                  <div>Order ID</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div>Material</div>
                  <div className="text-right">Actions</div>
                </div>
                {recentOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="grid grid-cols-5 gap-4 items-center py-4 px-4 rounded-lg hover:bg-primary/5 transition-all hover-lift border border-transparent hover:border-primary/20"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="font-bold text-primary">{order.id}</div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">{order.date}</div>
                    <div className="text-sm font-medium">{order.material}</div>
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
