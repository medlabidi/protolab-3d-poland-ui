import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { Package, DollarSign, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Active Orders",
      value: "3",
      icon: Clock,
      description: "Currently in progress",
    },
    {
      title: "Completed Orders",
      value: "12",
      icon: Package,
      description: "Successfully delivered",
    },
    {
      title: "Total Spent",
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
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your 3D printing projects.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground pb-3 border-b">
                  <div>Order ID</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div>Material</div>
                  <div className="text-right">Actions</div>
                </div>
                {recentOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-5 gap-4 items-center py-3 border-b last:border-0">
                    <div className="font-medium">{order.id}</div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">{order.date}</div>
                    <div className="text-sm">{order.material}</div>
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
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
