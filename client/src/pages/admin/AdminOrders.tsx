import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, 
  Search, 
  Filter,
  Eye,
  Edit,
  Loader2,
  Download,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  file_name: string;
  project_name?: string;
  material: string;
  color: string;
  status: string;
  payment_status: string;
  price: number;
  quantity: number;
  created_at: string;
  user_id: string;
  users?: { name: string; email: string };
  has_unread_messages?: boolean;
  file_url?: string;
  print_settings?: any;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin' | 'system';
  sender_id?: string;
  message: string;
  created_at: string;
}

interface Conversation {
  id: string;
  order_id: string;
  status: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || "all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    // Sort: Pending orders (submitted, in_queue) first
    filtered.sort((a, b) => {
      const pendingStatuses = ['submitted', 'in_queue'];
      const aIsPending = pendingStatuses.includes(a.status);
      const bIsPending = pendingStatuses.includes(b.status);
      
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      
      // Then sort by created_at (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredOrders(filtered);
  };

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
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
        toast.success('Order status updated');
        fetchOrders(); // Refresh orders
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const openOrderModal = async (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
    await fetchConversationAndMessages(order.id);
  };

  const fetchConversationAndMessages = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch conversations for this order
      const convResponse = await fetch(`${API_URL}/admin/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (convResponse.ok) {
        const data = await convResponse.json();
        const orderConv = data.conversations?.find((c: any) => c.order_id === orderId);
        
        if (orderConv) {
          setConversation(orderConv);
          
          // Fetch messages
          const msgResponse = await fetch(`${API_URL}/admin/conversations/${orderConv.id}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            setMessages(msgData.messages || []);
            
            // Mark as read
            await fetch(`${API_URL}/admin/conversations/${orderConv.id}/read`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` },
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500';
      case 'in_queue': return 'bg-yellow-500';
      case 'printing': return 'bg-purple-500';
      case 'finished': return 'bg-green-500';
      case 'delivered': return 'bg-emerald-500';
      case 'on_hold': return 'bg-amber-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'refunding': return 'bg-orange-500';
      case 'refunded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Orders Management</h1>
              <p className="text-gray-400">Manage and track all customer orders</p>
            </div>
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by file name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_queue">In Queue</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                {/* Payment Filter */}
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="refunding">Refunding</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Orders ({filteredOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Order ID</TableHead>
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">File / Project</TableHead>
                      <TableHead className="text-gray-400">Material</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Payment</TableHead>
                      <TableHead className="text-gray-400">Price</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow 
                          key={order.id}
                          onClick={() => openOrderModal(order)}
                          className="border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                        >
                          <TableCell className="font-mono text-sm text-gray-400">
                            {order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div>
                              <div className="font-medium">{order.users?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{order.users?.email || 'No email'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div>{order.file_name}</div>
                                {order.project_name && (
                                  <div className="text-xs text-gray-500 mt-0.5">Project: {order.project_name}</div>
                                )}
                              </div>
                              {order.has_unread_messages && (
                                <div className="relative">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {order.material} - {order.color}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => handleQuickStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
                                <Badge className={`${getStatusColor(order.status)} text-white border-0`}>
                                  {order.status.replace('_', ' ')}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="in_queue">In Queue</SelectItem>
                                <SelectItem value="printing">Printing</SelectItem>
                                <SelectItem value="finished">Finished</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPaymentStatusColor(order.payment_status)} text-white`}>
                              {order.payment_status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white font-semibold">
                            {order.price.toFixed(2)} PLN
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => navigate(`/admin/orders/${order.id}/edit`)}
                                className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Order Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                {selectedOrder?.file_name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                  {messages.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {messages.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4 pr-4">
                    {/* Status Controls */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Order Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Order Status</label>
                          <Select 
                            value={selectedOrder.status} 
                            onValueChange={(value) => handleQuickStatusUpdate(selectedOrder.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_queue">In Queue</SelectItem>
                              <SelectItem value="printing">Printing</SelectItem>
                              <SelectItem value="finished">Finished</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Payment Status</label>
                          <Badge className={`${getPaymentStatusColor(selectedOrder.payment_status)} text-white`}>
                            {selectedOrder.payment_status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Order Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Order ID</p>
                            <p className="font-mono text-sm">{selectedOrder.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="text-sm">{formatDate(selectedOrder.created_at)}</p>
                          </div>
                        </div>
                        {selectedOrder.project_name && (
                          <div>
                            <p className="text-sm text-muted-foreground">Project Name</p>
                            <p className="font-medium">{selectedOrder.project_name}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">File Name</p>
                          <p className="font-medium">{selectedOrder.file_name}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{selectedOrder.users?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-sm">{selectedOrder.users?.email || 'No email'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Print Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Print Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Material</p>
                          <p className="font-medium">{selectedOrder.material}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Color</p>
                          <p className="font-medium">{selectedOrder.color}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{selectedOrder.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="text-lg font-bold text-primary">{selectedOrder.price.toFixed(2)} PLN</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="messages" className="mt-4">
                <div className="flex flex-col h-[60vh]">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 pr-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender_type === 'admin'
                                  ? 'bg-primary text-primary-foreground'
                                  : msg.sender_type === 'system'
                                  ? 'bg-muted'
                                  : 'bg-secondary'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  {conversation && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={sendingMessage}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
