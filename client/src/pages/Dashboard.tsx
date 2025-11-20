import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { Package, DollarSign, Clock, Eye, ArrowRight, Plus } from "lucide-react";
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
      color: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      bgIcon: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      title: t.dashboard.completedPrints,
      value: "12",
      icon: Package,
      description: "Successfully delivered",
      color: "from-green-500/20 to-green-600/20",
      iconColor: "text-green-600 dark:text-green-400",
      bgIcon: "bg-green-100 dark:bg-green-900/50"
    },
    {
      title: t.dashboard.totalSpent,
      value: "1,245 PLN",
      icon: DollarSign,
      description: "Lifetime spending",
      color: "from-purple-500/20 to-purple-600/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      bgIcon: "bg-purple-100 dark:bg-purple-900/50"
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{t.dashboard.overview}</h1>
              <p className="text-slate-600 dark:text-slate-400">{t.dashboard.welcome}</p>
            </div>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all flex items-center gap-2" onClick={() => navigate("/new-print")}>
              <Plus className="w-5 h-5" />
              New Print
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 bg-white dark:bg-slate-900 hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgIcon}`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">{stat.value}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{t.dashboard.recentOrders}</CardTitle>
                <Button variant="outline" className="dark:hover:bg-slate-800" onClick={() => navigate("/orders")}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>Order ID</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div>Material</div>
                  <div className="text-right">Actions</div>
                </div>
                {recentOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-5 gap-4 items-center py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 -mx-2 rounded transition-colors">
                    <div className="font-semibold text-slate-900 dark:text-white">{order.id}</div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{order.date}</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{order.material}</div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10 dark:hover:bg-primary/20"
                        onClick={() => navigate(`/orders/${order.id}`)}
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
