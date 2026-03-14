import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThreeViewer } from '@/components/ThreeViewer/ThreeViewer';
import { Check, X, Download, Loader2, Lock } from 'lucide-react';
import { DesignApprovalStatus } from './ModelPreviewCard';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface ModelViewerModalProps {
  open: boolean;
  onClose: () => void;
  modelUrl: string | null;
  fileName: string;
  approvalStatus?: DesignApprovalStatus;
  onApprove?: () => void;
  onReject?: () => void;
  onDownload?: () => void;
  processingApproval?: boolean;
  downloading?: boolean;
  downloadBlocked?: boolean;
}

const getApprovalStatusBadge = (status?: DesignApprovalStatus) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500';
    default:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
  }
};

const getApprovalStatusText = (status?: DesignApprovalStatus) => {
  switch (status) {
    case 'approved':
      return '✓ Approved';
    case 'rejected':
      return '✗ Rejected';
    default:
      return '⏳ Pending Review';
  }
};

/**
 * Fullscreen modal for viewing 3D models
 * Includes approval/rejection controls and download functionality
 * Memoized to prevent unnecessary re-renders
 */
const ModelViewerModalComponent = ({
  open,
  onClose,
  modelUrl,
  fileName,
  approvalStatus,
  onApprove,
  onReject,
  onDownload,
  processingApproval = false,
  downloading = false,
  downloadBlocked = false,
}: ModelViewerModalProps) => {
  const isPending = !approvalStatus || approvalStatus === 'pending';
  const showApprovalButtons = isPending && (onApprove || onReject);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 bg-gray-900 border-gray-700">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
                <span>{fileName}</span>
                {approvalStatus && (
                  <Badge className={`${getApprovalStatusBadge(approvalStatus)} border`}>
                    {getApprovalStatusText(approvalStatus)}
                  </Badge>
                )}
              </DialogTitle>
              {onDownload && (
                <Button
                  onClick={onDownload}
                  disabled={downloading}
                  variant="outline"
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              )}
              {!onDownload && downloadBlocked && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        disabled
                        className="border-yellow-500/50 text-yellow-400 opacity-70 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Pay to Download
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-600 text-gray-200">
                      <p>Complete payment to download this design file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </DialogHeader>

          {/* 3D Viewer */}
          <div className="flex-1 p-6 overflow-hidden">
            <ThreeViewer
              modelUrl={modelUrl}
              fileName={fileName}
              height="100%"
              autoRotate={true}
              className="h-full"
            />
          </div>

          {/* Footer with approval buttons */}
          {showApprovalButtons && (
            <div className="px-6 pb-6 pt-4 border-t border-gray-700">
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm mb-2 font-semibold">
                  Review this design
                </p>
                <p className="text-gray-400 text-xs">
                  Approve to proceed with payment and production, or reject to request changes.
                </p>
              </div>

              <div className="flex gap-3">
                {onApprove && (
                  <Button
                    onClick={onApprove}
                    disabled={processingApproval}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-12"
                    size="lg"
                  >
                    {processingApproval ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5 mr-2" />
                    )}
                    Approve & Pay
                  </Button>
                )}

                {onReject && (
                  <Button
                    onClick={onReject}
                    disabled={processingApproval}
                    variant="outline"
                    className="flex-1 border-2 border-red-500 text-red-400 hover:bg-red-500/20 font-semibold h-12"
                    size="lg"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Reject Design
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Approval status messages */}
          {approvalStatus === 'approved' && (
            <div className="px-6 pb-6 pt-4 border-t border-gray-700">
              <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-lg">
                <p className="text-green-400 text-sm flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Design Approved</span>
                </p>
                <p className="text-green-300 text-xs">
                  You have approved this design. Payment and production will proceed.
                </p>
              </div>
            </div>
          )}

          {approvalStatus === 'rejected' && (
            <div className="px-6 pb-6 pt-4 border-t border-gray-700">
              <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
                <p className="text-red-400 text-sm flex items-center gap-2 mb-2">
                  <X className="w-5 h-5" />
                  <span className="font-semibold">Design Rejected</span>
                </p>
                <p className="text-red-300 text-xs">
                  You have rejected this design. The engineer will be notified.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const ModelViewerModal = memo(ModelViewerModalComponent);
