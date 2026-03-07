import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Check, Maximize2, AlertCircle, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";

interface S3FileViewerProps {
  attachment: any;
  fileUrlPromise: Promise<string>;
  selectedRequest: any;
  onApprove: () => void;
  onReject: () => void;
  processingApproval: boolean;
}

const getApprovalStatusBadge = (status?: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-400';
    case 'rejected':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-yellow-500/20 text-yellow-400';
  }
};

export const S3FileViewer = ({ 
  attachment, 
  fileUrlPromise, 
  selectedRequest,
  onApprove,
  onReject,
  processingApproval
}: S3FileViewerProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    fileUrlPromise
      .then(url => {
        console.log('[S3FileViewer] ✅ URL resolved successfully:', {
          fileName: attachment.name,
          originalUrl: attachment.url,
          resolvedUrl: url,
          urlLength: url?.length,
          isS3: attachment.url.startsWith('s3://'),
          isHttp: url?.startsWith('http')
        });
        setFileUrl(url);
        setLoading(false);
      })
      .catch(err => {
        console.error('[S3FileViewer] ❌ Failed to resolve URL:', {
          fileName: attachment.name,
          originalUrl: attachment.url,
          error: err
        });
        setError('Failed to load file URL');
        setLoading(false);
      });
  }, [fileUrlPromise, attachment]);

  const isPending = !selectedRequest.user_approval_status || selectedRequest.user_approval_status === 'pending';

  return (
    <>
      <div className="bg-gray-800 border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold">3D Design Model</span>
          </div>
          <Badge className={`${getApprovalStatusBadge(selectedRequest.user_approval_status)} border`}>
            {selectedRequest.user_approval_status === 'approved' && '✓ Approved'}
            {selectedRequest.user_approval_status === 'rejected' && '✗ Rejected'}
            {isPending && '⏳ Pending Review'}
          </Badge>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-40 bg-gray-900 rounded">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
            <span className="text-gray-400 text-sm">Loading 3D model...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-40 bg-red-900/20 rounded border border-red-500">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {fileUrl && !loading && !error && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
              <Palette className="w-12 h-12 mx-auto mb-3 text-blue-400" />
              <p className="text-white font-medium mb-1">{attachment.name || 'Design File'}</p>
              <p className="text-gray-400 text-xs mb-4">Click below to view in fullscreen 3D viewer</p>
              
              {attachment.url.startsWith('s3://') && (
                <p className="text-blue-400 text-[10px] mb-3">☁️ Hosted securely on AWS S3</p>
              )}

              <Button
                onClick={() => setShowFullscreen(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                size="lg"
              >
                <Maximize2 className="w-5 h-5 mr-2" />
                Open 3D Viewer (Fullscreen)
              </Button>
            </div>

            {/* Approval Buttons (only if pending) */}
            {isPending && (
              <div className="flex gap-3">
                <Button 
                  onClick={onApprove}
                  disabled={processingApproval}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  size="lg"
                >
                  {processingApproval ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  Approve & Pay
                </Button>
                <Button 
                  onClick={onReject}
                  disabled={processingApproval}
                  variant="outline"
                  className="flex-1 border-2 border-red-500 text-red-400 hover:bg-red-500/20 font-semibold"
                  size="lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  Reject Design
                </Button>
              </div>
            )}

            {/* If approved */}
            {selectedRequest.user_approval_status === 'approved' && (
              <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-lg">
                <p className="text-green-400 text-sm flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4" />
                  Design approved! Ready for payment.
                </p>
              </div>
            )}

            {/* If rejected */}
            {selectedRequest.user_approval_status === 'rejected' && (
              <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Design rejected.
                </p>
                {selectedRequest.user_rejection_reason && (
                  <p className="text-red-300 text-xs mt-2">
                    Reason: {selectedRequest.user_rejection_reason}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen 3D Viewer Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] bg-gray-900 border-2 border-cyan-500 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <Palette className="w-7 h-7 text-cyan-400" />
                3D Model Viewer - {attachment.name || 'Design File'}
              </DialogTitle>
              <Badge className={`${getApprovalStatusBadge(selectedRequest.user_approval_status)} border text-sm px-3 py-1`}>
                {selectedRequest.user_approval_status === 'approved' && '✓ Approved'}
                {selectedRequest.user_approval_status === 'rejected' && '✗ Rejected'}
                {isPending && '⏳ Pending Review'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 px-6 pb-6 flex flex-col" style={{ height: 'calc(100% - 120px)' }}>
            {/* 3D Viewer */}
            <div className="flex-1 bg-gray-950 rounded-lg mb-4 overflow-hidden border-2 border-gray-800 relative">
              {loading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-3" />
                  <span className="text-gray-300 text-lg">Loading 3D model...</span>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <span className="text-red-400 text-lg">{error}</span>
                  <p className="text-gray-400 text-sm mt-2">Please contact support if this persists</p>
                  <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700 max-w-md">
                    <p className="text-xs text-gray-300 mb-2">Debug Info:</p>
                    <p className="text-xs text-gray-400 break-all">File: {attachment.name}</p>
                    <p className="text-xs text-gray-400 break-all">Original URL: {attachment.url}</p>
                  </div>
                </div>
              )}
              {fileUrl && !loading && !error && (
                <>
                  <ModelViewerUrl url={fileUrl} fileName={attachment.name || 'model'} height="100%" />
                  <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-2 rounded-lg text-xs text-gray-300 border border-gray-700">
                    {attachment.url.startsWith('s3://') ? '☁️ Loaded from AWS S3' : '📁 Loaded from local server'}
                  </div>
                </>
              )}
            </div>

            {/* Controls info */}
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <p className="text-gray-300 text-sm text-center">
                🖱️ <span className="font-semibold">Mouse Controls:</span> Left-click & drag to rotate • Right-click & drag to pan • Scroll to zoom
              </p>
            </div>

            {/* Action Buttons */}
            {isPending && (
              <div className="flex gap-4">
                <Button 
                  onClick={() => {
                    setShowFullscreen(false);
                    onApprove();
                  }}
                  disabled={processingApproval}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                >
                  {processingApproval ? (
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-6 h-6 mr-2" />
                  )}
                  Approve Design & Proceed to Payment
                </Button>
                <Button 
                  onClick={() => {
                    setShowFullscreen(false);
                    onReject();
                  }}
                  disabled={processingApproval}
                  variant="outline"
                  className="flex-1 border-2 border-red-500 text-red-400 hover:bg-red-500/20 font-bold text-lg py-6"
                >
                  <X className="w-6 h-6 mr-2" />
                  Reject Design
                </Button>
              </div>
            )}

            {selectedRequest.user_approval_status === 'approved' && (
              <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-lg text-center">
                <p className="text-green-400 font-semibold flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  This design has been approved
                </p>
              </div>
            )}

            {selectedRequest.user_approval_status === 'rejected' && (
              <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-lg text-center">
                <p className="text-red-400 font-semibold flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  This design has been rejected
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
