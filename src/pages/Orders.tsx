import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { Eye } from "lucide-react";
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
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your 3D printing orders</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground pb-3 border-b">
                  <div>Order ID</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div>Material</div>
                  <div>Price</div>
                  <div className="text-right">Actions</div>
                </div>
                
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-6 gap-4 items-center py-4 border-b last:border-0 hover:bg-muted/50 transition-colors rounded-lg px-2"
                  >
                    <div className="font-medium">{order.id}</div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">{order.date}</div>
                    <div className="text-sm">
                      {order.material}
                      <span className="text-muted-foreground ml-1">({order.color})</span>
                    </div>
                    <div className="font-medium">{order.price}</div>
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
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
