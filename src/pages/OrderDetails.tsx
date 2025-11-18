import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [rating, setRating] = useState(0);

  // Mock data
  const order = {
    id: orderId || "ORD-001",
    status: "printing" as OrderStatus,
    date: "2024-01-15",
    material: "PLA",
    color: "Blue",
    quality: "High Quality",
    quantity: 2,
    layerHeight: "0.2mm",
    infill: "20%",
    pattern: "Honeycomb",
    purpose: "Functional prototype for mechanical testing",
    shipping: "InPost Locker",
    subtotal: "89.00",
    shipping_cost: "12.00",
    total: "101.00",
  };

  const handleReviewSubmit = () => {
    toast.success("Review submitted successfully!");
  };

  const canReview = order.status === "finished" || order.status === "delivered";

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
              <h1 className="text-3xl font-bold">Order {order.id}</h1>
              <p className="text-muted-foreground">Placed on {order.date}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={order.status} />
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
                <div className="aspect-square bg-muted rounded-lg border flex items-center justify-center">
                  <p className="text-muted-foreground">3D model preview</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  File: prototype_v3.stl
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
                  <span className="font-medium">{order.material}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{order.color}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Quality</span>
                  <span className="font-medium">{order.quality}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Layer Height</span>
                  <span className="font-medium">{order.layerHeight}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Infill</span>
                  <span className="font-medium">{order.infill} ({order.pattern})</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{order.shipping}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purpose */}
          <Card>
            <CardHeader>
              <CardTitle>Purpose</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{order.purpose}</p>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{order.subtotal} PLN</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_cost} PLN</span>
              </div>
              <div className="flex justify-between py-3 border-t text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{order.total} PLN</span>
              </div>
            </CardContent>
          </Card>

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
