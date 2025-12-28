import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Search,
  ExternalLink,
  Loader2,
  CheckCheck,
  User,
  Bot,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Conversation {
  id: string;
  order_id: string;
  user_id: string;
  subject?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  admin_read?: boolean;
  user_typing?: boolean;
  user_typing_at?: string;
  unread_count: number;
  orders: {
    id: string;
    file_name: string;
    project_name?: string;
    status: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'engineer' | 'system';
  sender_id?: string;
  message: string;
  attachments: any[];
  is_read: boolean;
  created_at: string;
}

export default function AdminConversations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  useEffect(() => {
    fetchConversations();
    
    // Poll more frequently for real-time feel (every 2 seconds)
    const interval = setInterval(() => {
      fetchConversations();
      // Fetch messages for currently selected conversation
      if (selectedConversationIdRef.current) {
        fetchMessages(selectedConversationIdRef.current);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array so polling never restarts

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedConversations = data.conversations || [];
        setConversations(updatedConversations);
        
        // Update selectedConversation if it exists to reflect new state (typing, unread, etc.)
        if (selectedConversation) {
          const updatedSelected = updatedConversations.find((c: Conversation) => c.id === selectedConversation.id);
          if (updatedSelected) {
            setSelectedConversation(updatedSelected);
          }
        }
      } else {
        toast.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/admin/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Update local unread count and admin_read status
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0, admin_read: true } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!selectedConversation) return;
    
    console.log('🔵 ADMIN TYPING - Sending to API:', { 
      conversationId: selectedConversation.id, 
      isTyping,
      url: `${API_URL}/admin/conversations/${selectedConversation.id}/typing`
    });
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/conversations/${selectedConversation.id}/typing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isTyping })
      });
      
      const result = await response.json();
      console.log('🔵 ADMIN TYPING - API Response:', result);
      
      if (!response.ok) {
        console.error('🔴 ADMIN TYPING - API Error:', result);
      }
    } catch (error) {
      console.error('🔴 ADMIN TYPING - Request failed:', error);
    }
  };

  const handleTyping = () => {
    // Send typing indicator
    updateTypingStatus(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing status after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    // Clear typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingStatus(false);

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/admin/conversations/${selectedConversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
        toast.success('Message sent');        
        // Update conversation's updated_at and keep admin_read true
        if (selectedConversation) {
          setConversations(prev => prev.map(c => 
            c.id === selectedConversation.id 
              ? { ...c, updated_at: new Date().toISOString(), admin_read: true }
              : c
          ));
        }      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (conversationId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/admin/conversations/${conversationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success('Status updated');
        fetchConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => prev ? { ...prev, status: newStatus as any } : null);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!conv) return false;
    
    const matchesSearch = 
      (conv.users?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (conv.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (conv.orders?.file_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Support Messages</h1>
              <p className="text-muted-foreground mt-1">
                Manage customer conversations and support requests
              </p>
            </div>
            <Button onClick={() => navigate('/admin')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-96 border-r bg-white flex flex-col">
            <div className="p-4 border-b space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations found
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : conv.admin_read === false
                          ? 'bg-orange-50 hover:bg-orange-100 border-2 border-orange-400 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {conv.admin_read === false && (
                              <MessageCircle className="w-4 h-4 text-orange-500 animate-pulse" />
                            )}
                            <h3 className={`font-bold text-base ${
                              conv.admin_read === false ? 'text-orange-700' : 'text-gray-900'
                            }`}>
                              {conv.orders?.project_name || conv.orders?.file_name || 'Untitled Print Job'}
                            </h3>
                            {conv.admin_read === false && (
                              <Badge variant="default" className="bg-orange-500 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${
                            conv.admin_read === false ? 'text-orange-600 font-semibold' : 'text-muted-foreground'
                          }`}>
                            👤 {conv.users?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            ✉️ {conv.users?.email || 'No email'}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="ml-2 h-6 min-w-[24px] flex items-center justify-center">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getStatusColor(conv.status)} text-white text-xs`}>
                          {conv.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Messages Panel */}
          <div className={cn(
            "flex-1 flex flex-col bg-white rounded-lg transition-all duration-300",
            selectedConversation?.admin_read === false && "ring-2 ring-orange-400 shadow-lg shadow-orange-100"
          )}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className={cn(
                  "p-4 border-b flex items-center justify-between transition-colors",
                  selectedConversation.admin_read === false && "bg-orange-50 border-orange-200"
                )}>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {selectedConversation.admin_read === false && (
                        <MessageCircle className="w-5 h-5 text-orange-500 animate-pulse" />
                      )}
                      {selectedConversation.users?.name || 'Unknown User'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.subject || 'Support Conversation'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/orders/${selectedConversation.order_id}`)}
                        className="h-6 px-2"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Order
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation.admin_read === false && (
                      <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                        New Message
                      </Badge>
                    )}
                    <Select
                      value={selectedConversation.status}
                      onValueChange={(value) => handleUpdateStatus(selectedConversation.id, value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <Badge className={`${getStatusColor(selectedConversation.status)} text-white border-0`}>
                          {selectedConversation.status.replace('_', ' ')}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_type === 'engineer' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            msg.sender_type === 'engineer'
                              ? 'bg-primary text-primary-foreground'
                              : msg.sender_type === 'system'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-gray-100 text-gray-900'
                          } rounded-lg p-3`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.sender_type === 'user' && <User className="w-3 h-3" />}
                            {msg.sender_type === 'engineer' && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                            {msg.sender_type === 'system' && <Bot className="w-3 h-3" />}
                            <span className="text-xs opacity-70">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.is_read && msg.sender_type === 'engineer' && (
                            <div className="flex justify-end mt-1">
                              <CheckCheck className="w-3 h-3 opacity-70" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {selectedConversation.user_typing && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-100 rounded-lg rounded-tl-sm px-4 py-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      className="min-h-[60px] resize-none"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="self-end"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
