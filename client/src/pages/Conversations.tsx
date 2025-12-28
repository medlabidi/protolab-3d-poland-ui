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
  user_read?: boolean;
  admin_typing?: boolean;
  admin_typing_at?: string;
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openConversationId = searchParams.get('open');

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // Scroll to bottom when conversation opens or messages load
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    fetchConversations();
    
    // Poll more frequently for real-time feel (every 2 seconds)
    const interval = setInterval(() => {
      fetchConversations();
      // Fetch messages for currently selected conversation
      if (selectedConversationIdRef.current) {
        fetchMessages(selectedConversationIdRef.current, false); // Don't show loading during polling
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array so polling never restarts

  // Auto-open conversation from URL parameter
  useEffect(() => {
    if (openConversationId && conversations.length > 0 && !selectedConversation) {
      const conversationToOpen = conversations.find(c => c.id === openConversationId);
      if (conversationToOpen) {
        selectConversation(conversationToOpen);
      }
    }
  }, [openConversationId, conversations]);

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
      const updatedConversations = data.conversations || [];
      setConversations(updatedConversations);
      
      // Update selectedConversation if it exists to reflect new state
      if (selectedConversation) {
        const updatedSelected = updatedConversations.find((c: Conversation) => c.id === selectedConversation.id);
        if (updatedSelected) {
          console.log('[Conversations] Updating selected conversation, user_read:', updatedSelected.user_read);
          console.log('[Conversations] admin_typing:', updatedSelected.admin_typing, 'admin_typing_at:', updatedSelected.admin_typing_at);
          console.log('[Conversations] Updated conversation data:', updatedSelected);
          setSelectedConversation(updatedSelected);
        }
      }
      
      // Log all conversations with their read status
      console.log('[Conversations] All conversations:', updatedConversations.map((c: Conversation) => ({
        id: c.id.slice(0, 8),
        order: c.order?.file_name,
        user_read: c.user_read,
        admin_typing: c.admin_typing,
        updated_at: c.updated_at
      })));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, showLoading: boolean = true) => {
    if (showLoading) {
      setLoadingMessages(true);
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages || []);
      
      // Update conversation unread count locally
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (showLoading) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    
    // Mark conversation as read for user
    if (conversation.user_read === false) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`${API_URL}/conversations/${conversation.id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Update local state
        setConversations(prev => prev.map(c => 
          c.id === conversation.id ? { ...c, user_read: true } : c
        ));
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!selectedConversation) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/conversations/${selectedConversation.id}/typing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isTyping })
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Clear typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingStatus(false);

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
      setMessages(prev => [...prev, data.message]);
      setNewMessage("");
      
      // Update conversation's last message, updated_at, and mark as user_read=true (we just sent it)
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: data.message, updated_at: new Date().toISOString(), user_read: true }
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

          <div className="flex gap-6 h-[calc(100vh-220px)]">
            {/* Conversations List */}
            <Card className="w-96 flex flex-col flex-shrink-0 border">
              <CardHeader className="pb-3 border-b">
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
                            "p-4 rounded-lg cursor-pointer transition-all hover:bg-muted/50 relative",
                            selectedConversation?.id === conversation.id && "bg-primary/10 border-2 border-primary/20",
                            conversation.user_read === false && "bg-orange-50 border-2 border-orange-400 shadow-md"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              {conversation.user_read === false && (
                                <MessageCircle className="w-4 h-4 text-orange-500 animate-pulse" />
                              )}
                              <span className={cn(
                                "font-medium text-sm truncate max-w-[150px]",
                                conversation.user_read === false && "font-extrabold text-orange-600"
                              )}>
                                {conversation.order?.project_name || conversation.order?.file_name || t('conversations.unknownOrder')}
                              </span>
                              {conversation.user_read === false && (
                                <Badge variant="default" className="bg-orange-500 text-xs">
                                  New
                                </Badge>
                              )}
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
                            <p className={cn(
                              "text-xs text-muted-foreground mt-2 truncate",
                              conversation.user_read === false && "font-semibold text-blue-300"
                            )}>
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
            <Card className={cn(
              "flex-1 flex flex-col transition-all duration-300 border",
              selectedConversation?.user_read === false && "ring-2 ring-orange-400 shadow-lg shadow-orange-100"
            )}>
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className={cn(
                    "pb-3 border-b transition-colors",
                    selectedConversation.user_read === false && "bg-orange-50 border-orange-200"
                  )}>
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
                            {selectedConversation.user_read === false && (
                              <MessageCircle className="w-4 h-4 text-orange-500 animate-pulse" />
                            )}
                            {selectedConversation.order?.project_name || selectedConversation.order?.file_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('conversations.orderId')}: {selectedConversation.order_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedConversation.status)}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ScrollArea className="h-full p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-3",
                                message.sender_type === 'user' && "flex-row-reverse"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                message.sender_type === 'user' && "bg-primary text-primary-foreground",
                                message.sender_type === 'engineer' && "bg-blue-500 text-white",
                                message.sender_type === 'system' && "bg-muted text-muted-foreground"
                              )}>
                                {getSenderIcon(message.sender_type)}
                              </div>
                              <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                message.sender_type === 'user' && "bg-primary text-primary-foreground rounded-tr-sm",
                                message.sender_type === 'engineer' && "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-tl-sm",
                                message.sender_type === 'system' && "bg-muted text-muted-foreground text-center mx-auto text-sm italic"
                              )}>
                                {message.sender_type === 'engineer' && (
                                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                    {t('conversations.engineeringSupport')}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                <p className={cn(
                                  "text-xs mt-1 opacity-70",
                                  message.sender_type === 'user' && "text-right"
                                )}>
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Admin Typing Indicator - Shows as a message */}
                          {(() => {
                            const isTyping = selectedConversation.admin_typing;
                            console.log('[Typing Indicator Render] admin_typing:', isTyping, 'will show:', !!isTyping);
                            return isTyping && (
                              <div className="flex gap-3 animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                                  <Headphones className="w-4 h-4" />
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl rounded-tl-sm px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          <div ref={messagesEndRef} />
                          
                          {/* Message Input - Now inside ScrollArea */}
                          <div className="pt-4 mt-4 border-t">
                            <div className="flex gap-2">
                              <Input
                                placeholder={t('conversations.typeMessage')}
                                value={newMessage}
                                onChange={(e) => {
                                  setNewMessage(e.target.value);
                                  handleTyping();
                                }}
                                onKeyPress={handleKeyPress}
                                disabled={sendingMessage || selectedConversation.status === 'closed'}
                                className="flex-1"
                              />
                              <Button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sendingMessage || selectedConversation.status === 'closed'}
                              >
                                {sendingMessage ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            {selectedConversation.status === 'closed' && (
                              <p className="text-xs text-muted-foreground mt-2 text-center">
                                {t('conversations.conversationClosed')}
                              </p>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
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
