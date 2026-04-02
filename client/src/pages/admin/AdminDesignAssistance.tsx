import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { Eye, Palette, Download, Search, Loader2, MessageSquare, Info, Upload, X, Package, Bot, FileText, AlertCircle, Sparkles, Check, RotateCcw, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import { OpenSCADEditor } from "@/components/OpenSCADEditor/OpenSCADEditor";
import { OrderTimeline } from "@/components/OrderTimeline";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  user_id: string;
  project_name: string;
  idea_description: string;
  usage_type?: 'mechanical' | 'decorative' | 'functional' | 'prototype' | 'other';
  usage_details?: string;
  approximate_dimensions?: string;
  desired_material?: string;
  attached_files?: any[];
  reference_images?: any[];
  request_chat?: boolean;
  design_status: 'pending' | 'in_review' | 'in_progress' | 'completed' | 'approved' | 'cancelled';
  admin_design_file?: string;
  admin_notes?: string;
  user_approval_status?: 'pending' | 'approved' | 'rejected';
  user_approval_at?: string;
  user_rejection_reason?: string;
  estimated_price?: number;
  final_price?: number;
  paid_amount?: number;
  payment_status?: 'pending' | 'paid' | 'on_hold' | 'refunded';
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  user_email?: string;
  users?: { name: string; email: string };
}

const AdminDesignAssistance = () => {
  const navigate = useNavigate();
  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRequestForConversation, setSelectedRequestForConversation] = useState<Order | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [fileAccessType, setFileAccessType] = useState<'paid' | 'preview_only' | null>(null);
  const [filePrice, setFilePrice] = useState<string>('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState<Order | null>(null);
  const [generationJob, setGenerationJob] = useState<any>(null);
  const [generatingTripo, setGeneratingTripo] = useState(false);
  const [generatingOpenSCAD, setGeneratingOpenSCAD] = useState(false);
  
  const conversationRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  // Smart auto-scroll: only scroll when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      setTimeout(() => {
        const viewport = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedRequestForConversation) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/conversations/design-request/${selectedRequestForConversation.id}`, {
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
  }, [selectedRequestForConversation?.id]);

  // Fetch generation jobs for current conversation and poll active ones
  useEffect(() => {
    if (!conversationId) {
      setGenerationJob(null);
      return;
    }

    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/admin/generate-3d/conversation/${conversationId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const latestJob = data.jobs?.[0] || null;
          setGenerationJob(latestJob);

          // If job is active, poll for status updates
          if (latestJob && ['pending', 'generating', 'processing'].includes(latestJob.status)) {
            pollGenerationJob(latestJob.id);
          }
        }
      } catch (e) { /* silent */ }
    };

    fetchJobs();
  }, [conversationId]);

  const pollGenerationJob = (jobId: string) => {
    const poll = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/admin/generate-3d/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setGenerationJob(data.job);
          // Keep polling if still in progress
          if (['pending', 'generating', 'processing'].includes(data.job?.status)) {
            setTimeout(poll, 5000);
          }
        }
      } catch (e) { /* silent */ }
    };
    setTimeout(poll, 5000);
  };

  const handleTriggerGeneration = async (prompt: string) => {
    if (!conversationId || !selectedRequestForConversation) return;
    setGeneratingTripo(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/generate-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          conversationId,
          orderId: selectedRequestForConversation.id,
          prompt,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGenerationJob({ id: data.jobId, status: 'pending' });
        pollGenerationJob(data.jobId);
        toast.success('3D generation started');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to start generation');
      }
    } catch (e) {
      toast.error('Failed to start generation');
    } finally {
      setGeneratingTripo(false);
    }
  };

  const handleApproveGeneration = async (jobId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/generate-3d/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGenerationJob(data.job);
        toast.success('Model approved and sent to client');
      } else {
        toast.error('Failed to approve model');
      }
    } catch (e) {
      toast.error('Failed to approve model');
    }
  };

  const handleRejectGeneration = async (jobId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/generate-3d/${jobId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGenerationJob(data.job);
        toast.success('Model rejected');
      } else {
        toast.error('Failed to reject model');
      }
    } catch (e) {
      toast.error('Failed to reject model');
    }
  };

  // --- OpenSCAD CAD generation handlers ---
  const handleTriggerOpenSCAD = async (prompt: string) => {
    if (!conversationId || !selectedRequestForConversation) return;
    setGeneratingOpenSCAD(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/generate-openscad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          conversationId,
          orderId: selectedRequestForConversation.id,
          prompt,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGenerationJob({
          id: data.jobId,
          status: 'code_ready',
          generation_type: 'openscad',
          openscad_code: data.code,
          parameters: data.parameters,
        });
        toast.success('CAD code generated');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to generate CAD');
      }
    } catch (e) {
      toast.error('Failed to generate CAD');
    } finally {
      setGeneratingOpenSCAD(false);
    }
  };

  const handleUploadSTL = async (stlData: Uint8Array) => {
    if (!generationJob?.id) return;
    try {
      const token = localStorage.getItem('accessToken');
      // Convert to base64 for JSON transport (chunk to avoid call stack overflow)
      let binary = '';
      const bytes = stlData;
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const response = await fetch(`${API_URL}/admin/generate-openscad/${generationJob.id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ stlBase64: base64 }),
      });
      if (response.ok) {
        const data = await response.json();
        setGenerationJob(data.job);
        toast.success('STL uploaded — ready for approval');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to upload STL');
      }
    } catch (e) {
      toast.error('Failed to upload STL');
    }
  };

  // Poll for new/updated design requests every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await fetch(`${API_URL}/admin/design-requests`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const newOrders = data.designRequests || [];
          setOrders(newOrders);
          // Update selectedRequestForConversation with fresh data
          if (selectedRequestForConversation) {
            const updated = newOrders.find((r: any) => r.id === selectedRequestForConversation.id);
            if (updated) {
              setSelectedRequestForConversation(updated);
            }
          }
        }
      } catch (e) {
        // Silent fail on polling
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedRequestForConversation?.id]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching design requests from:', `${API_URL}/admin/design-requests`);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}/admin/design-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Design requests data:', data);
        // The new endpoint returns design requests directly
        setOrders(data.designRequests || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        toast.error(`Failed to fetch design assistance orders: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching design assistance orders:', error);
      toast.error('Error loading design assistance orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/design-requests/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, design_status: newStatus as any });
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingOrderDetails(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/design-requests/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch design request details');
      }

      const data = await response.json();
      setSelectedOrder(data.request);
      setShowOrderDetails(true);
    } catch (err) {
      console.error('Error fetching design request details:', err);
      toast.error('Failed to load design request details');
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const handleSelectRequestForConversation = async (request: Order, shouldScroll: boolean = false) => {
    setSelectedRequestForConversation(request);
    
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Loading conversation for design request:', request.id);
      
      const response = await fetch(`${API_URL}/conversations/design-request/${request.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation loaded:', data.conversation?.id, 'Messages:', data.messages?.length || 0);
        setConversationId(data.conversation?.id || null);
        setMessages(data.messages || []);
        
        // Scroll to conversation if requested (for Eye button clicks)
        if (shouldScroll) {
          setTimeout(() => {
            conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } else if (response.status === 404) {
        // Conversation doesn't exist yet, initialize empty
        console.log('No conversation found for design request:', request.id);
        setConversationId(null);
        setMessages([]);
        
        // Scroll to conversation if requested (for Eye button clicks)
        if (shouldScroll) {
          setTimeout(() => {
            conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Failed to fetch conversation:', response.status, errorText);
        setConversationId(null);
        setMessages([]);
        toast.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setConversationId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) {
      toast.error('Please enter a message or attach a file');
      return;
    }
    
    if (!selectedRequestForConversation) {
      toast.error('Please select a design request first');
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        console.log('Creating conversation for design request:', selectedRequestForConversation.id);
        const convResponse = await fetch(`${API_URL}/conversations/design-request/${selectedRequestForConversation.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        console.log('Conversation creation response status:', convResponse.status);
        
        if (convResponse.ok) {
          const convData = await convResponse.json();
          console.log('Conversation created:', convData);
          currentConversationId = convData.conversation?.id || null;
          setConversationId(currentConversationId);
        } else {
          const errorData = await convResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to create conversation:', errorData);
          toast.error(errorData.error || 'Failed to create conversation');
          return;
        }
        
        if (!currentConversationId) {
          toast.error('Failed to create conversation');
          return;
        }
      }

      // Send message with or without file
      let response;
      let uploadedAttachment: any = null;

      if (attachedFile) {
        console.log('[Admin] Uploading file directly to storage:', {
          fileName: attachedFile.name,
          fileSize: attachedFile.size,
          fileType: attachedFile.type
        });

        // Step 1: Get signed upload URL from backend
        const uploadUrlResponse = await fetch(`${API_URL}/conversations/upload-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: currentConversationId,
            fileName: attachedFile.name,
          }),
        });

        if (!uploadUrlResponse.ok) {
          const errData = await uploadUrlResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[Admin] Failed to get upload URL:', errData);
          toast.error(`Failed to prepare upload: ${errData.details || errData.error}`);
          return;
        }

        const { signedUrl, filePath, publicUrl } = await uploadUrlResponse.json();
        console.log('[Admin] Got signed URL, uploading file directly to Supabase...');

        // Step 2: Upload file directly to Supabase Storage (bypasses Vercel 4.5MB limit)
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': attachedFile.type || 'application/octet-stream',
          },
          body: attachedFile,
        });

        if (!uploadResponse.ok) {
          const uploadErr = await uploadResponse.text().catch(() => 'Unknown upload error');
          console.error('[Admin] Direct upload failed:', uploadErr);
          toast.error('Failed to upload file to storage. Please try again.');
          return;
        }

        console.log('[Admin] File uploaded successfully to Supabase Storage');
        uploadedAttachment = {
          file_path: filePath,
          original_name: attachedFile.name,
          file_size: attachedFile.size,
          mime_type: attachedFile.type,
          url: publicUrl,
          name: attachedFile.name,
          access_type: fileAccessType || 'preview_only',
          price: fileAccessType === 'paid' ? parseFloat(filePrice) : undefined,
          download_allowed: false,
          payment_status: fileAccessType === 'paid' ? 'pending' : undefined,
        };
      }

      // Step 3: Send the message as JSON (with attachment metadata if file was uploaded)
      const messageText = proposedPrice ? `${newMessage}\n\n💰 Proposed Price: ${proposedPrice} PLN` : newMessage;
      const messageBody: any = { message: messageText };
      if (uploadedAttachment) {
        messageBody.attachments = [uploadedAttachment];
      }

      // If admin is proposing a price, save it to the DB first
      if (proposedPrice && selectedRequestForConversation?.id) {
        await fetch(`${API_URL}/admin/design-requests/${selectedRequestForConversation.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: parseFloat(proposedPrice) }),
        });
      }

      response = await fetch(`${API_URL}/admin/conversations/${currentConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Admin] Message sent successfully:', data);
        
        if (attachedFile) {
          console.log('[Admin] ✅ File uploaded successfully:', {
            fileName: attachedFile.name,
            messageId: data.message?.id
          });
        }
        
        // Reload the conversation to get fresh messages from database
        const conversationResponse = await fetch(`${API_URL}/conversations/design-request/${selectedRequestForConversation.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (conversationResponse.ok) {
          const conversationData = await conversationResponse.json();
          console.log('Conversation reloaded, messages:', conversationData.messages?.length || 0);
          setMessages(conversationData.messages || []);
          // Update conversationId if it was just created
          if (conversationData.conversation?.id) {
            setConversationId(conversationData.conversation.id);
          }
        } else {
          console.warn('Failed to reload conversation, adding message locally');
          // Fallback to adding the message locally if reload fails
          setMessages([...messages, data.message]);
        }
        
        setNewMessage('');
        setAttachedFile(null);
        setFileAccessType(null);
        setFilePrice('');
        // Update local orders list with new price if proposed
        if (proposedPrice) {
          const newPrice = parseFloat(proposedPrice);
          setOrders(prev => prev.map(r =>
            r.id === selectedRequestForConversation.id ? { ...r, estimated_price: newPrice } : r
          ));
          if (selectedRequestForConversation.id === selectedOrder?.id) {
            setSelectedOrder(prev => prev ? { ...prev, estimated_price: newPrice } : prev);
          }
        }
        setProposedPrice('');

        // Auto-update status to 'in_review' if currently 'pending'
        if (selectedRequestForConversation.design_status === 'pending') {
          setOrders(prev => prev.map(r =>
            r.id === selectedRequestForConversation.id ? { ...r, design_status: 'in_review' } : r
          ));
          if (selectedRequestForConversation.id === selectedOrder?.id) {
            setSelectedOrder(prev => prev ? { ...prev, design_status: 'in_review' } : prev);
          }
          setSelectedRequestForConversation(prev => prev ? { ...prev, design_status: 'in_review' } : prev);
        }

        toast.success(attachedFile ? 'Message and file sent successfully' : 'Message sent');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Admin] ❌ Failed to send message:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        const errorMsg = errorData.details || errorData.error || 'Unknown error';
        if (attachedFile) {
          toast.error(`Failed to upload file: ${errorMsg}. Please check file format and size.`);
        } else {
          toast.error(errorMsg || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleGrantDownloadAccess = async (messageId: string, attachmentIdx: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/conversations/messages/${messageId}/attachment-access`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attachmentIndex: attachmentIdx, download_allowed: true }),
      });
      if (response.ok) {
        toast.success('Download access granted');
        // Reload conversation messages to reflect the change
        if (selectedRequestForConversation) {
          const convResponse = await fetch(`${API_URL}/conversations/design-request/${selectedRequestForConversation.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (convResponse.ok) {
            const convData = await convResponse.json();
            setMessages(convData.messages || []);
          }
        }
      } else {
        toast.error('Failed to grant download access');
      }
    } catch (error) {
      console.error('Error granting download access:', error);
      toast.error('Failed to grant download access');
    }
  };

  const handleDownload3DFile = (order: Order) => {
    if (!order.admin_design_file) {
      toast.error('No design file available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = order.admin_design_file;
    link.download = order.project_name || 'design-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.idea_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return `${price.toFixed(2)} PLN`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getApprovalStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500', text: '⏳ Pending' };
    }
    if (status === 'approved') {
      return { className: 'bg-green-500/20 text-green-400 border-green-500', text: '✓ Approved' };
    }
    if (status === 'rejected') {
      return { className: 'bg-red-500/20 text-red-400 border-red-500', text: '✗ Rejected' };
    }
    return { className: 'bg-gray-500/20 text-gray-400 border-gray-500', text: 'N/A' };
  };

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
      
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                Design Assistance Orders
              </h1>
              <p className="text-gray-400 mt-1">Manage custom design requests and assistance orders</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800 text-white w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{orders.length}</div>
                  <p className="text-sm text-gray-400 mt-1">Total Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-500">
                    {orders.filter(o => o.design_status === 'pending' || o.design_status === 'in_review').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">
                    {orders.filter(o => o.design_status === 'in_progress').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">
                    {orders.filter(o => o.design_status === 'completed').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-500">
                    {orders.filter(o => o.design_status === 'approved').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Approved (Awaiting Payment)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kanban Board - Orders by Status */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 pb-4">
            <div className="min-w-[900px] px-3 sm:px-0">
              <div className="grid grid-cols-6 gap-3 sm:gap-4">
            {/* Pending Column */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-500 text-sm font-semibold flex items-center justify-between">
                  <span>Pending</span>
                  <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs">
                    {filteredOrders.filter(o => o.design_status === 'pending').length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredOrders.filter(o => o.design_status === 'pending').length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No pending requests</p>
                ) : (
                  filteredOrders.filter(o => o.design_status === 'pending').map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm truncate flex-1">{order.project_name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-500/20"
                            onClick={() => handleSelectRequestForConversation(order, true)}
                          >
                            <Eye className="w-3 h-3 text-purple-400" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{order.idea_description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className="text-white font-medium">{formatPrice(order.estimated_price)}</span>
                        </div>
                        <Select
                          value={order.design_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* In Review Column */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-500 text-sm font-semibold flex items-center justify-between">
                  <span>In Review</span>
                  <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs">
                    {filteredOrders.filter(o => o.design_status === 'in_review').length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredOrders.filter(o => o.design_status === 'in_review').length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No requests in review</p>
                ) : (
                  filteredOrders.filter(o => o.design_status === 'in_review').map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm truncate flex-1">{order.project_name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-500/20"
                            onClick={() => handleSelectRequestForConversation(order, true)}
                          >
                            <Eye className="w-3 h-3 text-purple-400" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{order.idea_description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className="text-white font-medium">{formatPrice(order.estimated_price)}</span>
                        </div>
                        <Select
                          value={order.design_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-500 text-sm font-semibold flex items-center justify-between">
                  <span>In Progress</span>
                  <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs">
                    {filteredOrders.filter(o => o.design_status === 'in_progress').length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredOrders.filter(o => o.design_status === 'in_progress').length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No requests in progress</p>
                ) : (
                  filteredOrders.filter(o => o.design_status === 'in_progress').map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm truncate flex-1">{order.project_name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-500/20"
                            onClick={() => handleSelectRequestForConversation(order, true)}
                          >
                            <Eye className="w-3 h-3 text-purple-400" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{order.idea_description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className="text-white font-medium">{formatPrice(order.estimated_price)}</span>
                        </div>
                        <Select
                          value={order.design_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Completed Column */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-500 text-sm font-semibold flex items-center justify-between">
                  <span>Completed</span>
                  <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">
                    {filteredOrders.filter(o => o.design_status === 'completed').length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredOrders.filter(o => o.design_status === 'completed').length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No completed requests</p>
                ) : (
                  filteredOrders.filter(o => o.design_status === 'completed').map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm truncate flex-1">{order.project_name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-500/20"
                            onClick={() => handleSelectRequestForConversation(order, true)}
                          >
                            <Eye className="w-3 h-3 text-purple-400" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{order.idea_description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className="text-white font-medium">{formatPrice(order.final_price || order.estimated_price)}</span>
                        </div>
                        <Select
                          value={order.design_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Approved (Awaiting Payment) Column */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-500 text-sm font-semibold flex items-center justify-between">
                  <span>Approved</span>
                  <span className="bg-cyan-500/20 text-cyan-500 px-2 py-1 rounded text-xs">
                    {filteredOrders.filter(o => o.design_status === 'approved').length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredOrders.filter(o => o.design_status === 'approved').length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No approved requests</p>
                ) : (
                  filteredOrders.filter(o => o.design_status === 'approved').map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm truncate flex-1">{order.project_name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-500/20"
                            onClick={() => handleSelectRequestForConversation(order, true)}
                          >
                            <Eye className="w-3 h-3 text-purple-400" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{order.idea_description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className="text-white font-medium">{formatPrice(order.final_price || order.estimated_price)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500 text-[10px]">
                            Client Approved
                          </Badge>
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500 text-[10px]">
                            {order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                          </Badge>
                        </div>
                        <Select
                          value={order.design_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Cancelled Column */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-500 text-sm font-semibold flex items-center justify-between">
                  <span>Cancelled</span>
                  <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs">
                    {filteredOrders.filter(o => o.design_status === 'cancelled').length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredOrders.filter(o => o.design_status === 'cancelled').length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No cancelled requests</p>
                ) : (
                  filteredOrders.filter(o => o.design_status === 'cancelled').map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm truncate flex-1">{order.project_name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-500/20"
                            onClick={() => handleSelectRequestForConversation(order, true)}
                          >
                            <Eye className="w-3 h-3 text-purple-400" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{order.idea_description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className="text-white font-medium">{formatPrice(order.estimated_price)}</span>
                        </div>
                        <Select
                          value={order.design_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
              </div>
            </div>
          </div>

          {/* Orders Table - Hidden by default, can be toggled */}
          <Card className="bg-gray-900 border-gray-800 hidden">
            <CardHeader>
              <CardTitle className="text-white">All Design Assistance Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-4 text-sm font-bold text-gray-400 pb-2 px-4 border-b border-gray-800">
                  <div>Order ID</div>
                  <div>Project Name</div>
                  <div>User</div>
                  <div>Description</div>
                  <div>Status</div>
                  <div>Payment</div>
                  <div>Price</div>
                  <div className="text-right">Actions</div>
                </div>
                
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No design assistance orders found</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-8 gap-4 items-center py-4 px-4 rounded-lg hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                    >
                      <div className="font-mono text-sm text-gray-300">
                        #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-white truncate" title={order.project_name}>
                        {order.project_name}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {order.users?.email || order.user_email || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400 truncate" title={order.idea_description}>
                        {order.idea_description?.slice(0, 50)}...
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white">
                          {formatStatus(order.design_status)}
                        </span>
                      </div>
                      <div>
                        <PaymentStatusBadge status={order.payment_status as any} />
                      </div>
                      <div className="text-sm text-white font-medium">
                        {formatPrice(order.final_price || order.estimated_price)}
                      </div>
                      <div className="text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-purple-500/20 text-purple-400"
                          onClick={() => handleSelectRequestForConversation(order, true)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Design Requests List with Conversations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6 md:mt-8">
          {/* Left Column - Design Requests List */}
          <Card className="shadow-xl border-2 border-transparent hover:border-cyan-500/20 transition-all bg-gradient-to-br from-gray-900 to-cyan-500/5 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 text-white">
                  <Palette className="w-5 h-5 text-cyan-500" />
                  Design Requests
                  <span className="text-sm font-normal text-gray-400">({orders.length})</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400 px-4">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No design requests yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] px-4">
                  <div className="space-y-2 pt-4 pb-1">
                    {filteredOrders.map((request) => (
                      <div
                        key={request.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border ${
                          selectedRequestForConversation?.id === request.id
                            ? 'bg-cyan-900/30 border-cyan-500'
                            : 'bg-gray-800 border-transparent hover:bg-cyan-500/5 hover:border-cyan-500/20'
                        }`}
                        onClick={() => handleSelectRequestForConversation(request)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Palette className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate text-white">{request.project_name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {request.idea_description ? request.idea_description.substring(0, 50) + '...' : 'No description'}
                            </p>
                            <p className="text-xs text-cyan-600 mt-1">
                              {new Date(request.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {request.estimated_price && ` • ${request.estimated_price.toFixed(2)} PLN`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            request.design_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            request.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-500' :
                            request.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                            request.design_status === 'completed' ? 'bg-green-500/20 text-green-500' :
                            request.design_status === 'approved' ? 'bg-cyan-500/20 text-cyan-500' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {formatStatus(request.design_status)}
                          </Badge>
                          {request.admin_design_file && (
                            <Badge className={`${getApprovalStatusBadge(request.user_approval_status).className} border text-xs`}>
                              {getApprovalStatusBadge(request.user_approval_status).text}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-cyan-500/20 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsRequest(request);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Info className="w-4 h-4 text-cyan-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Conversation */}
          <Card ref={conversationRef} className="shadow-xl border-2 border-transparent hover:border-cyan-500/20 transition-all bg-gradient-to-br from-gray-900 to-cyan-500/5 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 text-white">
                  <MessageSquare className="w-5 h-5 text-cyan-500" />
                  Conversation
                  {messages.length > 0 && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                      {messages.length} messages
                    </Badge>
                  )}
                  {messages.filter(m => m.sender_type === 'user' && m.is_read === false).length > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs animate-pulse">
                      {messages.filter(m => m.sender_type === 'user' && m.is_read === false).length} new
                    </Badge>
                  )}
                </CardTitle>
                {selectedRequestForConversation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectRequestForConversation(selectedRequestForConversation)}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    <Loader2 className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 md:p-6 pt-0 gap-3 sm:gap-4">
              {selectedRequestForConversation ? (
                <>
                  {/* Project Info Bar */}
                  <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{selectedRequestForConversation.project_name}</h3>
                        <p className="text-gray-400 text-xs truncate">{selectedRequestForConversation.idea_description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge className={`${
                          selectedRequestForConversation.design_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          selectedRequestForConversation.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-500' :
                          selectedRequestForConversation.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                          selectedRequestForConversation.design_status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          selectedRequestForConversation.design_status === 'approved' ? 'bg-cyan-500/20 text-cyan-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {formatStatus(selectedRequestForConversation.design_status)}
                        </Badge>
                        {selectedRequestForConversation.admin_design_file && (
                          <Badge className={`${getApprovalStatusBadge(selectedRequestForConversation.user_approval_status).className} border text-xs`}>
                            {getApprovalStatusBadge(selectedRequestForConversation.user_approval_status).text}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attached Reference Files from User */}
                  {selectedRequestForConversation.attached_files && selectedRequestForConversation.attached_files.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs font-semibold mb-2 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        User's Reference Files ({selectedRequestForConversation.attached_files.length})
                      </p>
                      <div className="space-y-1">
                        {selectedRequestForConversation.attached_files.map((file: any, idx: number) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors group"
                          >
                            <Upload className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="text-gray-300 text-xs truncate flex-1 group-hover:text-white">
                              {file.name || `File ${idx + 1}`}
                            </span>
                            {file.size && (
                              <span className="text-gray-500 text-xs flex-shrink-0">
                                {(file.size / 1024).toFixed(0)} KB
                              </span>
                            )}
                            <Download className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div ref={messagesScrollRef}>
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-4 pb-4 pt-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map((msg) => {
                          // Render admin-only design brief as a special card
                          const isAdminBrief = msg.attachments && msg.attachments.some((att: any) => att.type === 'admin_brief');
                          if (isAdminBrief) {
                            const briefAtt = msg.attachments.find((att: any) => att.type === 'admin_brief');
                            const isDecorative = briefAtt?.classification === 'decorative';
                            const isFunctional = briefAtt?.classification === 'functional';
                            return (
                              <div key={msg.id} className="mx-auto max-w-[90%] space-y-3">
                                <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-4 space-y-3">
                                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <FileText className="w-4 h-4" />
                                    Design Brief from Pikoro
                                    {isDecorative && (
                                      <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">Decorative</Badge>
                                    )}
                                    {isFunctional && (
                                      <Badge className="ml-auto bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">Functional</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                                  <p className="text-[10px] text-amber-500/60 text-right">Only visible to admins</p>

                                  {/* Generate 3D button — only for decorative designs */}
                                  {isDecorative && !generationJob && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleTriggerGeneration(msg.message)}
                                      disabled={generatingTripo}
                                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                    >
                                      {generatingTripo ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting generation...</>
                                      ) : (
                                        <><Sparkles className="w-4 h-4 mr-2" />Generate 3D Preview</>
                                      )}
                                    </Button>
                                  )}

                                  {/* Generate CAD button — only for functional designs */}
                                  {isFunctional && !generationJob && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleTriggerOpenSCAD(msg.message)}
                                      disabled={generatingOpenSCAD}
                                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                                    >
                                      {generatingOpenSCAD ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating CAD...</>
                                      ) : (
                                        <><Wrench className="w-4 h-4 mr-2" />Generate CAD</>
                                      )}
                                    </Button>
                                  )}
                                </div>

                                {/* Generation job status display */}
                                {generationJob && (
                                  <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-4 space-y-3">
                                    {/* Pending / Generating */}
                                    {['pending', 'generating', 'processing'].includes(generationJob.status) && (
                                      <div className="flex items-center gap-3 text-purple-300">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <div>
                                          <p className="text-sm font-medium">Generating 3D preview...</p>
                                          <p className="text-xs text-gray-400">This may take up to a minute</p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Code Ready — OpenSCAD editor with parametric preview */}
                                    {generationJob.status === 'code_ready' && generationJob.openscad_code && (
                                      <>
                                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                                          <Wrench className="w-4 h-4" />
                                          CAD Model — Edit Parameters & Preview
                                        </div>
                                        <OpenSCADEditor
                                          code={generationJob.openscad_code}
                                          parameters={generationJob.parameters || []}
                                          onExport={handleUploadSTL}
                                          onRegenerate={() => {
                                            setGenerationJob(null);
                                          }}
                                        />
                                      </>
                                    )}

                                    {/* Pending Approval — show model + approve/reject */}
                                    {generationJob.status === 'pending_approval' && (
                                      <>
                                        <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                                          <Sparkles className="w-4 h-4" />
                                          3D Preview — Awaiting Your Approval
                                        </div>
                                        <div className="rounded-xl overflow-hidden border border-purple-700/50" style={{ height: '300px' }}>
                                          <ModelViewerUrl
                                            url={generationJob.file_url}
                                            fileName={generationJob.file_name || 'model.glb'}
                                            height="100%"
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleApproveGeneration(generationJob.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <Check className="w-4 h-4 mr-2" />Approve & Send to Client
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRejectGeneration(generationJob.id)}
                                            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                                          >
                                            <X className="w-4 h-4 mr-2" />Reject
                                          </Button>
                                        </div>
                                      </>
                                    )}

                                    {/* Approved — show model with badge */}
                                    {generationJob.status === 'approved' && (
                                      <>
                                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                                          <Check className="w-4 h-4" />
                                          3D Preview — Approved & Sent to Client
                                        </div>
                                        <div className="rounded-xl overflow-hidden border border-green-700/50" style={{ height: '300px' }}>
                                          <ModelViewerUrl
                                            url={generationJob.file_url}
                                            fileName={generationJob.file_name || 'model.glb'}
                                            height="100%"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {/* Failed */}
                                    {generationJob.status === 'failed' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-red-400 text-sm">
                                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                          <span>Generation failed: {generationJob.error_message || 'Unknown error'}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => { setGenerationJob(null); handleTriggerGeneration(msg.message); }}
                                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                                        >
                                          <RotateCcw className="w-4 h-4 mr-2" />Retry Generation
                                        </Button>
                                      </div>
                                    )}

                                    {/* Rejected — allow retry */}
                                    {generationJob.status === 'rejected' && (
                                      <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Previous generation was rejected.</p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => { setGenerationJob(null); handleTriggerGeneration(msg.message); }}
                                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                                        >
                                          <RotateCcw className="w-4 h-4 mr-2" />Regenerate 3D Preview
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'engineer' || msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender_type === 'engineer' || msg.sender_type === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Avatar/Badge */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                msg.sender_type === 'engineer' || msg.sender_type === 'admin'
                                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                                  : msg.sender_type === 'system'
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                              }`}>
                                {msg.sender_type === 'engineer' || msg.sender_type === 'admin' ? 'A' : msg.sender_type === 'system' ? <Bot className="w-4 h-4" /> : 'U'}
                              </div>
                              
                              {/* Message Bubble */}
                              <div className="flex flex-col gap-1 flex-1">
                                {/* Sender Label */}
                                <span className={`text-xs font-semibold ${
                                  msg.sender_type === 'engineer' || msg.sender_type === 'admin'
                                    ? 'text-cyan-400 text-right'
                                    : msg.sender_type === 'system'
                                    ? 'text-emerald-400 text-left'
                                    : 'text-purple-400 text-left'
                                }`}>
                                  {msg.sender_type === 'engineer' || msg.sender_type === 'admin' ? 'Admin (You)' : msg.sender_type === 'system' ? 'Pikoro' : 'User'}
                                </span>

                                <div
                                  className={`rounded-lg p-3 ${
                                    msg.sender_type === 'engineer' || msg.sender_type === 'admin'
                                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                                      : msg.sender_type === 'system'
                                      ? 'bg-gradient-to-r from-emerald-900/50 to-teal-900/50 text-gray-200 border border-emerald-700/50'
                                      : 'bg-gray-800 text-gray-200 border border-gray-700'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>

                                  {/* Generated 3D Model Preview */}
                                  {msg.attachments && msg.attachments.filter((att: any) => att.type === 'generated_model').map((att: any, idx: number) => (
                                    <div key={`gen-model-${idx}`} className="mt-3 rounded-xl overflow-hidden border border-gray-700" style={{ height: '300px' }}>
                                      <ModelViewerUrl
                                        url={att.url}
                                        fileName={att.name || 'model.glb'}
                                        height="100%"
                                      />
                                    </div>
                                  ))}

                                  {/* Generation Status (loading) */}
                                  {msg.attachments && msg.attachments.filter((att: any) => att.type === 'generation_status').map((att: any, idx: number) => (
                                    <div key={`gen-status-${idx}`} className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Generating 3D preview...</span>
                                    </div>
                                  ))}

                                  {/* Generation Error */}
                                  {msg.attachments && msg.attachments.filter((att: any) => att.type === 'generation_error' || att.type === 'admin_only').map((att: any, idx: number) => (
                                    <div key={`gen-err-${idx}`} className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg p-2">
                                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                      <span>{att.error || 'Generation issue'}</span>
                                    </div>
                                  ))}

                                  {/* Attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                                      {msg.attachments.map((att: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs opacity-90 flex-wrap">
                                          <Package className="w-3 h-3" />
                                          <span className="truncate max-w-[120px]">{att.name || 'Attachment'}</span>
                                          {att.access_type === 'preview_only' && (
                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                                              {att.download_allowed ? '🔓 Download Granted' : '👁 Preview Only'}
                                            </span>
                                          )}
                                          {att.access_type === 'paid' && (
                                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px]">
                                              {att.payment_status === 'paid' ? '✅ Paid' : `💰 ${att.price} PLN`}
                                            </span>
                                          )}
                                          {att.url && (
                                            <a
                                              href={att.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-cyan-200 hover:text-cyan-100 underline"
                                            >
                                              View
                                            </a>
                                          )}
                                          {att.access_type === 'preview_only' && !att.download_allowed && msg.sender_type !== 'user' && (
                                            <button
                                              onClick={() => handleGrantDownloadAccess(msg.id, idx)}
                                              className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 text-[10px] transition-colors"
                                            >
                                              Grant Download
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
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
                                    {msg.is_read === false && msg.sender_type === 'user' && (
                                      <>
                                        <span>•</span>
                                        <span className="text-orange-400 font-semibold">New</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                  </div>
                  <div className="flex-shrink-0 space-y-2">
                    {attachedFile && (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-800 rounded-lg border border-cyan-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-semibold text-cyan-400">File Attached</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-500/20 ml-auto"
                              onClick={() => { setAttachedFile(null); setFileAccessType(null); setFilePrice(''); }}
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                          <div className="text-xs space-y-1 text-gray-300">
                            <p className="truncate">📄 <span className="font-medium">{attachedFile.name}</span></p>
                            <p>📦 Size: {(attachedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          {/* File Access Type Selector */}
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-gray-400 font-semibold">File Access:</p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={fileAccessType === 'paid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFileAccessType('paid')}
                                className={fileAccessType === 'paid' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
                              >
                                💰 Set Price
                              </Button>
                              <Button
                                type="button"
                                variant={fileAccessType === 'preview_only' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => { setFileAccessType('preview_only'); setFilePrice(''); }}
                                className={fileAccessType === 'preview_only' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
                              >
                                👁 Preview Only
                              </Button>
                            </div>
                            {fileAccessType === 'paid' && (
                              <Input
                                type="number"
                                placeholder="Price in PLN"
                                value={filePrice}
                                onChange={(e) => setFilePrice(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                                min="0.01"
                                step="0.01"
                              />
                            )}
                            {!fileAccessType && (
                              <p className="text-xs text-yellow-400">⚠ Select file access type to enable sending</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={sendingMessage}
                      />
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="*/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('[Admin] File selected:', {
                              name: file.name,
                              size: file.size,
                              type: file.type
                            });
                            setAttachedFile(file);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-700 hover:bg-cyan-500/20"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={sendingMessage}
                        title="Attach 3D model file (Recommended: GLB or GLTF for best web preview)"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          sendingMessage ||
                          (!newMessage.trim() && !attachedFile) ||
                          (!!attachedFile && !fileAccessType) ||
                          (!!attachedFile && fileAccessType === 'paid' && (!filePrice || parseFloat(filePrice) <= 0))
                        }
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a design request to view conversation
                </div>
              )}
            </CardContent>
          </Card>
        </div>      </main>
      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg sm:text-xl md:text-2xl text-white">Design Assistance Order Details</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Order ID: {selectedOrder?.id}
                </DialogDescription>
              </div>
              {selectedOrder?.admin_design_file && (
                <Button
                  onClick={() => selectedOrder && handleDownload3DFile(selectedOrder)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          </DialogHeader>

          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Reference Files */}
              {selectedOrder.attached_files && selectedOrder.attached_files.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Attached Reference Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrder.attached_files.map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                          <span className="text-white">{file.name || `File ${idx + 1}`}</span>
                          <Button size="sm" onClick={() => window.open(file.url, '_blank')}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Design Details */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Design Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Project Name</label>
                      <p className="text-white font-medium">{selectedOrder.project_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <p className="text-white font-medium">{formatStatus(selectedOrder.design_status)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Idea Description</label>
                    <p className="text-white">{selectedOrder.idea_description}</p>
                  </div>

                  {selectedOrder.usage_type && (
                    <div>
                      <label className="text-sm text-gray-400">Usage Type</label>
                      <p className="text-white capitalize">{selectedOrder.usage_type}</p>
                    </div>
                  )}

                  {selectedOrder.usage_details && (
                    <div>
                      <label className="text-sm text-gray-400">Usage Details</label>
                      <p className="text-white whitespace-pre-wrap">{selectedOrder.usage_details}</p>
                    </div>
                  )}

                  {selectedOrder.approximate_dimensions && (
                    <div>
                      <label className="text-sm text-gray-400">Approximate Dimensions</label>
                      <p className="text-white">{selectedOrder.approximate_dimensions}</p>
                    </div>
                  )}

                  {selectedOrder.desired_material && (
                    <div>
                      <label className="text-sm text-gray-400">Desired Material</label>
                      <p className="text-white">{selectedOrder.desired_material}</p>
                    </div>
                  )}

                  {selectedOrder.admin_notes && (
                    <div>
                      <label className="text-sm text-gray-400">Admin Notes</label>
                      <p className="text-white whitespace-pre-wrap">{selectedOrder.admin_notes}</p>
                    </div>
                  )}

                  {selectedOrder.admin_design_file && (
                    <div>
                      <label className="text-sm text-gray-400">Admin Design File</label>
                      <Button 
                        onClick={() => window.open(selectedOrder.admin_design_file, '_blank')}
                        className="mt-2"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Design File
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Customer Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{selectedOrder.user_email || selectedOrder.users?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Name</label>
                      <p className="text-white">{selectedOrder.users?.name || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Payment Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Estimated Price</label>
                      <p className="text-white font-bold text-base sm:text-lg md:text-xl">
                        {selectedOrder.estimated_price ? formatPrice(selectedOrder.estimated_price) : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Final Price</label>
                      <p className="text-white font-bold text-base sm:text-lg md:text-xl">
                        {selectedOrder.final_price ? formatPrice(selectedOrder.final_price) : 'Not set'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Design Timeline */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Design Request Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline currentStatus={selectedOrder.design_status as OrderStatus} />
                </CardContent>
              </Card>

              {/* Admin Actions Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Update Status</label>
                    <select 
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                      value={selectedOrder.design_status}
                      onChange={(e) => {
                        if (selectedOrder?.id) {
                          updateOrderStatus(selectedOrder.id, e.target.value);
                        }
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Set Estimated Price</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                      defaultValue={selectedOrder.estimated_price || ''}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No order details available
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)} className="border-gray-700 text-white hover:bg-gray-800">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-[95vw] sm:max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl text-cyan-400 flex items-center gap-2">
              <Info className="w-6 h-6" />
              Order Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View detailed information about this design request
            </DialogDescription>
          </DialogHeader>
          
          {detailsRequest && (
            <div className="space-y-4 sm:space-y-6 py-4">
              {/* Project Name & Status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">{detailsRequest.project_name}</h3>
                  <p className="text-gray-400 text-sm">Created: {new Date(detailsRequest.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <Badge className={`${
                  detailsRequest.design_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  detailsRequest.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-500' :
                  detailsRequest.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                  detailsRequest.design_status === 'completed' ? 'bg-green-500/20 text-green-500' :
                  detailsRequest.design_status === 'approved' ? 'bg-cyan-500/20 text-cyan-500' :
                  'bg-gray-500/20 text-gray-500'
                }`}>
                  {formatStatus(detailsRequest.design_status)}
                </Badge>
              </div>

              {/* Description */}
              <div>
                <label className="text-gray-400 text-sm">Description</label>
                <p className="text-white mt-1">{detailsRequest.idea_description}</p>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Usage Type</label>
                  <p className="text-white mt-1">{detailsRequest.usage_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Material</label>
                  <p className="text-white mt-1">{detailsRequest.desired_material || 'Not specified'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-gray-400 text-sm">Dimensions</label>
                  <p className="text-white mt-1">{detailsRequest.approximate_dimensions || 'Not specified'}</p>
                </div>
              </div>

              {/* Usage Details */}
              {detailsRequest.usage_details && (
                <div>
                  <label className="text-gray-400 text-sm">Usage Details</label>
                  <p className="text-white mt-1">{detailsRequest.usage_details}</p>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                {detailsRequest.estimated_price && (
                  <div>
                    <label className="text-gray-400 text-sm">Estimated Price</label>
                    <p className="text-cyan-400 font-bold text-lg mt-1">{detailsRequest.estimated_price.toFixed(2)} PLN</p>
                  </div>
                )}
                {detailsRequest.final_price && (
                  <div>
                    <label className="text-gray-400 text-sm">Final Price</label>
                    <p className="text-green-400 font-bold text-lg mt-1">{detailsRequest.final_price.toFixed(2)} PLN</p>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              {detailsRequest.payment_status && (
                <div>
                  <label className="text-gray-400 text-sm">Payment Status</label>
                  <Badge className={`mt-1 ${
                    detailsRequest.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' :
                    detailsRequest.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {detailsRequest.payment_status}
                  </Badge>
                </div>
              )}

              {/* Admin Notes */}
              {detailsRequest.admin_notes && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <label className="text-gray-400 text-sm">Admin Notes</label>
                  <p className="text-white mt-2">{detailsRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="border-gray-700 text-white hover:bg-gray-800">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignAssistance;
