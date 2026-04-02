/**
 * Centralized API helper with automatic token refresh
 */

import { getValidAccessToken, refreshAccessToken } from '@/utils/tokenRefresh';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
};

/**
 * Make an authenticated API request with automatic token refresh
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getValidAccessToken();

  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type to JSON
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401) {
    console.log('Got 401, attempting token refresh...');

    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken = localStorage.getItem('accessToken');
      console.log('Token refreshed, retrying request...');
      const retryHeaders: HeadersInit = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
      };

      if (!(options.body instanceof FormData)) {
        (retryHeaders as Record<string, string>)['Content-Type'] = 'application/json';
      }

      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // Refresh failed, redirect to login
      console.log('Token refresh failed, redirecting to login...');
      clearAuthData();
      window.location.href = '/signin';
    }
  }

  return response;
};

/**
 * Make an authenticated FormData request with automatic token refresh
 */
export const apiFormData = async (
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getValidAccessToken();

  const headers: HeadersInit = {};

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Note: Don't set Content-Type for FormData - browser will set it with boundary
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    ...options,
    headers,
    body: formData,
  });

  // If we get a 401 or 403, try to refresh the token and retry once
  if (response.status === 401 || response.status === 403) {
    console.log(`Got ${response.status} on FormData request, attempting token refresh...`);

    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken = localStorage.getItem('accessToken');
      console.log('Token refreshed, retrying FormData request...');
      return fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        ...options,
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
        body: formData,
      });
    } else {
      console.log('Token refresh failed, redirecting to login...');
      clearAuthData();
      window.location.href = '/signin';
    }
  }

  return response;
};

export { API_URL };
