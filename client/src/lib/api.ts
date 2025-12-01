/**
 * Centralized API helper with automatic token refresh
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      return data.tokens.accessToken;
    } else {
      console.log('Failed to refresh token:', response.status);
      // Token refresh failed - user needs to login again
      clearAuthData();
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthData();
    return null;
  }
};

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
 * Get the current access token, refreshing if needed
 */
const getValidToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    return null;
  }

  // Check if token is about to expire (within 1 minute)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (expiresAt - now < oneMinute) {
      // Token is about to expire, refresh it
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }
      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
      return newToken;
    }
  } catch (e) {
    // If we can't decode the token, try to use it anyway
    console.warn('Could not decode token:', e);
  }

  return token;
};

/**
 * Make an authenticated API request with automatic token refresh
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getValidToken();
  
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
    
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the request with the new token
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
  const token = await getValidToken();

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

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401) {
    console.log('Got 401 on FormData request, attempting token refresh...');
    
    const newToken = await refreshAccessToken();
    
    if (newToken) {
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
