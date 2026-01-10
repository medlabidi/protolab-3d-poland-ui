import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Loader2, MessageCircle, X, FileIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: string;
  payment_status?: string;
  created_at: string;
  price: number;
  design_description?: string;
  design_requirements?: string;
  reference_images?: string[];
  users?: { name: string; email: string };
  has_unread_messages?: boolean;
}

interface Message {
  id: string;
  sender_type: 'user' | 'engineer' | 'system';
  message: string;
  attachments?: any[];
  created_at: string;
}

const statusGroups = {
  submitted: { label: "Submitted", color: "bg-yellow-900/20 border-yellow-700" },
  in_review: { label: "In Review", color: "bg-blue-900/20 border-blue-700" },
  in_progress: { label: "In Progress", color: "bg-purple-900/20 border-purple-700" },
  completed: { label: "Completed", color: "bg-green-900/20 border-green-700" },
} as const;

const AdminDesignAssistance = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders?type=design`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders?.filter((o: Order) => 
          ['submitted', 'in_review', 'in_progress', 'completed'].includes(o.status)
        ) || []);
      } else {
        toast.error('Failed to fetch design assistance requests');
      }
    } catch (error) {
      console.error('Error fetching design requests:', error);
      toast.error('Error loading design assistance requests');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        toast.success('Status updated');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);

    // Fetch conversation
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/order/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        if (data.conversation?.id) {
          // Fetch messages
          const messagesResponse = await fetch(`${API_URL}/conversations/${data.conversation.id}/messages`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(messagesData.messages || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} PLN`;
  };

  const groupedOrders = {
    submitted: orders.filter(o => o.status === 'submitted'),
    in_review: orders.filter(o => o.status === 'in_review'),
    in_progress: orders.filter(o => o.status === 'in_progress'),
    completed: orders.filter(o => o.status === 'completed'),
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Design Assistance</h1>
              <p className="text-gray-400 mt-1">Manage custom design requests and consultations</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {orders.length} Active Requests
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(statusGroups).map(([status, config]) => (
              <Card key={status} className={`${config.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{config.label}</span>
                    <Badge variant="secondary">{groupedOrders[status as keyof typeof groupedOrders].length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedOrders[status as keyof typeof groupedOrders].length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No requests in this status</p>
                    </div>
                  ) : (
                    groupedOrders[status as keyof typeof groupedOrders].map((order) => (
                      <Card
                        key={order.id}
                        className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
                        onClick={() => openOrderDetails(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-white truncate">
                                  {order.design_description?.substring(0, 40) || 'Design Request'}...
                                </p>
                                {order.has_unread_messages && (
                                  <MessageCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-gray-400 truncate">
                                {order.users?.name || 'Unknown'} • {formatDate(order.created_at)}
                              </p>
                              <p className="text-sm text-blue-400 font-medium mt-1">
                                {formatPrice(order.price)}
                              </p>
                            </div>
                            <Select
                              value={order.status}
                              onValueChange={(value) => {
                                updateOrderStatus(order.id, value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="w-[130px] h-8 bg-gray-900 border-gray-600 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="in_review">In Review</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Order Details Dialog with Conversation */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Design Request Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Left: Design Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-200">Request Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-white">{selectedOrder.users?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white font-semibold">{formatPrice(selectedOrder.price)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-200">Description</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {selectedOrder.design_description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {selectedOrder.design_requirements && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-200">Requirements</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedOrder.design_requirements}
                      </p>
                    </div>
                  </div>
                )}

                {selectedOrder.reference_images && selectedOrder.reference_images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-200">Reference Images</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.reference_images.map((url, index) => (
                        <div key={index} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                          <img 
                            src={url} 
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-200">Status</h3>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                  >
                    <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right: Conversation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-200">Conversation</h3>
                  {conversation && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowOrderDetails(false);
                        navigate(`/admin/conversations?open=${conversation.id}`);
                      }}
                      className="text-xs"
                    >
                      Open Full Chat
                    </Button>
                  )}
                </div>

                <div className="bg-gray-800 rounded-lg p-4 h-[500px] overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-2">Start a conversation to discuss design details</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div
                          className={`p-3 rounded-lg ${
                            message.sender_type === 'engineer'
                              ? 'bg-blue-900/30 border-l-2 border-blue-500'
                              : message.sender_type === 'user'
                              ? 'bg-gray-700/50'
                              : 'bg-gray-600/30 text-center text-xs'
                          }`}
                        >
                          <p className="text-sm text-white whitespace-pre-wrap">{message.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                        
                        {/* Show attachments if any */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pl-3">
                            {message.attachments.map((attachment: any, idx: number) => (
                              <a
                                key={idx}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                              >
                                <FileIcon className="w-4 h-4 text-blue-400" />
                                <span className="text-gray-300">{attachment.name}</span>
                                <Download className="w-3 h-3 text-gray-400" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignAssistance;
