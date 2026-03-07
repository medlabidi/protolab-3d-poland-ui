import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Maximize2, Loader2, AlertCircle } from 'lucide-react';
import { useS3Url } from '@/hooks/useS3Url';

export interface Attachment {
  id?: string;
  name: string;
  url: string;
  type?: string;
}

export type DesignApprovalStatus = 'pending' | 'approved' | 'rejected';

interface ModelPreviewCardProps {
  attachment: Attachment;
  approvalStatus?: DesignApprovalStatus;
  onOpenFullscreen: () => void;
  showApprovalButtons?: boolean;
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
 * Preview card for 3D models
 * Shows a compact preview with option to open fullscreen viewer
 * Memoized to prevent unnecessary re-renders
 */
const ModelPreviewCardComponent = ({
  attachment,
  approvalStatus,
  onOpenFullscreen,
  showApprovalButtons = true,
}: ModelPreviewCardProps) => {
  const { url, loading, error } = useS3Url(attachment.url);

  const fileName = attachment.name || 'Design File';
  const isS3 = attachment.url.startsWith('s3://');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-semibold">3D Design Model</span>
        </div>
        {showApprovalButtons && (
          <Badge className={`${getApprovalStatusBadge(approvalStatus)} border`}>
            {getApprovalStatusText(approvalStatus)}
          </Badge>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-32 bg-gray-900 rounded">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
          <span className="text-gray-400 text-sm">Preparing preview...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-32 bg-red-900/20 rounded border border-red-500">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <span className="text-red-400 text-xs">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
            <Palette className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <p className="text-white font-medium mb-1">{fileName}</p>
            <p className="text-gray-400 text-xs mb-4">
              Click below to view in fullscreen 3D viewer
            </p>

            {isS3 && (
              <p className="text-blue-400 text-[10px] mb-3">
                ☁️ Hosted securely on AWS S3
              </p>
            )}

            <Button
              onClick={onOpenFullscreen}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              size="lg"
            >
              <Maximize2 className="w-5 h-5 mr-2" />
              Open 3D Viewer (Fullscreen)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const ModelPreviewCard = memo(ModelPreviewCardComponent);
