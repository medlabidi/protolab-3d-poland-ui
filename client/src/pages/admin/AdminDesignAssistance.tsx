import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Loader2, MessageCircle, X, FileIcon, Download, Send, Image as ImageIcon, User, Calendar, DollarSign } from "lucide-react";
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
  order_number?: string;
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

const statusConfig = {
  submitted: { label: "New Request", color: "bg-yellow-500", borderColor: "border-yellow-500" },
  in_review: { label: "Reviewing", color: "bg-blue-500", borderColor: "border-blue-500" },
  in_progress: { label: "Working On It", color: "bg-purple-500", borderColor: "border-purple-500" },
  completed: { label: "Done", color: "bg-green-500", borderColor: "border-green-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500", borderColor: "border-red-500" },
} as const;

const AdminDesignAssistance = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
        setOrders(data.orders || []);
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
        toast.success('Status updated successfully');
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
    setMessages([]);
    setConversation(null);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          sender_type: 'engineer',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        toast.success('Message sent');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} PLN`;
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Palette className="w-8 h-8 text-purple-500" />
                Design Assistance Requests
              </h1>
              <p className="text-gray-400 mt-2">Manage and respond to custom design requests</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests ({orders.length})</SelectItem>
                  <SelectItem value="submitted">New ({orders.filter(o => o.status === 'submitted').length})</SelectItem>
                  <SelectItem value="in_review">Reviewing ({orders.filter(o => o.status === 'in_review').length})</SelectItem>
                  <SelectItem value="in_progress">In Progress ({orders.filter(o => o.status === 'in_progress').length})</SelectItem>
                  <SelectItem value="completed">Completed ({orders.filter(o => o.status === 'completed').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Palette className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Design Requests</h3>
                <p className="text-gray-500">
                  {statusFilter === 'all' 
                    ? 'There are no design assistance requests yet.' 
                    : `No requests with status "${statusConfig[statusFilter as keyof typeof statusConfig]?.label || statusFilter}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="bg-gray-900 border-gray-800 hover:border-purple-600 transition-all cursor-pointer group"
                  onClick={() => openOrderDetails(order)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white`}>
                            {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                          </Badge>
                          {order.has_unread_messages && (
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white text-sm font-mono">
                          #{order.order_number || order.id.substring(0, 8)}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Description Preview */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {order.design_description || 'No description provided'}
                      </p>
                    </div>

                    {/* Reference Images Preview */}
                    {order.reference_images && order.reference_images.length > 0 && (
                      <div className="flex gap-1">
                        {order.reference_images.slice(0, 3).map((url, idx) => (
                          <div key={idx} className="w-16 h-16 rounded overflow-hidden bg-gray-800">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.reference_images.length > 3 && (
                          <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center">
                            <span className="text-xs text-gray-400">+{order.reference_images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User className="w-3 h-3" />
                      <span className="truncate">{order.users?.name || 'Unknown'}</span>
                    </div>

                    {/* Date and Price */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-400 font-semibold">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatPrice(order.price)}</span>
                      </div>
                    </div>

                    {/* Click hint */}
                    <div className="text-center text-xs text-gray-500 group-hover:text-purple-400 transition-colors">
                      Click to view details →
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-7xl max-h-[95vh] bg-gray-900 border-gray-800 text-white overflow-hidden">
          <DialogHeader className="border-b border-gray-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-6 h-6 text-purple-500" />
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Design Request #{selectedOrder?.order_number || selectedOrder?.id.substring(0, 8)}
                  </DialogTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    Customer: {selectedOrder?.users?.name || 'Unknown'} • {selectedOrder?.users?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-y-auto p-6 max-h-[calc(95vh-140px)]">
              {/* Left: Design Details (2 columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status and Info */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Request Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="w-full bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">New Request</SelectItem>
                        <SelectItem value="in_review">Reviewing</SelectItem>
                        <SelectItem value="in_progress">Working On It</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-900 p-3 rounded-lg">
                        <p className="text-gray-400 text-xs mb-1">Created</p>
                        <p className="text-white font-medium">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div className="bg-gray-900 p-3 rounded-lg">
                        <p className="text-gray-400 text-xs mb-1">Price</p>
                        <p className="text-purple-400 font-bold">{formatPrice(selectedOrder.price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {selectedOrder.design_description || 'No description provided'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements */}
                {selectedOrder.design_requirements && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 rounded-lg p-4">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {selectedOrder.design_requirements}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reference Images */}
                {selectedOrder.reference_images && selectedOrder.reference_images.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Reference Images ({selectedOrder.reference_images.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedOrder.reference_images.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden group"
                          >
                            <img 
                              src={url} 
                              alt={`Reference ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Download className="w-6 h-6 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Conversation (3 columns) */}
              <div className="lg:col-span-3">
                <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-500" />
                        Conversation
                      </span>
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0">
                    {/* Messages Area */}
                    <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto space-y-3 mb-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                          <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium mb-1">No messages yet</p>
                          <p className="text-xs">Start the conversation to discuss design details</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="space-y-2">
                            <div
                              className={`p-4 rounded-lg ${
                                message.sender_type === 'engineer'
                                  ? 'bg-purple-900/30 border-l-4 border-purple-500 ml-8'
                                  : message.sender_type === 'user'
                                  ? 'bg-gray-800 border-l-4 border-blue-500 mr-8'
                                  : 'bg-gray-700/30 text-center text-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {message.sender_type === 'engineer' ? '🔧 Engineer' : message.sender_type === 'user' ? '👤 Customer' : 'System'}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                                {message.message}
                              </p>
                            </div>
                            
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pl-4">
                                {message.attachments.map((attachment: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-700"
                                  >
                                    <FileIcon className="w-4 h-4 text-purple-400" />
                                    <span className="text-gray-300">{attachment.name}</span>
                                    <Download className="w-3 h-3 text-gray-500" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    {conversation && (
                      <div className="flex gap-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message to the customer..."
                          className="flex-1 bg-gray-900 border-gray-700 text-white resize-none"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="bg-purple-600 hover:bg-purple-700 self-end"
                        >
                          {sendingMessage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignAssistance;
