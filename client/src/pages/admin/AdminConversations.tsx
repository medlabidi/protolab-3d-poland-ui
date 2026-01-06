import { useState, useEffect, useRef } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Clock,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ConversationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ConversationOrder {
  id: string;
  file_name: string;
  status: string;
  price: number;
  created_at: string;
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
  sender?: ConversationUser;
}

interface Conversation {
  id: string;
  order_id: string;
  user_id: string;
  subject?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: Message;
  user?: ConversationUser;
  order?: ConversationOrder;
}

const AdminConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
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
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${API_URL}/admin/conversations?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data.conversations || []);

      // Auto-mark as read
      if (selectedConversation && data.conversations) {
        const updated = data.conversations.find((c: Conversation) => c.id === selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API_URL}/admin/conversations/${conversationId}/messages`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages || []);

      // Mark as read
      await markAsRead(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/admin/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
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

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setMessages([...messages, data.message]);
      setNewMessage("");
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateStatus = async (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedConversation) return;

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API_URL}/admin/conversations/${selectedConversation.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();
      setSelectedConversation(data.conversation);
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500/20 text-red-700 border-red-500/50';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'resolved': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'closed': return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'on_hold':
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Conversations</h1>
            <p className="text-gray-400">Manage customer conversations and support messages</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            {/* Conversations List */}
            <Card className="lg:col-span-1 bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Search and Filter */}
                <div className="p-4 space-y-3 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "capitalize",
                          statusFilter === s
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "border-gray-700 text-gray-400 hover:bg-gray-800"
                        )}
                      >
                        {s === 'all' ? 'All' : s.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Conversations Scroll */}
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations found</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-4">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all",
                            selectedConversation?.id === conversation.id
                              ? "bg-blue-600/20 border border-blue-500"
                              : "hover:bg-gray-800 border border-transparent"
                          )}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-white text-sm truncate">
                              {conversation.user?.name || 'Unknown'}
                            </p>
                            {conversation.unread_count ? (
                              <Badge variant="default" className="bg-red-500">
                                {conversation.unread_count}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-400 truncate mb-2">
                            {conversation.user?.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate mb-2">
                            {conversation.last_message?.message || 'No messages yet'}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge className={cn("text-xs capitalize", getStatusColor(conversation.status))}>
                              {conversation.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {formatDate(conversation.updated_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="lg:col-span-2 bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className="border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-white mb-2">
                          {selectedConversation.user?.name}
                        </CardTitle>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-400">
                            {selectedConversation.user?.email}
                          </span>
                          {selectedConversation.order && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Package className="w-4 h-4" />
                              {selectedConversation.order.file_name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status selector */}
                      <div className="flex gap-2">
                        {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={selectedConversation.status === s ? 'default' : 'outline'}
                            onClick={() => updateStatus(s)}
                            className={cn(
                              "capitalize text-xs",
                              selectedConversation.status === s
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "border-gray-700 text-gray-400 hover:bg-gray-800"
                            )}
                          >
                            {s.replace('_', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              message.sender_type === 'user' ? 'justify-start' : 'justify-end'
                            )}
                          >
                            {message.sender_type === 'user' && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}

                            <div
                              className={cn(
                                "max-w-xs lg:max-w-md rounded-lg p-3 break-words",
                                message.sender_type === 'user'
                                  ? 'bg-gray-800 text-gray-100'
                                  : 'bg-blue-600 text-white'
                              )}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {formatDate(message.created_at)}
                              </p>
                            </div>

                            {message.sender_type === 'engineer' && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t border-gray-800 p-4 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Type your reply..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sendingMessage}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                      <Button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminConversations;
