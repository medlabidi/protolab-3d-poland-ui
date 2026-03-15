import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Package,
  MessageSquare,
  Info,
  Download,
  Loader2,
  AlertCircle,
  Printer,
  FileText,
  Upload,
  X,
} from "lucide-react";
import NewPrintCreate from "./NewPrintCreate";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { API_URL } from "@/config/api";
import { ModelViewerModal } from "@/components/ModelViewerModal";
import { Attachment } from "@/types/attachment";
import { is3DFile } from "@/utils/fileHelpers";
import { ModelPreviewCard } from "@/components/ModelPreviewCard";

interface PrintOrder {
  id: string;
  file_name: string;
  material: string;
  color: string;
  quality: string;
  quantity: number;
  price: number;
  status: 'pending' | 'confirmed' | 'printing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at?: string;
  estimated_print_time?: number;
  estimated_weight?: number;
  shipping_method?: string;
  shipping_address?: any;
  model_file_url?: string;
  support_type?: string;
  infill_pattern?: string;
  layer_height?: string;
  infill?: string;
  advanced_mode?: boolean;
}

interface Message {
  id: string;
  sender_type: 'user' | 'admin' | 'system';
  message: string;
  attachments?: any[];
  created_at: string;
  is_read: boolean;
}

const PrintJobs = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // 3D Model Viewer state
  const [modelViewerModal, setModelViewerModal] = useState<{
    open: boolean;
    attachment: Attachment | null;
  }>({ open: false, attachment: null });

  // New print form state
  const [formData, setFormData] = useState({
    projectName: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true" && !!localStorage.getItem("accessToken");
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      toast.error("Please log in to access Print Jobs");
      navigate("/login");
      return;
    }

    fetchPrintOrders();
  }, [navigate]);

  const fetchPrintOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/orders/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }
        setPrintOrders(data.orders || []);

        // Auto-select first order if exists
        if (data.orders && data.orders.length > 0) {
          handleSelectOrder(data.orders[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching print orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = async (order: PrintOrder) => {
    setSelectedOrder(order);

    // Fetch conversation for this order
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/conversations/order/${order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }
        setConversationId(data.conversation?.id || null);
        setMessages(data.messages || []);
      } else if (response.status === 404) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setConversationId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!selectedOrder) {
      toast.error("Please select a print order first");
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const convResponse = await fetch(`${API_URL}/conversations/order/${selectedOrder.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (convResponse.ok) {
          let convData;
          try {
            const text = await convResponse.text();
            convData = text ? JSON.parse(text) : {};
          } catch (e) {
            convData = {};
          }
          currentConversationId = convData.conversation?.id || null;
          setConversationId(currentConversationId);
        }

        if (!currentConversationId) {
          toast.error("Failed to create conversation");
          return;
        }
      }

      const response = await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        toast.success("Message sent");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownload = async () => {
    if (!modelViewerModal.attachment) return;

    try {
      const attachment = modelViewerModal.attachment;
      let downloadUrl = attachment.url;

      if (attachment.url.startsWith("s3://")) {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${API_URL}/files/signed-url?fileUrl=${encodeURIComponent(attachment.url)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          downloadUrl = data.signedUrl;
        } else {
          throw new Error("Failed to get download URL");
        }
      } else if (!attachment.url.startsWith("http")) {
        const baseUrl = API_URL.replace("/api", "");
        const path = attachment.url.startsWith("/") ? attachment.url : `/${attachment.url}`;
        downloadUrl = `${baseUrl}${path}`;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = attachment.name || "model.stl";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${attachment.name}`);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error(error.message || "Failed to download file");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "confirmed":
        return "bg-blue-500/20 text-blue-500";
      case "printing":
        return "bg-purple-500/20 text-purple-500";
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400 border-green-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500";
      case "refunded":
        return "bg-blue-500/20 text-blue-400 border-blue-500";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const [showCreatePrintModal, setShowCreatePrintModal] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: "rgb(3 7 18 / var(--tw-bg-opacity, 1))" }}>
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </main>
      </div>
    );
  }

  // Empty state - No print orders yet
  if (printOrders.length === 0) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: "rgb(3 7 18 / var(--tw-bg-opacity, 1))" }}>
        <DashboardSidebar />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Printer className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                My Print Jobs
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Track and manage your 3D print orders</p>
            </div>

            {/* Empty State Card */}
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
              <CardContent className="pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16 text-center px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-500/20 mb-4 sm:mb-6">
                  <Printer className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                  No Print Jobs Yet
                </h2>
                <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                  Start your first 3D print job by uploading your model and selecting your preferred material and quality settings.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/new-print-create")}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Print Job
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
    <div className="flex min-h-screen" style={{ backgroundColor: "rgb(3 7 18 / var(--tw-bg-opacity, 1))" }}>
      <DashboardSidebar />

      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header with Create Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Printer className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                My Print Jobs
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Track and manage your 3D printing projects</p>
            </div>
            <Button
              onClick={() => navigate("/new-print-create")}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              New Print Job
            </Button>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
            {/* Left Column - Order List */}
            <Card className="bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  Print Orders ({printOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Orders List - Scrollable */}
                <ScrollArea className="h-[400px] px-4">
                  <div className="space-y-3 pt-4">
                    {printOrders.map((order) => (
                      <Card
                        key={order.id}
                        className={`transition-all cursor-pointer ${
                          selectedOrder?.id === order.id
                            ? "bg-cyan-900/30 border-cyan-500"
                            : "bg-gray-800 border-gray-700 hover:border-cyan-500/50"
                        }`}
                      >
                        <CardContent
                          className="p-4"
                          onClick={() => handleSelectOrder(order)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-white font-semibold truncate flex-1">
                              {order.file_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            {order.material.toUpperCase()} - {order.quality}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{formatDate(order.created_at)}</span>
                            <span className="text-cyan-400 font-semibold">{order.price} PLN</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Column - Order Details */}
            <Card className="bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Order Details & Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0 gap-4">
                {selectedOrder ? (
                  <>
                    {/* Order Summary */}
                    <div className="px-4 pt-4 space-y-3">
                      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold text-sm">{selectedOrder.file_name}</h3>
                            <Badge className={getStatusColor(selectedOrder.status)}>
                              {selectedOrder.status}
                            </Badge>
                          </div>
                          <Badge className={`mt-0 ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                            Payment: {selectedOrder.payment_status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Material:</span>{" "}
                            <span className="text-gray-300 uppercase">{selectedOrder.material}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Color:</span>{" "}
                            <span className="text-gray-300 capitalize">{selectedOrder.color}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Quality:</span>{" "}
                            <span className="text-gray-300 capitalize">{selectedOrder.quality}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantity:</span>{" "}
                            <span className="text-gray-300">{selectedOrder.quantity}</span>
                          </div>
                          {selectedOrder.estimated_print_time && (
                            <div>
                              <span className="text-gray-500">Print Time:</span>{" "}
                              <span className="text-gray-300">{selectedOrder.estimated_print_time}h</span>
                            </div>
                          )}
                          {selectedOrder.estimated_weight && (
                            <div>
                              <span className="text-gray-500">Weight:</span>{" "}
                              <span className="text-gray-300">{selectedOrder.estimated_weight}g</span>
                            </div>
                          )}
                          <div className="col-span-2">
                            <span className="text-gray-500">Price:</span>{" "}
                            <span className="text-cyan-400 font-semibold">{selectedOrder.price} PLN</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="h-[250px] pr-4 px-4">
                      <div className="space-y-4 pb-4 pt-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No messages yet. Start a conversation!
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`flex items-start gap-2 max-w-[85%] ${
                                  msg.sender_type === "user" ? "flex-row-reverse" : "flex-row"
                                }`}
                              >
                                {/* Avatar */}
                                <div
                                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    msg.sender_type === "user"
                                      ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white"
                                      : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                                  }`}
                                >
                                  {msg.sender_type === "user" ? "Y" : "A"}
                                </div>

                                {/* Message Content */}
                                <div className="flex flex-col gap-1 flex-1">
                                  {/* Sender Label */}
                                  <span
                                    className={`text-xs font-semibold ${
                                      msg.sender_type === "user"
                                        ? "text-cyan-400 text-right"
                                        : "text-purple-400 text-left"
                                    }`}
                                  >
                                    {msg.sender_type === "user" ? "You" : "Admin"}
                                  </span>

                                  <div
                                    className={`rounded-lg p-2 text-sm ${
                                      msg.sender_type === "user"
                                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                                        : "bg-gray-800 text-gray-200 border border-gray-700"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                                      <span>
                                        {new Date(msg.created_at).toLocaleDateString("en-US", {
                                          day: "2-digit",
                                          month: "short",
                                        })}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {new Date(msg.created_at).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex gap-2 flex-shrink-0 px-4 pb-4">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type a message..."
                        className="bg-gray-800 border-gray-700 text-white text-sm"
                        disabled={sendingMessage}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-4"
                        size="sm"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a print order to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Print Modal */}
        <Dialog open={showCreatePrintModal} onOpenChange={setShowCreatePrintModal}>
          <DialogContent className="max-w-5xl w-full h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-gray-900 border-gray-800">
            <NewPrintCreate onClose={() => setShowCreatePrintModal(false)} />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PrintJobs;