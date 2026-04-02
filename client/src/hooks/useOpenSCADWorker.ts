import { useRef, useCallback, useEffect, useState } from 'react';

interface CompileResult {
  output?: Uint8Array;
  log: { stdOut: string[]; stdErr: string[] };
  error?: string;
  duration: number;
}

interface PendingRequest {
  resolve: (result: CompileResult) => void;
  reject: (error: Error) => void;
}

export function useOpenSCADWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const [ready, setReady] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const idCounter = useRef(0);

  useEffect(() => {
    // Load the worker from public/ as a plain classic JS worker
    // (not bundled by Vite, so importScripts works for loading the Emscripten WASM glue)
    const worker = new Worker('/vendor/openscad-wasm/openscad-worker.js');

    worker.onmessage = (event) => {
      const { id, output, log, error, duration } = event.data;
      const pending = pendingRef.current.get(id);
      if (pending) {
        pendingRef.current.delete(id);
        pending.resolve({ output, log, error, duration });
      }
    };

    worker.onerror = (event) => {
      console.error('[OpenSCAD Worker] Error:', event);
      // Reject all pending requests
      for (const [id, pending] of pendingRef.current) {
        pending.reject(new Error('Worker error'));
        pendingRef.current.delete(id);
      }
    };

    workerRef.current = worker;
    setReady(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, []);

  const compile = useCallback(
    async (
      code: string,
      params?: Array<{ name: string; value: string | number | boolean }>
    ): Promise<CompileResult> => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const id = `compile-${++idCounter.current}`;
      setCompiling(true);

      try {
        const result = await new Promise<CompileResult>((resolve, reject) => {
          pendingRef.current.set(id, { resolve, reject });
          workerRef.current!.postMessage({ id, type: 'compile', code, params });
        });
        return result;
      } finally {
        setCompiling(false);
      }
    },
    []
  );

  return { compile, ready, compiling };
}
