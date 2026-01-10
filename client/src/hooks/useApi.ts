import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const request = useCallback(async <R = T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any,
    options: UseApiOptions = {}
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: getAuthHeaders(),
        ...(body && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      setData(result);

      if (options.showSuccessToast !== false && options.successMessage) {
        toast.success(options.successMessage);
      }

      setLoading(false);
      return result as R;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);

      if (options.showErrorToast !== false) {
        toast.error(errorMessage);
      }

      setLoading(false);
      return null;
    }
  }, []);

  const get = useCallback(
    <R = T>(endpoint: string, options?: UseApiOptions) => 
      request<R>(endpoint, 'GET', undefined, options),
    [request]
  );

  const post = useCallback(
    <R = T>(endpoint: string, body: any, options?: UseApiOptions) => 
      request<R>(endpoint, 'POST', body, options),
    [request]
  );

  const put = useCallback(
    <R = T>(endpoint: string, body: any, options?: UseApiOptions) => 
      request<R>(endpoint, 'PUT', body, options),
    [request]
  );

  const patch = useCallback(
    <R = T>(endpoint: string, body: any, options?: UseApiOptions) => 
      request<R>(endpoint, 'PATCH', body, options),
    [request]
  );

  const del = useCallback(
    <R = T>(endpoint: string, options?: UseApiOptions) => 
      request<R>(endpoint, 'DELETE', undefined, options),
    [request]
  );

  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    patch,
    del,
    request,
  };
}
