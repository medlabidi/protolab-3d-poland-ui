import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { Eye, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const navigate = useNavigate();

  const orders = [
    {
      id: "ORD-001",
      status: "printing" as OrderStatus,
      date: "2024-01-15",
      material: "PLA",
      color: "Blue",
      price: "89.00 PLN",
    },
    {
      id: "ORD-002",
      status: "in-queue" as OrderStatus,
      date: "2024-01-14",
      material: "ABS",
      color: "Black",
      price: "125.50 PLN",
    },
    {
      id: "ORD-003",
      status: "finished" as OrderStatus,
      date: "2024-01-12",
      material: "PETG",
      color: "White",
      price: "67.00 PLN",
    },
    {
      id: "ORD-004",
      status: "delivered" as OrderStatus,
      date: "2024-01-10",
      material: "PLA",
      color: "Red",
      price: "45.00 PLN",
    },
    {
      id: "ORD-005",
      status: "new" as OrderStatus,
      date: "2024-01-16",
      material: "Resin",
      color: "Clear",
      price: "198.00 PLN",
    },
  ];

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
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-4 text-sm font-bold text-muted-foreground pb-4 px-4">
                  <div>Order ID</div>
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
                    <div className="font-bold text-primary">{order.id}</div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">{order.date}</div>
                    <div className="text-sm">
                      <span className="font-semibold">{order.material}</span>
                      <span className="text-muted-foreground ml-1">({order.color})</span>
                    </div>
                    <div className="font-bold gradient-text">{order.price}</div>
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50 group"
                      >
                        <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Details
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

export default Orders;
