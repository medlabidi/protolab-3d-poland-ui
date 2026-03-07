import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { loadModelFromUrl } from '@/components/ModelViewer/loaders';

interface Use3DModelLoaderOptions {
  enabled?: boolean;
  timeout?: number;
  autoLoad?: boolean;
}

interface Use3DModelLoaderResult {
  geometry: THREE.BufferGeometry | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  cleanup: () => void;
}

/**
 * Custom hook to load 3D models from URLs with proper Three.js resource management
 * Handles geometry loading, cleanup, and lifecycle management
 */
export function use3DModelLoader(
  url: string | null,
  fileName: string,
  options: Use3DModelLoaderOptions = {}
): Use3DModelLoaderResult {
  const {
    enabled = true,
    timeout = 30000, // 30 seconds default timeout
    autoLoad = true,
  } = options;

  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  /**
   * Cleanup function to dispose of Three.js resources
   */
  const cleanup = useCallback(() => {
    if (geometryRef.current) {
      geometryRef.current.dispose();
      geometryRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  /**
   * Load the 3D model from URL
   */
  const loadModel = useCallback(async () => {
    if (!url || !fileName || !enabled) {
      setLoading(false);
      return;
    }

    // Cleanup previous resources
    cleanup();

    setLoading(true);
    setError(null);
    setGeometry(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Setup timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutIdRef.current = window.setTimeout(() => {
        reject(new Error('Model loading timeout. The file may be too large or the connection is slow.'));
      }, timeout);
    });

    try {
      // Race between loading and timeout
      const loadedGeometry = await Promise.race([
        loadModelFromUrl(url, fileName),
        timeoutPromise,
      ]);

      // Check if we were aborted
      if (abortControllerRef.current?.signal.aborted) {
        loadedGeometry.dispose();
        return;
      }

      // Clear timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // Store reference for cleanup
      geometryRef.current = loadedGeometry;
      setGeometry(loadedGeometry);
      setError(null);
    } catch (err: any) {
      // Don't treat abort as error
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('[use3DModelLoader] Error loading model:', err);
      setError(err.message || 'Failed to load 3D model');
      setGeometry(null);
    } finally {
      setLoading(false);

      // Clear timeout if still exists
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }
  }, [url, fileName, enabled, timeout, cleanup]);

  /**
   * Manual reload function
   */
  const reload = useCallback(() => {
    loadModel();
  }, [loadModel]);

  /**
   * Auto-load effect
   */
  useEffect(() => {
    if (autoLoad) {
      loadModel();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      cleanup();
    };
  }, [url, fileName, enabled, autoLoad]);

  return {
    geometry,
    loading,
    error,
    reload,
    cleanup,
  };
}
