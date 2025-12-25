import { API_URL } from "@/config/api";

let refreshTimer: NodeJS.Timeout | null = null;

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
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
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
      console.log('✅ Token refreshed successfully');
      
      // Schedule next refresh
      scheduleTokenRefresh(data.tokens.accessToken);
      return true;
    } else {
      console.error('Token refresh failed:', response.status);
      // Token refresh failed, logout user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login';
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
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

  console.log(`⏰ Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);
  
  refreshTimer = setTimeout(() => {
    console.log('⏰ Auto-refreshing token...');
    refreshAccessToken();
  }, refreshTime);
};

/**
 * Initialize token refresh system
 */
export const initTokenRefresh = (): void => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
    scheduleTokenRefresh(accessToken);
  }
};

/**
 * Stop token refresh system (on logout)
 */
export const stopTokenRefresh = (): void => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};
