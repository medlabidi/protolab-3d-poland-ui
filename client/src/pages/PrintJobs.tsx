import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, X, Printer, FileText, Plus, Loader2, MessageSquare, Package, CreditCard, AlertCircle, ChevronRight, Eye, Pencil, Copy } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { API_URL } from "@/config/api";

interface PrintOrder {
  id: string;
  file_name: string;
  file_url?: string;
  project_name?: string;
  material: string;
  color: string;
  quality?: string;
  quantity: number;
  price: number;
  paid_amount?: number;
  status: string;
  payment_status?: string;
  shipping_method?: string;
  created_at: string;
  updated_at?: string;
  order_type?: string;
  has_unread_messages?: boolean;
}

interface Message {
  id: string;
  sender_type: 'user' | 'engineer' | 'system';
  message: string;
  attachments?: any[];
  created_at: string;
  is_read: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500';
    case 'in_queue': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    case 'printing': return 'bg-purple-500/20 text-purple-400 border-purple-500';
    case 'finished': return 'bg-green-500/20 text-green-400 border-green-500';
    case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500';
    case 'on_hold': return 'bg-orange-500/20 text-orange-400 border-orange-500';
    case 'suspended': return 'bg-red-500/20 text-red-400 border-red-500';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
  }
};

const getPaymentColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-500/20 text-green-400 border-green-500';
    case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    case 'on_hold': return 'bg-orange-500/20 text-orange-400 border-orange-500';
    case 'failed': return 'bg-red-500/20 text-red-400 border-red-500';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatPrice = (price: number | null | undefined) => {
  const numPrice = Number(price);
  if (price === null || price === undefined || isNaN(numPrice)) {
    return '0.00 PLN';
  }
  return `${numPrice.toFixed(2)} PLN`;
};

const capitalizeFirst = (str: string | null | undefined) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const PrintJobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationFile, setConversationFile] = useState<File | null>(null);
  const [detailOrder, setDetailOrder] = useState<PrintOrder | null>(null);

  const messagesScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      const viewport = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  }, [messages]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('accessToken');
    if (!loggedIn) {
      toast.error("Please log in to access Print Jobs");
      navigate("/login");
      return;
    }
    fetchPrintOrders();
  }, [navigate]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedOrder) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/conversations/order/${selectedOrder.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.conversation?.id && !conversationId) {
            setConversationId(data.conversation.id);
          }
          if (data.messages) {
            setMessages(data.messages);
          }
        }
      } catch (e) {
        // Silent fail on polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedOrder?.id]);

  // Poll for new/updated orders every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await fetch(`${API_URL}/orders/my?filter=active&orderType=print`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const newOrders = data.orders || [];
          setPrintOrders(newOrders);
          if (selectedOrder) {
            const updated = newOrders.find((o: PrintOrder) => o.id === selectedOrder.id);
            if (updated) {
              setSelectedOrder(updated);
            }
          }
        }
      } catch (e) {
        // Silent fail on polling
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedOrder?.id]);

  const fetchPrintOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/my?filter=active&orderType=print`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        setPrintOrders(orders);

        // Auto-select first order or URL-specified order
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');

        if (orderId && orders.length > 0) {
          const target = orders.find((o: PrintOrder) => o.id === orderId);
          if (target) {
            handleSelectOrder(target);
          } else if (orders.length > 0) {
            handleSelectOrder(orders[0]);
          }
        } else if (orders.length > 0) {
          handleSelectOrder(orders[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching print orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = async (order: PrintOrder) => {
    setSelectedOrder(order);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/order/${order.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation?.id || null);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setConversationId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !conversationFile) return;

    if (!selectedOrder) {
      toast.error("Please select an order first");
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const convResponse = await fetch(`${API_URL}/conversations/order/${selectedOrder.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (convResponse.ok) {
          const convData = await convResponse.json();
          currentConversationId = convData.conversation?.id || null;
          setConversationId(currentConversationId);
        }

        if (!currentConversationId) {
          toast.error('Failed to create conversation');
          return;
        }
      }

      let uploadedAttachment: any = null;

      if (conversationFile) {
        // Step 1: Get signed upload URL
        const uploadUrlResponse = await fetch(`${API_URL}/conversations/upload-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: currentConversationId,
            fileName: conversationFile.name,
          }),
        });

        if (!uploadUrlResponse.ok) {
          const errData = await uploadUrlResponse.json().catch(() => ({ error: 'Unknown error' }));
          toast.error(`Failed to prepare upload: ${errData.details || errData.error}`);
          return;
        }

        const { signedUrl, filePath, publicUrl } = await uploadUrlResponse.json();

        // Step 2: Upload file directly to Supabase Storage
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': conversationFile.type || 'application/octet-stream' },
          body: conversationFile,
        });

        if (!uploadResponse.ok) {
          toast.error('Failed to upload file. Please try again.');
          return;
        }

        uploadedAttachment = {
          file_path: filePath,
          original_name: conversationFile.name,
          file_size: conversationFile.size,
          mime_type: conversationFile.type,
          url: publicUrl,
          name: conversationFile.name,
        };
      }

      // Step 3: Send the message
      const messageBody: any = { message: newMessage };
      if (uploadedAttachment) {
        messageBody.attachments = [uploadedAttachment];
      }

      const response = await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
        setConversationFile(null);
        toast.success("Message sent");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </main>
      </div>
    );
  }

  // Empty state — no print orders
  if (printOrders.length === 0) {
    return (
      <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
        <DashboardSidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2 sm:gap-3">
                <Printer className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                Print Jobs
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Manage your 3D print orders and communicate with our team</p>
            </div>

            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 mt-8">
              <CardContent className="pt-12 pb-12 text-center px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/20 mb-6">
                  <Printer className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">No Print Jobs Yet</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Start by uploading a 3D model file to create your first print job.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate('/new-print')}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Print Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Main view with print orders
  return (
    <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
      <DashboardSidebar />

      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Printer className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                Print Jobs
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your print orders and communicate with our team</p>
            </div>
            <Button
              onClick={() => navigate('/new-print')}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              New Print Job
            </Button>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
            {/* Left Column - Orders List */}
            <Card className="bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  Print Orders ({printOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-4">
                  <div className="space-y-3 pt-4">
                    {printOrders.map((order) => (
                      <Card
                        key={order.id}
                        className={`cursor-pointer transition-all ${
                          selectedOrder?.id === order.id
                            ? 'bg-cyan-900/30 border-cyan-500'
                            : order.has_unread_messages
                              ? 'bg-orange-900/10 border-orange-500/50 hover:border-orange-500'
                              : 'bg-gray-800 border-gray-700 hover:border-cyan-500/50'
                        }`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {order.has_unread_messages && (
                                <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 animate-pulse" />
                              )}
                              <h3 className={`text-white font-semibold truncate ${order.has_unread_messages ? 'font-bold' : ''}`}>
                                {order.file_name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailOrder(order); }}
                                className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-cyan-400 transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            <span>{order.material} - {order.color}</span>
                            {order.quality && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{order.quality}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Qty: {order.quantity}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{formatDate(order.created_at)}</span>
                            <div className="flex items-center gap-2">
                              {order.payment_status && (
                                <Badge className={`text-[10px] px-1.5 py-0 ${getPaymentColor(order.payment_status)}`}>
                                  {order.payment_status}
                                </Badge>
                              )}
                              <span className="text-cyan-400 font-semibold">
                                {order.price?.toFixed(2)} PLN
                              </span>
                              <ChevronRight className="w-3 h-3 text-gray-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Column - Conversation */}
            <Card className="bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0 gap-4">
                {selectedOrder ? (
                  <>
                    {/* Order Details Summary */}
                    <div className="px-4 pt-4">
                      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold text-sm">{selectedOrder.file_name}</h3>
                          <Badge className={getStatusColor(selectedOrder.status)}>
                            {selectedOrder.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Material:</span>{' '}
                            <span className="text-gray-300">{selectedOrder.material} - {selectedOrder.color}</span>
                          </div>
                          {selectedOrder.quality && (
                            <div>
                              <span className="text-gray-500">Quality:</span>{' '}
                              <span className="text-gray-300 capitalize">{selectedOrder.quality}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Quantity:</span>{' '}
                            <span className="text-gray-300">{selectedOrder.quantity}</span>
                          </div>
                          {selectedOrder.shipping_method && (
                            <div>
                              <span className="text-gray-500">Shipping:</span>{' '}
                              <span className="text-gray-300 capitalize">{selectedOrder.shipping_method}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Price:</span>{' '}
                            <span className="text-cyan-400 font-semibold">{selectedOrder.price?.toFixed(2)} PLN</span>
                          </div>
                          {selectedOrder.payment_status && (
                            <div>
                              <span className="text-gray-500">Payment:</span>{' '}
                              <Badge className={`text-[10px] px-1.5 py-0 ${getPaymentColor(selectedOrder.payment_status)}`}>
                                {selectedOrder.payment_status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-hidden">
                      <ScrollArea className="h-[300px]" ref={messagesScrollRef}>
                        <div className="space-y-3 px-4 pb-2">
                          {messages.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-500 text-sm">No messages yet</p>
                              <p className="text-gray-600 text-xs mt-1">Send a message to start a conversation about this order</p>
                            </div>
                          ) : (
                            messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[85%] ${msg.sender_type === 'user' ? 'text-right' : 'text-left'}`}>
                                  <span className={`text-xs font-semibold ${
                                    msg.sender_type === 'user'
                                      ? 'text-cyan-400 text-right'
                                      : 'text-purple-400 text-left'
                                  }`}>
                                    {msg.sender_type === 'user' ? 'You' : 'Admin'}
                                  </span>

                                  <div
                                    className={`rounded-lg p-3 ${
                                      msg.sender_type === 'user'
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-200 border border-gray-700'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                                      <span>
                                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>

                                    {/* File Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {msg.attachments.filter((att: any) => att.url).map((att: any, idx: number) => (
                                          <a
                                            key={idx}
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-xs opacity-90 hover:opacity-100"
                                          >
                                            <FileText className="w-3 h-3" />
                                            <span className="truncate underline">{att.name || 'Attachment'}</span>
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Message Input */}
                    <div className="flex-shrink-0 px-4 pb-4 space-y-2">
                      {selectedOrder.payment_status && selectedOrder.payment_status !== 'paid' ? (
                        <div className="rounded-lg border border-yellow-500/50 bg-yellow-900/20 p-4 flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-yellow-300 font-semibold text-sm">Payment Required</p>
                              <p className="text-yellow-400/80 text-xs mt-1">
                                You need to complete payment for this order before you can send messages to our team.
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/checkout?orderId=${selectedOrder.id}`)}
                            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white w-full"
                            size="sm"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Complete Payment — {selectedOrder.price?.toFixed(2)} PLN
                          </Button>
                        </div>
                      ) : (
                        <>
                          {conversationFile && (
                            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg border border-cyan-500/30">
                              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-gray-300 text-xs truncate flex-1">{conversationFile.name}</span>
                              <span className="text-gray-500 text-xs flex-shrink-0">{(conversationFile.size / 1024).toFixed(0)} KB</span>
                              <button onClick={() => setConversationFile(null)} className="text-gray-400 hover:text-red-400">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <label className="flex items-center justify-center w-10 h-10 bg-gray-800 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700 transition-colors flex-shrink-0">
                              <Upload className="w-4 h-4 text-gray-400" />
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    setConversationFile(e.target.files[0]);
                                  }
                                  e.target.value = '';
                                }}
                                disabled={sendingMessage}
                              />
                            </label>
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Type your message..."
                              className="bg-gray-800 border-gray-700 text-white"
                              disabled={sendingMessage}
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={sendingMessage || (!newMessage.trim() && !conversationFile)}
                              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                            >
                              {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a print order to view conversation
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Print Job Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              {detailOrder?.file_name}
            </DialogTitle>
            <DialogDescription>
              Order ID: {detailOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {detailOrder && (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Left Column - 3D Model Preview */}
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 h-[400px] flex items-center justify-center">
                  {detailOrder.file_url ? (
                    <ModelViewerUrl
                      url={detailOrder.file_url}
                      fileName={detailOrder.file_name || 'model.stl'}
                      height="400px"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Package className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>No 3D model preview available</p>
                    </div>
                  )}
                </div>

                {detailOrder.project_name && (
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="font-semibold text-primary">{detailOrder.project_name}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Order Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={detailOrder.status as OrderStatus} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    {detailOrder.payment_status ? (
                      <PaymentStatusBadge status={detailOrder.payment_status as PaymentStatus} />
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <p className="font-semibold">
                    {capitalizeFirst(detailOrder.material)} ({capitalizeFirst(detailOrder.color)})
                  </p>
                </div>

                {detailOrder.quality && (
                  <div>
                    <p className="text-sm text-muted-foreground">Quality</p>
                    <p className="font-semibold capitalize">{detailOrder.quality}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{detailOrder.quantity}</p>
                  </div>
                  {detailOrder.shipping_method && (
                    <div>
                      <p className="text-sm text-muted-foreground">Shipping</p>
                      <p className="font-semibold capitalize">{detailOrder.shipping_method}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(detailOrder.price)}</p>
                  {detailOrder.paid_amount && detailOrder.paid_amount > 0 && (
                    <p className="text-sm text-green-600">
                      Paid: {formatPrice(detailOrder.paid_amount)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(detailOrder.created_at)}</p>
                </div>

                {/* Payment warning + CTA */}
                {detailOrder.payment_status && detailOrder.payment_status !== 'paid' && (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-900/20 p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-300 font-semibold text-sm">Payment Required</p>
                        <p className="text-yellow-400/80 text-xs mt-1">
                          Complete your payment to unlock messaging and proceed with your print job.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => { setDetailOrder(null); navigate(`/checkout?orderId=${detailOrder.id}`); }}
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white w-full"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Payment — {formatPrice(detailOrder.price)}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (detailOrder) {
                  navigator.clipboard.writeText(detailOrder.id);
                  toast.success('Order ID copied');
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy ID
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (detailOrder) {
                  setDetailOrder(null);
                  navigate(`/orders/${detailOrder.id}/edit`);
                }
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Order
            </Button>
            <Button
              onClick={() => {
                if (detailOrder) {
                  setDetailOrder(null);
                  handleSelectOrder(detailOrder);
                }
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintJobs;
