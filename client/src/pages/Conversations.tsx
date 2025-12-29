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
  UserCog,
  Bot,
  Loader2,
  MessageCircle,
  Menu,
  ChevronLeft
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const openConversationId = searchParams.get('open');

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // Check if user is near bottom of scroll area
  const isNearBottom = () => {
    if (!scrollAreaRef.current) return true;
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return true;
    
    const threshold = 100; // pixels from bottom
    const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < threshold;
    return isAtBottom;
  };

  // Scroll to bottom (used for initial load and when user is at bottom)
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
    }, 100);
  };

  // Scroll to bottom when conversation opens (one-time)
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      scrollToBottom('auto'); // Instant scroll on open
      setIsUserScrolledUp(false); // Reset scroll tracking
    }
  }, [selectedConversation?.id, messages.length]);

  // Auto-scroll when new messages arrive, but only if user is near bottom
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolledUp && isNearBottom()) {
      scrollToBottom('smooth');
    }
  }, [messages.length, isUserScrolledUp]);

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
      
      console.log('🔄 USER - Polling conversations (total:', updatedConversations.length, ')');
      
      // Update selectedConversation if it exists to reflect new state
      // Use ref to avoid stale closure issue
      const currentSelectedId = selectedConversationIdRef.current;
      if (currentSelectedId) {
        console.log('🔄 USER - Has selected conversation:', currentSelectedId.slice(0, 8));
        const updatedSelected = updatedConversations.find((c: Conversation) => c.id === currentSelectedId);
        if (updatedSelected) {
          console.log('🔄 USER - Typing status:', { 
            admin_typing: updatedSelected.admin_typing,
            admin_typing_at: updatedSelected.admin_typing_at 
          });
          // Force state update with new object reference
          setSelectedConversation({ ...updatedSelected });
        } else {
          console.log('❌ USER - Selected conversation not found in list');
        }
      } else {
        console.log('⚠️ USER - No conversation selected');
      }
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
      
      // Update conversation unread count locally and mark as read
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unread_count: 0, user_read: true } : c
      ));
      
      // Update selected conversation to mark as read
      setSelectedConversation(prev => prev ? { ...prev, user_read: true } : null);
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
    console.log('✅ USER - Selecting conversation:', conversation.id.slice(0, 8), 'admin_typing:', conversation.admin_typing);
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
      
      // Scroll to show sent message (user expects to see their message)
      setIsUserScrolledUp(false);
      
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

  // Handle scroll detection
  const handleScroll = () => {
    if (isNearBottom()) {
      setIsUserScrolledUp(false); // User is at bottom, enable auto-scroll
    } else {
      setIsUserScrolledUp(true); // User scrolled up, disable auto-scroll
    }
  };

  // Attach scroll listener to scroll area
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [selectedConversation]);

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
        return <UserCog className="w-4 h-4" />;
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

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto h-full">
          {/* Header */}
          <div className="mb-6 animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              {t('conversations.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('conversations.subtitle')}
            </p>
          </div>

          <div className="flex gap-4 md:gap-6 h-[calc(100vh-180px)] md:h-[calc(100vh-220px)] relative">
            {/* Expand Button - visible when sidebar is collapsed */}
            {sidebarCollapsed && (
              <Button
                variant="default"
                size="icon"
                className="absolute left-4 top-4 z-50 shadow-lg rounded-full"
                onClick={() => setSidebarCollapsed(false)}
                title="Expand conversations"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}

            {/* Conversations List */}
            <Card className={cn(
              "w-full md:w-96 flex flex-col flex-shrink-0 shadow-lg border-2 transition-all duration-300 ease-in-out overflow-hidden",
              sidebarCollapsed && "md:-ml-[420px] md:opacity-0 md:pointer-events-none"
            )}>
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-purple-600/5 border-b-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <span className="gradient-text">{t('conversations.listTitle')}</span>
                  </CardTitle>
                  {/* Collapse Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg hover:bg-primary/10"
                    onClick={() => setSidebarCollapsed(true)}
                    title="Collapse conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <MessageCircle className="w-10 h-10 opacity-30" />
                      </div>
                      <p className="font-semibold text-lg mb-1">{t('conversations.noConversations')}</p>
                      <p className="text-sm">{t('conversations.noConversationsHint')}</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => selectConversation(conversation)}
                          className={cn(
                            "p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border-2 group",
                            selectedConversation?.id === conversation.id 
                              ? "bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary shadow-lg scale-[1.02]" 
                              : "bg-card border-transparent hover:border-primary/20 hover:bg-muted/30",
                            conversation.user_read === false && "ring-2 ring-orange-400 bg-orange-50/50 dark:bg-orange-950/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                selectedConversation?.id === conversation.id 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-primary/10 group-hover:bg-primary/20"
                              )}>
                                <Package className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {conversation.user_read === false && (
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                  )}
                                  <span className={cn(
                                    "font-semibold text-sm truncate",
                                    conversation.user_read === false && "text-orange-600 dark:text-orange-400"
                                  )}>
                                    {conversation.order?.project_name || conversation.order?.file_name || t('conversations.unknownOrder')}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(conversation.updated_at)}
                                </span>
                              </div>
                            </div>
                            {(conversation.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs h-6 min-w-[24px] rounded-full font-bold">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            {getStatusBadge(conversation.status)}
                            {conversation.user_read === false && (
                              <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                New
                              </Badge>
                            )}
                          </div>
                          
                          {conversation.last_message && (
                            <p className={cn(
                              "text-xs text-muted-foreground line-clamp-2 pl-12",
                              conversation.user_read === false && "font-medium text-foreground/70"
                            )}>
                              {conversation.last_message.sender_type === 'user' && (
                                <span className="font-semibold">{t('conversations.you')}: </span>
                              )}
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
            <Card className="flex-1 flex flex-col shadow-lg border-2 overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-purple-600/5 border-b-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="lg:hidden rounded-lg"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2 font-bold">
                              {selectedConversation.order?.project_name || selectedConversation.order?.file_name}
                              {selectedConversation.user_read === false && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                              )}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">
                              {t('conversations.orderId')}: {selectedConversation.order_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedConversation.status)}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden bg-muted/20">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="p-4 md:p-6 space-y-6">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-3 animate-fade-in",
                                message.sender_type === 'user' && "flex-row-reverse"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md",
                                message.sender_type === 'user' && "bg-gradient-to-br from-primary to-purple-600 text-white ring-2 ring-primary/20",
                                message.sender_type === 'engineer' && "bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-500/20",
                                message.sender_type === 'system' && "bg-muted text-muted-foreground"
                              )}>
                                {getSenderIcon(message.sender_type)}
                              </div>
                              <div className={cn(
                                "max-w-[75%] md:max-w-[70%] group",
                                message.sender_type === 'system' && "max-w-full mx-auto"
                              )}>
                                <div className={cn(
                                  "rounded-2xl px-4 py-3 shadow-sm",
                                  message.sender_type === 'user' && "bg-gradient-to-br from-primary to-purple-600 text-white rounded-tr-sm",
                                  message.sender_type === 'engineer' && "bg-card border-2 border-blue-200 dark:border-blue-800 rounded-tl-sm",
                                  message.sender_type === 'system' && "bg-muted/50 text-muted-foreground text-center text-sm italic border"
                                )}>
                                  {message.sender_type === 'engineer' && (
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-200 dark:border-blue-800">
                                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <UserCog className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {t('conversations.engineeringSupport')}
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                                </div>
                                <p className={cn(
                                  "text-xs text-muted-foreground mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                  message.sender_type === 'user' && "text-right"
                                )}>
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Admin Typing Indicator */}
                          {selectedConversation.admin_typing && (
                            <div className="flex gap-3 animate-fade-in">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                                <UserCog className="w-5 h-5" />
                              </div>
                              <div className="bg-card border-2 border-blue-200 dark:border-blue-800 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 bg-card border-t-2">
                    <div className="flex gap-3">
                      <Input
                        placeholder={t('conversations.typeMessage')}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={handleKeyPress}
                        disabled={sendingMessage || selectedConversation.status === 'closed'}
                        className="flex-1 h-11 rounded-xl border-2 focus-visible:ring-primary"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage || selectedConversation.status === 'closed'}
                        className="h-11 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                        size="lg"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    {selectedConversation.status === 'closed' && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {t('conversations.conversationClosed')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div className="max-w-md">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 mx-auto mb-6 flex items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 gradient-text">{t('conversations.selectConversation')}</h3>
                    <p className="text-muted-foreground">
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
