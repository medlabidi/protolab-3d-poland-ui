import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/config/api';

interface UseS3UrlOptions {
  retryCount?: number;
  retryDelay?: number;
  enabled?: boolean;
}

interface UseS3UrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to resolve S3 URLs to signed URLs
 * Handles caching, retries, and cleanup
 */
export function useS3Url(
  fileUrl: string | null | undefined,
  options: UseS3UrlOptions = {}
): UseS3UrlResult {
  const {
    retryCount = 2,
    retryDelay = 1000,
    enabled = true,
  } = options;

  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const resolveUrl = async (attemptCount = 0): Promise<void> => {
    if (!fileUrl || !enabled) {
      setLoading(false);
      return;
    }

    // Check cache first
    if (cacheRef.current.has(fileUrl)) {
      setUrl(cacheRef.current.get(fileUrl)!);
      setLoading(false);
      setError(null);
      return;
    }

    // If not S3 URL, handle local/HTTP URLs
    if (!fileUrl.startsWith('s3://')) {
      let resolvedUrl = fileUrl;

      if (fileUrl.startsWith('http')) {
        resolvedUrl = fileUrl;
      } else {
        // For local paths, construct proper URL
        const baseUrl = API_URL.replace('/api', '');
        const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        resolvedUrl = `${baseUrl}${path}`;
      }

      cacheRef.current.set(fileUrl, resolvedUrl);
      setUrl(resolvedUrl);
      setLoading(false);
      setError(null);
      return;
    }

    // S3 URL - need to get signed URL
    setLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/files/signed-url?fileUrl=${encodeURIComponent(fileUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.signedUrl) {
        throw new Error('No signed URL returned from server');
      }

      // Cache the result
      cacheRef.current.set(fileUrl, data.signedUrl);
      setUrl(data.signedUrl);
      setError(null);
    } catch (err: any) {
      // Don't treat abort as error
      if (err.name === 'AbortError') {
        return;
      }

      console.error('[useS3Url] Error resolving URL:', err);

      // Retry logic
      if (attemptCount < retryCount) {
        setTimeout(() => {
          resolveUrl(attemptCount + 1);
        }, retryDelay * (attemptCount + 1));
        return;
      }

      setError(err.message || 'Failed to resolve file URL');
      setUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolveUrl();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fileUrl, enabled]);

  const refetch = () => {
    // Clear cache for this URL
    if (fileUrl) {
      cacheRef.current.delete(fileUrl);
    }
    resolveUrl();
  };

  return { url, loading, error, refetch };
}
