import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, X, Palette, FileText, Plus, Loader2, MessageSquare, Package, Info, Check, AlertCircle, Maximize2, Download, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_URL } from "@/config/api";
import { ModelPreviewCard } from "@/components/ModelPreviewCard";
import { ModelViewerModal } from "@/components/ModelViewerModal";
import { is3DFile, isImageFile, isPdfFile } from "@/utils/fileHelpers";
import { Attachment } from "@/types/attachment";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface DesignRequest {
  id: string;
  project_name: string;
  idea_description: string;
  usage_type?: 'mechanical' | 'decorative' | 'functional' | 'prototype' | 'other';
  usage_details?: string;
  approximate_dimensions?: string;
  attached_files?: any[];
  reference_images?: any[];
  design_status: 'pending' | 'in_review' | 'in_progress' | 'completed' | 'approved' | 'cancelled';
  estimated_price?: number;
  final_price?: number;
  payment_status?: string;
  admin_notes?: string;
  admin_design_file?: string;
  user_approval_status?: 'pending' | 'approved' | 'rejected';
  user_approval_at?: string;
  user_rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

interface Message {
  id: string;
  sender_type: 'user' | 'engineer' | 'system';
  message: string;
  attachments?: any[];
  created_at: string;
  is_read: boolean;
}

const DesignAssistance = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState<DesignRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationFile, setConversationFile] = useState<File | null>(null);

  // Approval/Rejection state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  // 3D Model Viewer state
  const [modelViewerModal, setModelViewerModal] = useState<{
    open: boolean;
    attachment: Attachment | null;
  }>({ open: false, attachment: null });

  // Form state
  const [formData, setFormData] = useState({
    designTitle: "",
    ideaDescription: "",
    usage: "functional" as 'mechanical' | 'decorative' | 'functional' | 'prototype' | 'other',
    dimWidth: "",
    dimHeight: "",
    dimDepth: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const isPaymentCompleted = selectedRequest?.payment_status === 'paid';

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
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      toast.error("Please log in to access Design Assistance");
      navigate("/login");
      return;
    }

    fetchDesignRequests();
  }, [navigate]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedRequest) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/conversations/design-request/${selectedRequest.id}`, {
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
  }, [selectedRequest?.id]);

  // Poll for new/updated design requests every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await fetch(`${API_URL}/design-requests/my`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};
          const newRequests = data.requests || [];
          setDesignRequests(newRequests);
          // Update selectedRequest with fresh data if it's still in the list
          if (selectedRequest) {
            const updated = newRequests.find((r: DesignRequest) => r.id === selectedRequest.id);
            if (updated) {
              setSelectedRequest(updated);
            }
          }
        }
      } catch (e) {
        // Silent fail on polling
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedRequest?.id]);

  const fetchDesignRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/design-requests/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
        setDesignRequests(data.requests || []);
        
        // Check if there's a request ID in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get('request');
        
        if (requestId && data.requests) {
          // Find and select the request from URL
          const targetRequest = data.requests.find((r: DesignRequest) => r.id === requestId);
          if (targetRequest) {
            handleSelectRequest(targetRequest);
          } else if (data.requests.length > 0) {
            handleSelectRequest(data.requests[0]);
          }
        } else if (data.requests && data.requests.length > 0) {
          // Auto-select the first request if exists
          handleSelectRequest(data.requests[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching design requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = async (request: DesignRequest) => {
    setSelectedRequest(request);
    
    // Fetch conversation for this request
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/conversations/design-request/${request.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
        console.log('✅ [Design Assistance] Loaded conversation:', data.conversation?.id, 'Messages:', data.messages?.length || 0);
        
        // Log messages with attachments for debugging
        const messagesWithAttachments = data.messages?.filter((msg: any) => msg.attachments && msg.attachments.length > 0);
        if (messagesWithAttachments && messagesWithAttachments.length > 0) {
          console.log('📎 [Design Assistance] Messages with attachments:', messagesWithAttachments.length);
          messagesWithAttachments.forEach((msg: any, idx: number) => {
            console.log(`  Message ${idx + 1}:`, {
              id: msg.id,
              sender: msg.sender_type,
              attachments: msg.attachments.map((att: any) => ({
                name: att.name,
                url: att.url,
                size: att.size
              }))
            });
          });
        }
      } else if (response.status === 404) {
        // No conversation yet
        console.log('No conversation found for design request:', request.id);
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setConversationId(null);
      setMessages([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ideaDescription) {
      toast.error("Please provide a description of your design idea");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');

      // Upload files directly to Supabase via signed URLs (avoids Vercel 4.5MB body limit)
      const uploadedFiles: { name: string; url: string; size: number; type: string }[] = [];
      for (const file of attachedFiles) {
        try {
          // Get signed upload URL
          const urlRes = await fetch(`${API_URL}/design-requests/upload-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName: file.name }),
          });

          if (!urlRes.ok) throw new Error('Failed to get upload URL');
          const { signedUrl, token: uploadToken, publicUrl } = await urlRes.json();

          // Upload file directly to Supabase Storage
          const uploadRes = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'x-upsert': 'true',
            },
            body: file,
          });

          if (!uploadRes.ok) throw new Error('File upload failed');

          uploadedFiles.push({
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type,
          });
        } catch (uploadErr) {
          console.error('File upload error:', uploadErr);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Build dimensions string from individual float inputs
      const dimParts = [];
      if (formData.dimWidth) dimParts.push(`${formData.dimWidth}mm`);
      if (formData.dimHeight) dimParts.push(`${formData.dimHeight}mm`);
      if (formData.dimDepth) dimParts.push(`${formData.dimDepth}mm`);

      // Send design request with JSON body (no multipart, files already uploaded)
      const response = await fetch(`${API_URL}/design-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: formData.designTitle || `Design Request - ${formData.usage}`,
          ideaDescription: formData.ideaDescription,
          usage: formData.usage,
          approximateDimensions: dimParts.length > 0 ? dimParts.join(' x ') : 'Not specified',
          attachedFiles: uploadedFiles,
        }),
      });

      if (!response.ok) {
        let error;
        try {
          const text = await response.text();
          error = text ? JSON.parse(text) : {};
        } catch (e) {
          error = {};
        }
        throw new Error(error.error || 'Failed to submit design request');
      }

      toast.success("Your design request has been submitted!");
      
      // Reset form
      setFormData({
        designTitle: "",
        ideaDescription: "",
        usage: "functional",
        dimWidth: "",
        dimHeight: "",
        dimDepth: "",
      });
      setAttachedFiles([]);
      setShowFormDialog(false);

      // Refresh the list
      await fetchDesignRequests();

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || "Could not submit your design request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !conversationFile) return;

    if (!selectedRequest) {
      toast.error("Please select a design request first");
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const convResponse = await fetch(`${API_URL}/conversations/design-request/${selectedRequest.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
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
          toast.error('Failed to create conversation');
          return;
        }
      }

      let response;
      let uploadedAttachment: any = null;

      if (conversationFile) {
        // Step 1: Get signed upload URL from backend
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

        // Step 2: Upload file directly to Supabase Storage (bypasses Vercel 4.5MB limit)
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': conversationFile.type || 'application/octet-stream',
          },
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

      // Step 3: Send the message as JSON (with attachment metadata if file was uploaded)
      const messageBody: any = { message: newMessage };
      if (uploadedAttachment) {
        messageBody.attachments = [uploadedAttachment];
      }

      response = await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      });

      if (response.ok) {
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleApproveDesign = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this design? You will proceed to payment.')) {
      return;
    }

    setProcessingApproval(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/design-requests/${requestId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const updatedRequest = selectedRequest;
        await fetchDesignRequests(); // Refresh data

        // If price is 0, no payment needed — just show success
        if (!updatedRequest?.estimated_price || updatedRequest.estimated_price <= 0) {
          toast.success('Design approved!');
        } else {
          toast.success('Design approved! Redirecting to payment...');
          // Redirect to payment after a short delay
          setTimeout(() => {
            handleProceedToPayment(selectedRequest!);
          }, 1500);
        }
      } else {
        let error;
        try {
          const text = await response.text();
          error = text ? JSON.parse(text) : {};
        } catch (e) {
          error = {};
        }
        throw new Error(error.error || 'Failed to approve design');
      }
    } catch (error: any) {
      console.error('Error approving design:', error);
      toast.error(error.message || 'Failed to approve design');
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleDownload = async () => {
    if (!modelViewerModal.attachment) return;
    
    try {
      const attachment = modelViewerModal.attachment;
      let downloadUrl = attachment.url;

      // If it's an S3 URL, get signed URL first
      if (attachment.url.startsWith('s3://')) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${API_URL}/files/signed-url?fileUrl=${encodeURIComponent(attachment.url)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          downloadUrl = data.signedUrl;
        } else {
          throw new Error('Failed to get download URL');
        }
      } else if (!attachment.url.startsWith('http')) {
        // For local paths, construct proper URL
        const baseUrl = API_URL.replace('/api', '');
        const path = attachment.url.startsWith('/') ? attachment.url : `/${attachment.url}`;
        downloadUrl = `${baseUrl}${path}`;
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name || 'model.stl';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${attachment.name}`);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleRejectDesign = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!selectedRequest) return;

    setProcessingApproval(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/design-requests/${selectedRequest.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      if (response.ok) {
        toast.success('Design rejected. The admin has been notified.');
        setShowRejectDialog(false);
        setRejectionReason('');
        await fetchDesignRequests();
      } else {
        let error;
        try {
          const text = await response.text();
          error = text ? JSON.parse(text) : {};
        } catch (e) {
          error = {};
        }
        throw new Error(error.error || 'Failed to reject design');
      }
    } catch (error: any) {
      console.error('Error rejecting design:', error);
      toast.error(error.message || 'Failed to reject design');
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleProceedToPayment = (request: DesignRequest) => {
    // Navigate to checkout with the order ID
    navigate(`/checkout?orderId=${request.id}`);
  };

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'in_review': return 'bg-orange-500/20 text-orange-500';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500';
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'approved': return 'bg-cyan-500/20 text-cyan-500';
      case 'cancelled': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </main>
      </div>
    );
  }

  // Empty state - No design requests yet
  if (designRequests.length === 0) {
    return (
      <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
        <DashboardSidebar />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                3D Design Assistance
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Transform your ideas into custom 3D designs</p>
            </div>

            {/* Empty State Card */}
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
              <CardContent className="pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16 text-center px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-500/20 mb-4 sm:mb-6">
                  <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Discover 3D Design Services</h2>
                <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                  Have an idea but no 3D model? Our expert team will design it for you. 
                  Just describe your concept and we'll bring it to life!
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setShowFormDialog(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Discover 3D Design
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Form Dialog */}
        <DesignFormDialog
          open={showFormDialog}
          onOpenChange={setShowFormDialog}
          formData={formData}
          setFormData={setFormData}
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          handleFileChange={handleFileChange}
          handleDrop={handleDrop}
          removeFile={removeFile}
          handleSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    );
  }

  // Main view with design requests
  return (
    <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
      <DashboardSidebar />
      
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header with Create Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
                My Design Requests
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your custom 3D design projects</p>
            </div>
            <Button 
              onClick={() => setShowFormDialog(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Discover New 3D Design
            </Button>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
            {/* Left Column - Order Details */}
            <Card className="bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  Design Requests ({designRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Orders List - Scrollable */}
                <ScrollArea className="h-[400px] px-4">
                  <div className="space-y-3 pt-4">
                    {designRequests.map((request) => (
                      <Card
                        key={request.id}
                        className={`transition-all ${
                          selectedRequest?.id === request.id
                            ? 'bg-cyan-900/30 border-cyan-500'
                            : 'bg-gray-800 border-gray-700 hover:border-cyan-500/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 
                              className="text-white font-semibold truncate flex-1 cursor-pointer"
                              onClick={() => handleSelectRequest(request)}
                            >
                              {request.project_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(request.design_status)}>
                                {formatStatus(request.design_status)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-cyan-500/20"
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
                          <p 
                            className="text-gray-400 text-sm mb-2 line-clamp-2 cursor-pointer"
                            onClick={() => handleSelectRequest(request)}
                          >
                            {request.idea_description}
                          </p>
                          <div 
                            className="flex items-center justify-between text-xs cursor-pointer"
                            onClick={() => handleSelectRequest(request)}
                          >
                            <span className="text-gray-500">{formatDate(request.created_at)}</span>
                            {request.estimated_price && (
                              <span className="text-cyan-400 font-semibold">
                                {request.estimated_price} PLN
                              </span>
                            )}
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
                  Conversation with Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0 gap-4">
                {selectedRequest ? (
                  <>
                    {/* Request Details Summary */}
                    <div className="px-4 pt-4 space-y-3">
                      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold text-sm">{selectedRequest.project_name}</h3>
                          <Badge className={getStatusColor(selectedRequest.design_status)}>
                            {formatStatus(selectedRequest.design_status)}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{selectedRequest.idea_description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {selectedRequest.usage_type && (
                            <div>
                              <span className="text-gray-500">Usage:</span>{' '}
                              <span className="text-gray-300 capitalize">{selectedRequest.usage_type}</span>
                            </div>
                          )}
                          {selectedRequest.approximate_dimensions && selectedRequest.approximate_dimensions !== 'Not specified' && (
                            <div>
                              <span className="text-gray-500">Dimensions:</span>{' '}
                              <span className="text-gray-300">{selectedRequest.approximate_dimensions}</span>
                            </div>
                          )}
                          {selectedRequest.usage_details && selectedRequest.usage_details !== 'Not specified' && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Details:</span>{' '}
                              <span className="text-gray-300">{selectedRequest.usage_details}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prominent Price Banner */}
                      {(selectedRequest.estimated_price || selectedRequest.design_status === 'approved') ? (
                        <div className={`rounded-xl border p-4 space-y-3 ${
                          isPaymentCompleted
                            ? 'bg-green-500/10 border-green-500/40'
                            : (selectedRequest.design_status === 'completed' || selectedRequest.design_status === 'approved')
                              ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400/60'
                              : 'bg-gray-800/60 border-yellow-500/40'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                              {isPaymentCompleted ? 'Amount Paid' : 'Price Proposed by Admin'}
                            </span>
                            {isPaymentCompleted ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500 text-xs">✓ Paid</Badge>
                            ) : selectedRequest.design_status === 'completed' ? (
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500 text-xs animate-pulse">Action Required</Badge>
                            ) : selectedRequest.design_status === 'approved' ? (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500 text-xs animate-pulse">Payment Pending</Badge>
                            ) : (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500 text-xs">Estimate</Badge>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${isPaymentCompleted ? 'text-green-400' : 'text-cyan-400'}`}>
                              {(selectedRequest.estimated_price || 0).toFixed(2)}
                            </span>
                            <span className="text-gray-400 text-base font-medium">PLN</span>
                          </div>
                          {!isPaymentCompleted && selectedRequest.design_status === 'completed' && (
                            <div className="space-y-2 pt-1">
                              <p className="text-cyan-200 text-xs">The admin has completed your design. Review it and approve to proceed to payment.</p>
                              <Button
                                onClick={() => handleApproveDesign(selectedRequest.id)}
                                disabled={processingApproval}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm h-10"
                              >
                                {processingApproval ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                  <><Check className="w-4 h-4 mr-2" />Approve & Pay {(selectedRequest.estimated_price || 0).toFixed(2)} PLN</>
                                )}
                              </Button>
                            </div>
                          )}
                          {!isPaymentCompleted && selectedRequest.design_status === 'approved' && selectedRequest.estimated_price && selectedRequest.estimated_price > 0 && (
                            <div className="space-y-2 pt-1">
                              <p className="text-cyan-200 text-xs">You approved this design. Complete payment to download your files.</p>
                              <Button
                                onClick={() => handleProceedToPayment(selectedRequest)}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm h-10"
                              >
                                <Check className="w-4 h-4 mr-2" />Proceed to Payment — {selectedRequest.estimated_price.toFixed(2)} PLN
                              </Button>
                            </div>
                          )}
                          {!isPaymentCompleted && selectedRequest.design_status === 'approved' && (!selectedRequest.estimated_price || selectedRequest.estimated_price <= 0) && (
                            <div className="space-y-2 pt-1">
                              <p className="text-green-200 text-xs">You approved this design. Files are available for download.</p>
                            </div>
                          )}
                          {!isPaymentCompleted && selectedRequest.design_status !== 'completed' && selectedRequest.design_status !== 'approved' && (
                            <p className="text-gray-400 text-xs">Waiting for admin to finalize the design before you can approve and pay.</p>
                          )}
                        </div>
                      ) : null}

                      {/* Attached Reference Files */}
                      {selectedRequest.attached_files && selectedRequest.attached_files.length > 0 && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                          <p className="text-gray-400 text-xs font-semibold mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Reference Files ({selectedRequest.attached_files.length})
                          </p>
                          <div className="space-y-1">
                            {selectedRequest.attached_files.map((file: any, idx: number) => (
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

                      {/* Reference Images */}
                      {selectedRequest.reference_images && selectedRequest.reference_images.length > 0 && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                          <p className="text-gray-400 text-xs font-semibold mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Reference Images ({selectedRequest.reference_images.length})
                          </p>
                          <div className="space-y-1">
                            {selectedRequest.reference_images.map((file: any, idx: number) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors group"
                              >
                                <Upload className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span className="text-gray-300 text-xs truncate flex-1 group-hover:text-white">
                                  {file.name || `Image ${idx + 1}`}
                                </span>
                                <Download className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Messages */}
                    <div ref={messagesScrollRef}>
                    <ScrollArea className="h-[300px] pr-4 px-4">
                      <div className="space-y-4 pb-4 pt-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No messages yet. Start the conversation!
                          </div>
                        ) : (
                          messages.map((msg) => {
                            // Log message details for debugging
                            if (msg.attachments && msg.attachments.length > 0) {
                              console.log(`💬 [Message] ID: ${msg.id}, Sender: ${msg.sender_type}, Attachments: ${msg.attachments.length}`);
                            }
                            
                            return (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  msg.sender_type === 'user'
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                                    : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                }`}>
                                  {msg.sender_type === 'user' ? 'Y' : 'A'}
                                </div>
                                
                                {/* Message Content */}
                                <div className="flex flex-col gap-1 flex-1">
                                  {/* Sender Label */}
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
                                      <div className="mt-2 space-y-2">
                                        {msg.attachments.filter((att: any) => att.url && !(msg.sender_type !== 'user' && is3DFile(att.name || att.url))).map((att: any, idx: number) => {
                                          const isAdminFile = msg.sender_type !== 'user';
                                          const accessType = att.access_type || 'free';
                                          const isDownloadBlocked = isAdminFile && (
                                            (accessType === 'paid' && att.price > 0 && att.payment_status !== 'paid') ||
                                            (accessType === 'preview_only' && !att.download_allowed)
                                          );
                                          const fileName = att.name || att.url || '';
                                          const mimeType = att.type || att.mime_type || '';
                                          const isImage = isImageFile(fileName, mimeType);
                                          const isPdf = isPdfFile(fileName, mimeType);
                                          const isPaidUnpaid = isAdminFile && accessType === 'paid' && att.price > 0 && att.payment_status !== 'paid';
                                          const isPaidCompleted = isAdminFile && accessType === 'paid' && att.payment_status === 'paid';

                                          {/* Case 1: Paid image, not yet paid — watermarked preview */}
                                          if (isPaidUnpaid && isImage) {
                                            return (
                                              <div key={idx} className="mt-1">
                                                <div
                                                  className="watermark-overlay rounded-lg border border-yellow-500/30 bg-gray-900"
                                                  onContextMenu={(e) => e.preventDefault()}
                                                >
                                                  <img
                                                    src={att.url}
                                                    alt={att.name || 'Preview'}
                                                    className="w-full max-h-64 object-contain rounded-lg"
                                                    draggable={false}
                                                    onDragStart={(e) => e.preventDefault()}
                                                    style={{ pointerEvents: 'none' }}
                                                  />
                                                  <div className="absolute top-2 right-2 z-20">
                                                    <Badge className="text-[10px] px-2 py-0.5 bg-yellow-500/90 text-black border-yellow-600 font-semibold shadow-lg">
                                                      {att.price ? `${att.price} PLN` : 'Paid'}
                                                    </Badge>
                                                  </div>
                                                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                                                    <div className="flex items-center gap-2 text-xs text-yellow-300">
                                                      <Lock className="w-3 h-3" />
                                                      <span className="truncate">{att.name || 'Attachment'}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                {selectedRequest && (
                                                  <button
                                                    onClick={() => navigate(`/checkout?orderId=${selectedRequest.id}&filePayment=true&messageId=${msg.id}&attachmentIdx=${idx}&amount=${att.price}&fileName=${encodeURIComponent(att.name || 'File')}`)}
                                                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black transition-colors"
                                                  >
                                                    <Lock className="w-3 h-3" />
                                                    Pay {att.price ? `${att.price} PLN` : ''} to download
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          }

                                          {/* Case 2: Paid PDF, not yet paid — embedded PDF with watermark overlay */}
                                          if (isPaidUnpaid && isPdf) {
                                            return (
                                              <div key={idx} className="mt-1">
                                                <div
                                                  className="watermark-overlay rounded-lg border border-yellow-500/30 bg-gray-900"
                                                  onContextMenu={(e) => e.preventDefault()}
                                                >
                                                  <embed
                                                    src={`${att.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                                    type="application/pdf"
                                                    className="w-full rounded-t-lg"
                                                    style={{ height: '360px', pointerEvents: 'none' }}
                                                  />
                                                  <div className="absolute top-2 right-2 z-20">
                                                    <Badge className="text-[10px] px-2 py-0.5 bg-yellow-500/90 text-black border-yellow-600 font-semibold shadow-lg">
                                                      {att.price ? `${att.price} PLN` : 'Paid'}
                                                    </Badge>
                                                  </div>
                                                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                                                    <div className="flex items-center gap-2 text-xs text-yellow-300">
                                                      <Lock className="w-3 h-3" />
                                                      <span className="truncate">{att.name || 'Document.pdf'}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                {selectedRequest && (
                                                  <button
                                                    onClick={() => navigate(`/checkout?orderId=${selectedRequest.id}&filePayment=true&messageId=${msg.id}&attachmentIdx=${idx}&amount=${att.price}&fileName=${encodeURIComponent(att.name || 'File')}`)}
                                                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black transition-colors"
                                                  >
                                                    <Lock className="w-3 h-3" />
                                                    Pay {att.price ? `${att.price} PLN` : ''} to download
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          }

                                          {/* Case 3: Download blocked (preview_only, or paid non-previewable) — lock + badge */}
                                          if (isDownloadBlocked) {
                                            const blockMessage = accessType === 'paid'
                                              ? `Pay ${att.price ? att.price + ' PLN' : ''} to download`
                                              : 'Preview only';
                                            const tooltipText = accessType === 'paid'
                                              ? `Complete payment of ${att.price || ''} PLN to download this file`
                                              : 'This file is for preview only. Contact admin for download access.';

                                            return (
                                              <TooltipProvider key={idx}>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 text-xs opacity-60 cursor-not-allowed">
                                                      <Lock className="w-3 h-3 text-yellow-400" />
                                                      <span className="truncate text-gray-400">{att.name || 'Attachment'}</span>
                                                      <Badge className={`text-[10px] px-1.5 py-0 ${
                                                        accessType === 'paid'
                                                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
                                                          : 'bg-purple-500/20 text-purple-400 border-purple-500'
                                                      }`}>
                                                        {blockMessage}
                                                      </Badge>
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent className="bg-gray-800 border-gray-600 text-gray-200">
                                                    <p>{tooltipText}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            );
                                          }

                                          {/* Case 4: Paid image, paid — inline image with download */}
                                          if (isPaidCompleted && isImage) {
                                            return (
                                              <div key={idx} className="mt-1">
                                                <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                  <img
                                                    src={att.url}
                                                    alt={att.name || 'Image'}
                                                    className="w-full max-h-64 object-contain rounded-lg border border-gray-600 hover:border-cyan-500 transition-colors cursor-pointer"
                                                  />
                                                </a>
                                                <div className="flex items-center gap-2 mt-1 text-xs">
                                                  <Download className="w-3 h-3 text-green-400" />
                                                  <a
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-400 hover:text-green-300 underline truncate"
                                                  >
                                                    {att.name || 'Download'}
                                                  </a>
                                                  <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500">
                                                    Paid
                                                  </Badge>
                                                </div>
                                              </div>
                                            );
                                          }

                                          {/* Case 5: Default — simple link */}
                                          return (
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
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* 3D File Attachments from Admin */}
                                    {msg.sender_type !== 'user' && msg.attachments && msg.attachments.length > 0 && (() => {
                                      const filtered3DFiles = msg.attachments.filter((att: any) => {
                                        const hasUrl = !!att.url;
                                        const fileName = att.name || att.url;
                                        return hasUrl && is3DFile(fileName);
                                      });

                                      if (filtered3DFiles.length === 0) return null;

                                      return (
                                        <div className="mt-3 space-y-3">
                                          {filtered3DFiles.map((attachment: any, idx: number) => {
                                            const isPreviewOnly = attachment.access_type === 'preview_only' && !attachment.download_allowed;
                                            return (
                                              <div key={idx}>
                                                {isPreviewOnly && (
                                                  <div className="flex items-center gap-1 mb-1">
                                                    <Lock className="w-3 h-3 text-purple-400" />
                                                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-400 border-purple-500">
                                                      Preview only — download restricted
                                                    </Badge>
                                                  </div>
                                                )}
                                                <ModelPreviewCard
                                                  attachment={attachment}
                                                  approvalStatus={
                                                    isPreviewOnly
                                                      ? undefined
                                                      : selectedRequest.user_approval_status as any
                                                  }
                                                  onOpenFullscreen={() => setModelViewerModal({ open: true, attachment })}
                                                  showApprovalButtons={!isPreviewOnly}
                                                />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
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
                    {selectedRequest.user_approval_status === 'rejected' ? (
                      <div className="flex gap-2 flex-shrink-0 px-4 pb-4">
                        <div className="w-full p-3 bg-red-500/20 border border-red-500 rounded-lg text-center">
                          <p className="text-red-400 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Chat disabled - Design rejected
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 px-4 pb-4 space-y-2">
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
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a design request to view conversation
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Reject Design
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this design. Your feedback will help the admin create a better design for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain what you'd like changed or why this design doesn't meet your needs..."
              className="bg-gray-800 border-gray-700 text-white min-h-24"
              required
            />
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={processingApproval}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRejectDesign}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason.trim() || processingApproval}
            >
              {processingApproval ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Reject Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3D Model Viewer Modal */}
      <ModelViewerModal
        open={modelViewerModal.open}
        onClose={() => setModelViewerModal({ open: false, attachment: null })}
        modelUrl={modelViewerModal.attachment?.url || null}
        fileName={modelViewerModal.attachment?.name || 'model'}
        approvalStatus={selectedRequest?.user_approval_status as any}
        onApprove={
          selectedRequest &&
          modelViewerModal.attachment?.access_type !== 'preview_only'
            ? () => handleApproveDesign(selectedRequest.id)
            : undefined
        }
        onReject={
          modelViewerModal.attachment?.access_type !== 'preview_only'
            ? () => {
                setModelViewerModal({ open: false, attachment: null });
                setShowRejectDialog(true);
              }
            : undefined
        }
        onDownload={
          isPaymentCompleted && modelViewerModal.attachment?.download_allowed !== false
            ? handleDownload
            : undefined
        }
        downloadBlocked={
          !isPaymentCompleted ||
          modelViewerModal.attachment?.access_type === 'preview_only'
        }
        processingApproval={processingApproval}
      />

      {/* Form Dialog */}
      <DesignFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        formData={formData}
        setFormData={setFormData}
        attachedFiles={attachedFiles}
        setAttachedFiles={setAttachedFiles}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        handleFileChange={handleFileChange}
        handleDrop={handleDrop}
        removeFile={removeFile}
        handleSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-400 flex items-center gap-2">
              <Info className="w-6 h-6" />
              Order Details
            </DialogTitle>
          </DialogHeader>
          
          {detailsRequest && (
            <div className="space-y-6 py-4">
              {/* Project Name & Status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{detailsRequest.project_name}</h3>
                  <p className="text-gray-400 text-sm">Created: {formatDate(detailsRequest.created_at)}</p>
                </div>
                <Badge className={getStatusColor(detailsRequest.design_status)}>
                  {formatStatus(detailsRequest.design_status)}
                </Badge>
              </div>

              {/* Description */}
              <div>
                <Label className="text-gray-400 text-sm">Description</Label>
                <p className="text-white mt-1">{detailsRequest.idea_description}</p>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Usage Type</Label>
                  <p className="text-white mt-1">{detailsRequest.usage_type || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Dimensions</Label>
                  <p className="text-white mt-1">{detailsRequest.approximate_dimensions || 'Not specified'}</p>
                </div>
              </div>

              {/* Usage Details */}
              {detailsRequest.usage_details && (
                <div>
                  <Label className="text-gray-400 text-sm">Usage Details</Label>
                  <p className="text-white mt-1">{detailsRequest.usage_details}</p>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                {detailsRequest.estimated_price && (
                  <div>
                    <Label className="text-gray-400 text-sm">Estimated Price</Label>
                    <p className="text-cyan-400 font-bold text-lg mt-1">{detailsRequest.estimated_price.toFixed(2)} PLN</p>
                  </div>
                )}
                {detailsRequest.final_price && (
                  <div>
                    <Label className="text-gray-400 text-sm">Final Price</Label>
                    <p className="text-green-400 font-bold text-lg mt-1">{detailsRequest.final_price.toFixed(2)} PLN</p>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              {detailsRequest.payment_status && (
                <div>
                  <Label className="text-gray-400 text-sm">Payment Status</Label>
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
                  <Label className="text-gray-400 text-sm">Admin Notes</Label>
                  <p className="text-white mt-2">{detailsRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Separate component for the form dialog
const DesignFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  attachedFiles,
  setAttachedFiles,
  isDragging,
  setIsDragging,
  handleFileChange,
  handleDrop,
  removeFile,
  handleSubmit,
  submitting,
}: any) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Palette className="w-6 h-6 text-cyan-500" />
            New Design Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Design Title */}
          <div className="space-y-2">
            <Label htmlFor="designTitle" className="text-base font-semibold">
              Design Title
            </Label>
            <Input
              id="designTitle"
              value={formData.designTitle}
              onChange={(e) => setFormData({ ...formData, designTitle: e.target.value })}
              placeholder="Give your design a name (e.g., Phone Stand, Gear Bracket)"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Design Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">What type of design do you need?</Label>
            <RadioGroup
              value={formData.usage}
              onValueChange={(value) => setFormData({ ...formData, usage: value as any })}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="mechanical" id="mechanical" />
                <Label htmlFor="mechanical" className="cursor-pointer">Mechanical Part</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="decorative" id="decorative" />
                <Label htmlFor="decorative" className="cursor-pointer">Decorative Piece</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="functional" id="functional" />
                <Label htmlFor="functional" className="cursor-pointer">Functional Object</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="prototype" id="prototype" />
                <Label htmlFor="prototype" className="cursor-pointer">Prototype</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Idea Description */}
          <div className="space-y-2">
            <Label htmlFor="ideaDescription" className="text-base font-semibold">
              Describe your idea <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="ideaDescription"
              value={formData.ideaDescription}
              onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
              placeholder="Tell us about your design idea in detail..."
              className="bg-gray-800 border-gray-700 text-white min-h-32"
              required
            />
          </div>

          {/* Approximate Dimensions */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Approximate Dimensions (mm)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dimWidth" className="text-xs text-gray-400">Width</Label>
                <Input
                  id="dimWidth"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimWidth}
                  onChange={(e) => setFormData({ ...formData, dimWidth: e.target.value })}
                  placeholder="0.0"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dimHeight" className="text-xs text-gray-400">Height</Label>
                <Input
                  id="dimHeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimHeight}
                  onChange={(e) => setFormData({ ...formData, dimHeight: e.target.value })}
                  placeholder="0.0"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dimDepth" className="text-xs text-gray-400">Depth</Label>
                <Input
                  id="dimDepth"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimDepth}
                  onChange={(e) => setFormData({ ...formData, dimDepth: e.target.value })}
                  placeholder="0.0"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Reference Files (Optional)</Label>
            <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <p className="font-semibold text-cyan-400 mb-1">📎 All Formats</p>
                <p className="text-gray-400 text-xs">Images, documents, 3D files, archives, and more</p>
              </div>
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 hover:border-gray-600'
              }`}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Drag & drop files or</p>
              <Button type="button" variant="outline" className="relative">
                Browse Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                {attachedFiles.map((file: File, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-sm text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Design Request'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DesignAssistance;
