/**
 * Check if a file is a 3D model based on its extension
 * @param filename - The name of the file to check
 * @returns true if the file is a 3D model format, false otherwise
 */
export function is3DFile(filename: string): boolean {
  if (!filename) {
    return false;
  }

  const ext = filename.toLowerCase().split('.').pop();
  const supported3DFormats = ['stl', 'obj', '3mf', 'glb', 'gltf', 'step', 'stp', 'iges', 'igs'];

  return supported3DFormats.includes(ext || '');
}

/**
 * Get file extension from filename
 * @param filename - The name of the file
 * @returns The lowercase file extension without the dot, or empty string if none
 */
export function getFileExtension(filename: string): string {
  if (!filename) {
    return '';
  }

  return filename.toLowerCase().split('.').pop() || '';
}

/**
 * Get base filename without extension
 * @param filename - The name of the file
 * @returns The filename without extension
 */
export function getFileBaseName(filename: string): string {
  if (!filename) {
    return '';
  }

  const parts = filename.split('.');
  if (parts.length === 1) {
    return filename;
  }

  return parts.slice(0, -1).join('.');
}

/**
 * Check if a file is an image based on its extension or MIME type
 */
export function isImageFile(filename: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith('image/')) return true;
  if (!filename) return false;
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
}

/**
 * Check if a file is a PDF based on its extension or MIME type
 */
export function isPdfFile(filename: string, mimeType?: string): boolean {
  if (mimeType === 'application/pdf') return true;
  if (!filename) return false;
  return filename.toLowerCase().split('.').pop() === 'pdf';
}

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
