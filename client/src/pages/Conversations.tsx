import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Headphones,
  Bot,
  Loader2,
  MessageCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  file_name: string;
  project_name?: string;
  status: string;
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

interface Conversation {
  id: string;
  order_id: string;
  user_id: string;
  subject?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  order?: Order;
  unread_count?: number;
  last_message?: Message;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Conversations = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openConversationId = searchParams.get('open');

  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-open conversation from URL parameter
  useEffect(() => {
    if (openConversationId && conversations.length > 0 && !selectedConversation) {
      const conversationToOpen = conversations.find(c => c.id === openConversationId);
      if (conversationToOpen) {
        selectConversation(conversationToOpen);
      }
    }
  }, [openConversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      console.log('💬 Conversations récupérées:', data.conversations?.length || 0);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      console.log('📨 Messages récupérés:', data.messages?.length || 0, 'messages');
      console.log('📋 Contenu:', data.messages);
      setMessages(data.messages || []);
      
      // Update conversation unread count locally
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      console.log('✉️ Message envoyé:', data.message);
      setMessages(prev => [...prev, data.message]);
      setNewMessage("");
      
      // Update conversation's last message and updated_at
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: data.message, updated_at: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      open: { labelKey: "conversations.status.open", variant: "secondary", icon: AlertCircle },
      in_progress: { labelKey: "conversations.status.inProgress", variant: "default", icon: Clock },
      resolved: { labelKey: "conversations.status.resolved", variant: "outline", icon: CheckCircle },
      closed: { labelKey: "conversations.status.closed", variant: "outline", icon: CheckCircle }
    };
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {t(config.labelKey)}
      </Badge>
    );
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'engineer':
        return <Headphones className="w-4 h-4" />;
      case 'system':
        return <Bot className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('conversations.yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-4xl font-bold mb-2 gradient-text">{t('conversations.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('conversations.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {t('conversations.listTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">{t('conversations.noConversations')}</p>
                      <p className="text-sm mt-1">{t('conversations.noConversationsHint')}</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => selectConversation(conversation)}
                          className={cn(
                            "p-4 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            selectedConversation?.id === conversation.id && "bg-primary/10 border border-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm truncate max-w-[150px]">
                                {conversation.order?.project_name || conversation.order?.file_name || t('conversations.unknownOrder')}
                              </span>
                            </div>
                            {(conversation.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {getStatusBadge(conversation.status)}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.updated_at)}
                            </span>
                          </div>
                          
                          {conversation.last_message && (
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              {conversation.last_message.sender_type === 'user' ? t('conversations.you') + ': ' : ''}
                              {conversation.last_message.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages Panel */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="lg:hidden"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            {selectedConversation.order?.project_name || selectedConversation.order?.file_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('conversations.orderId')}: {selectedConversation.order_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(selectedConversation.status)}
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Chargement des messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-medium">Aucun message</p>
                        <p className="text-sm text-muted-foreground/70 mt-2">Commencez la conversation en envoyant un message</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-full p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-3 animate-fade-in",
                                message.sender_type === 'user' && "flex-row-reverse"
                              )}
                            >
                              {/* Avatar */}
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                message.sender_type === 'user' && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                                message.sender_type === 'engineer' && "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
                                message.sender_type === 'system' && "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                              )}>
                                {getSenderIcon(message.sender_type)}
                              </div>
                              
                              {/* Message Bubble */}
                              <div className="flex flex-col max-w-[70%] gap-1">
                                {/* Sender Label */}
                                {message.sender_type !== 'user' && (
                                  <span className={cn(
                                    "text-xs font-semibold px-2",
                                    message.sender_type === 'engineer' && "text-blue-600 dark:text-blue-400",
                                    message.sender_type === 'system' && "text-gray-600 dark:text-gray-400"
                                  )}>
                                    {message.sender_type === 'engineer' ? t('conversations.engineeringSupport') : 'Système'}
                                  </span>
                                )}
                                
                                {/* Message Content */}
                                <div className={cn(
                                  "rounded-2xl px-4 py-3 shadow-sm",
                                  message.sender_type === 'user' && "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md",
                                  message.sender_type === 'engineer' && "bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-tl-md",
                                  message.sender_type === 'system' && "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center italic"
                                )}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {message.message}
                                  </p>
                                </div>
                                
                                {/* Timestamp */}
                                <span className={cn(
                                  "text-xs text-muted-foreground px-2",
                                  message.sender_type === 'user' && "text-right"
                                )}>
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-muted/30">
                    {selectedConversation.status === 'closed' ? (
                      <div className="text-center py-3">
                        <p className="text-sm text-muted-foreground">
                          🔒 {t('conversations.conversationClosed')}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            placeholder="💬 Écrivez votre message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={sendingMessage}
                            className="flex-1 bg-background"
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className="px-6"
                          >
                            {sendingMessage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Envoyer
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Appuyez sur Entrée pour envoyer
                        </p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('conversations.selectConversation')}</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      {t('conversations.selectConversationHint')}
                    </p>
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

export default Conversations;
