// Web Worker for compiling OpenSCAD code to STL via WASM
// Adapted from CADAM project (https://github.com/Adam-CAD/CADAM)
/* eslint-disable no-restricted-globals */

// Worker global scope helpers
const workerScope: any = globalThis;

interface WorkerRequest {
  id: string;
  type: 'compile';
  code: string;
  params?: Array<{ name: string; value: string | number | boolean }>;
}

interface WorkerResponse {
  id: string;
  type: 'compile';
  output?: Uint8Array;
  log: { stdOut: string[]; stdErr: string[] };
  error?: string;
  duration: number;
}

let OpenSCADModule: any = null;

async function getInstance(
  code: string,
  params: Array<{ name: string; value: string | number | boolean }> = []
) {
  // Import the OpenSCAD WASM module
  if (!OpenSCADModule) {
    // In a web worker, importScripts loads the Emscripten JS glue
    workerScope.importScripts('/vendor/openscad-wasm/openscad.js');
  }

  const stdOut: string[] = [];
  const stdErr: string[] = [];

  // Create a fresh instance each time (CADAM notes persistent instances have bugs)
  const instance = await (workerScope as any).OpenSCAD({
    noInitialRun: true,
    locateFile: (path: string) => `/vendor/openscad-wasm/${path}`,
    print: (text: string) => stdOut.push(text),
    printErr: (text: string) => stdErr.push(text),
  });

  // Write the OpenSCAD code to the virtual filesystem
  instance.FS.writeFile('/input.scad', code);

  // Build CLI arguments
  const args = [
    '/input.scad',
    '-o', '/output.stl',
    '--export-format=binstl',
    '--enable=manifold',
    '--enable=fast-csg',
    '--enable=lazy-union',
  ];

  // Add parameter overrides as -D flags
  for (const p of params) {
    let serialized: string;
    if (typeof p.value === 'string') {
      serialized = `"${p.value}"`;
    } else {
      serialized = String(p.value);
    }
    args.push('-D', `${p.name}=${serialized}`);
  }

  return { instance, args, stdOut, stdErr };
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, code, params } = event.data;

  if (type !== 'compile') {
    workerScope.postMessage({ id, type, error: 'Unknown message type', log: { stdOut: [], stdErr: [] }, duration: 0 });
    return;
  }

  const start = performance.now();

  try {
    const { instance, args, stdOut, stdErr } = await getInstance(code, params || []);

    const exitCode = instance.callMain(args);
    const duration = performance.now() - start;

    if (exitCode !== 0) {
      workerScope.postMessage({
        id,
        type: 'compile',
        error: stdErr.join('\n') || `OpenSCAD exited with code ${exitCode}`,
        log: { stdOut, stdErr },
        duration,
      } as WorkerResponse);
      return;
    }

    // Read the output STL file
    const output = instance.FS.readFile('/output.stl', { encoding: 'binary' }) as Uint8Array;

    workerScope.postMessage(
      { id, type: 'compile', output, log: { stdOut, stdErr }, duration } as WorkerResponse,
      [output.buffer] // Transfer the buffer for performance
    );
  } catch (err: any) {
    const duration = performance.now() - start;
    workerScope.postMessage({
      id,
      type: 'compile',
      error: err.message || 'Compilation failed',
      log: { stdOut: [], stdErr: [err.message || 'Unknown error'] },
      duration,
    } as WorkerResponse);
  }
};
