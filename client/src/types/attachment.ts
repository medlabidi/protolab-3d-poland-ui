/**
 * Represents a file attachment in messages or design requests
 */
export interface Attachment {
  id?: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
  created_at?: string;
  access_type?: 'free' | 'paid' | 'preview_only';
  download_allowed?: boolean;
  payment_status?: string;
  price?: number;
  file_path?: string;
  original_name?: string;
  file_size?: number;
  mime_type?: string;
  source?: 'user' | 'thingiverse' | 'system';
}

/**
 * Message in a conversation
 */
export interface Message {
  id: string;
  sender_type: 'user' | 'engineer' | 'system';
  message: string;
  attachments: Attachment[];
  created_at: string;
  is_read: boolean;
}

/**
 * Design approval status
 */
export type DesignApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Type guard to check if a value is a valid DesignApprovalStatus
 */
export function isDesignApprovalStatus(value: unknown): value is DesignApprovalStatus {
  return (
    typeof value === 'string' &&
    ['pending', 'approved', 'rejected'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid Attachment
 */
export function isAttachment(value: unknown): value is Attachment {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.name === 'string' &&
    typeof obj.url === 'string'
  );
}

/**
 * Validate array of attachments
 */
export function validateAttachments(attachments: unknown): Attachment[] {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.filter(isAttachment);
}
