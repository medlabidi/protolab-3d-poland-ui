import { useEffect } from 'react';

/**
 * Hook to handle network reconnection
 * Calls the provided callback when the browser comes back online
 */
export const useNetworkReconnect = (onReconnect: () => void) => {
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      // Small delay to ensure connection is stable
      setTimeout(() => {
        onReconnect();
      }, 500);
    };

    const handleOffline = () => {
      console.log('Network connection lost');
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also listen for page visibility changes (when coming back from sleep/hibernate)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.log('Page became visible, refreshing data');
        setTimeout(() => {
          onReconnect();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onReconnect]);
};
