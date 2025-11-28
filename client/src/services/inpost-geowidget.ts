/**
 * Frontend InPost Geowidget Integration
 * Use this when you have Geowidget token from InPost Manager
 */

declare global {
  interface Window {
    easyPackAsyncInit: () => void;
    easyPack: any;
  }
}

interface SelectedPoint {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Load InPost Geowidget script
 * Call this once when app initializes
 */
export function loadInPostGeowidget(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.easyPack) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://geowidget.easypack24.net/js/sdk-for-javascript.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('InPost Geowidget loaded');
      resolve();
    };

    script.onerror = () => {
      console.error('Failed to load InPost Geowidget');
      reject(new Error('Failed to load InPost Geowidget'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize InPost map widget
 * Opens a modal with interactive map for locker selection
 */
export function openInPostMap(
  token: string,
  onSelect: (point: SelectedPoint) => void,
  options?: {
    defaultLocation?: { latitude: number; longitude: number };
    types?: string[];
  }
) {
  if (!window.easyPack) {
    console.error('InPost Geowidget not loaded. Call loadInPostGeowidget first.');
    return;
  }

  try {
    window.easyPack.mapWidget('easypack-map', (point: any) => {
      console.log('Selected point:', point);
      
      onSelect({
        name: point.name,
        address: {
          line1: point.address_details.street,
          line2: `${point.address_details.post_code} ${point.address_details.city}`,
        },
        location: {
          latitude: point.location.latitude,
          longitude: point.location.longitude,
        },
      });
    }, {
      width: '100%',
      height: '500px',
      defaultLocale: 'pl',
      points: {
        types: options?.types || ['parcel_locker'],
      },
      map: {
        initialTypes: ['parcel_locker'],
      },
      ...(options?.defaultLocation && {
        mapPosition: {
          latitude: options.defaultLocation.latitude,
          longitude: options.defaultLocation.longitude,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to open InPost map:', error);
  }
}

/**
 * React Hook for InPost Geowidget
 */
export function useInPostGeowidget() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const token = import.meta.env.VITE_INPOST_GEOWIDGET_TOKEN;
    
    if (!token) {
      console.warn('VITE_INPOST_GEOWIDGET_TOKEN not set');
      return;
    }

    loadInPostGeowidget(token)
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err));
  }, []);

  const openMap = (
    onSelect: (point: SelectedPoint) => void,
    options?: Parameters<typeof openInPostMap>[2]
  ) => {
    const token = import.meta.env.VITE_INPOST_GEOWIDGET_TOKEN;
    if (!token) {
      console.error('VITE_INPOST_GEOWIDGET_TOKEN not set');
      return;
    }
    openInPostMap(token, onSelect, options);
  };

  return {
    isLoaded,
    error,
    openMap,
  };
}

// Import this in your component
import { useState, useEffect } from 'react';
