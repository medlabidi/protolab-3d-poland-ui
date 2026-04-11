import { API_URL } from "@/config/api";

let refreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Decode JWT and get expiration time
 */
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if the current access token is expired or about to expire
 */
export const isTokenExpired = (bufferMs = 60000): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) return true;

  const exp = getTokenExpiration(token);
  if (!exp) return true;

  return Date.now() >= exp - bufferMs;
};

/**
 * Refresh access token using refresh token.
 * Deduplicates concurrent calls — only one refresh request runs at a time.
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  // Deduplicate: if already refreshing, wait for that result
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefresh();

  try {
    return await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

async function doRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    console.error('No refresh token available');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      console.log('Token refreshed successfully');

      // Schedule next proactive refresh
      scheduleTokenRefresh(data.tokens.accessToken);
      return true;
    } else {
      console.error('Token refresh failed:', response.status);
      clearAuthAndRedirect();
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

/**
 * Get a valid access token, refreshing if needed.
 * Use this from any fetch call to ensure the token is fresh.
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  // If token is expired or expiring within 1 minute, refresh first
  if (isTokenExpired(60000)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
    return localStorage.getItem('accessToken');
  }

  return token;
};

/**
 * Clear all auth data and redirect to login
 */
const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

/**
 * Schedule automatic token refresh 5 minutes before expiration
 */
export const scheduleTokenRefresh = (token: string): void => {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  const expirationTime = getTokenExpiration(token);

  if (!expirationTime) {
    console.error('Cannot schedule refresh: invalid token');
    return;
  }

  // Refresh 5 minutes before expiration
  const refreshTime = expirationTime - Date.now() - (5 * 60 * 1000);

  if (refreshTime <= 0) {
    // Token already expired or about to expire, refresh immediately
    console.log('Token expired or about to expire, refreshing now');
    refreshAccessToken();
    return;
  }

  console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);

  refreshTimer = setTimeout(() => {
    console.log('Auto-refreshing token...');
    refreshAccessToken();
  }, refreshTime);
};

/**
 * Handle visibility change — when user returns to the tab,
 * check and refresh the token if needed. This is the key fix
 * for background tabs where setTimeout is unreliable.
 */
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (isTokenExpired(2 * 60 * 1000)) {
      // Token expired or expiring within 2 minutes — refresh now
      console.log('Tab became visible, token needs refresh');
      refreshAccessToken();
    } else {
      // Token still valid — re-schedule the timer (it may have been throttled)
      scheduleTokenRefresh(token);
    }
  }
};

/**
 * Initialize token refresh system
 */
export const initTokenRefresh = (): void => {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    scheduleTokenRefresh(accessToken);
  }

  // Listen for tab becoming visible again — this catches the case
  // where setTimeout was paused/delayed while the tab was in the background
  document.addEventListener('visibilitychange', handleVisibilityChange);
};

/**
 * Stop token refresh system (on logout)
 */
export const stopTokenRefresh = (): void => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
};
