import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useOpenSCADWorker } from '@/hooks/useOpenSCADWorker';
import { Loader2, Play, Upload, RotateCcw, AlertCircle, Code } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';

export interface Parameter {
  name: string;
  displayName: string;
  value: string | boolean | number;
  defaultValue: string | boolean | number;
  type?: 'string' | 'number' | 'boolean';
  description?: string;
  range?: { min?: number; max?: number; step?: number };
  options?: Array<{ value: string | number; label: string }>;
}

interface OpenSCADEditorProps {
  code: string;
  parameters: Parameter[];
  onExport: (stlData: Uint8Array) => void;
  onRegenerate?: () => void;
}

export function OpenSCADEditor({ code, parameters: initialParameters, onExport, onRegenerate }: OpenSCADEditorProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [parameters, setParameters] = useState<Parameter[]>(initialParameters);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileLog, setCompileLog] = useState<string[]>([]);
  const [stlData, setStlData] = useState<Uint8Array | null>(null);
  const [showCode, setShowCode] = useState(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);

  const { compile, ready: workerReady, compiling } = useOpenSCADWorker();

  // Update code when prop changes
  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  useEffect(() => {
    setParameters(initialParameters);
  }, [initialParameters]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!viewerRef.current) return;

    const container = viewerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(100, 100, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // Grid
    const gridHelper = new THREE.GridHelper(200, 20, 0x444466, 0x333355);
    scene.add(gridHelper);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load STL into Three.js scene
  const loadSTLIntoScene = useCallback((data: Uint8Array) => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    // Remove previous mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }

    const loader = new STLLoader();
    const geometry = loader.parse(data.buffer as ArrayBuffer);

    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    const bbox = geometry.boundingBox!;
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const material = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      specular: 0x444444,
      shininess: 30,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Fit camera
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    cameraRef.current.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  // Compile OpenSCAD code
  const handleCompile = useCallback(async () => {
    setCompileError(null);
    setCompileLog([]);

    try {
      const paramOverrides = parameters.map(p => ({
        name: p.name,
        value: p.value,
      }));

      const result = await compile(currentCode, paramOverrides);

      if (result.error) {
        setCompileError(result.error);
        setCompileLog(result.log.stdErr);
        return;
      }

      if (result.output) {
        setStlData(result.output);
        loadSTLIntoScene(result.output);
        setCompileLog(result.log.stdOut);
      }
    } catch (err: any) {
      setCompileError(err.message || 'Compilation failed');
    }
  }, [currentCode, parameters, compile, loadSTLIntoScene]);

  // Auto-compile on initial load
  useEffect(() => {
    if (workerReady && currentCode) {
      handleCompile();
    }
  }, [workerReady]); // Only on initial worker ready

  // Handle parameter change
  const handleParamChange = useCallback((name: string, newValue: string | number | boolean) => {
    setParameters(prev =>
      prev.map(p => (p.name === name ? { ...p, value: newValue } : p))
    );
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (stlData) {
      onExport(stlData);
    }
  }, [stlData, onExport]);

  return (
    <div className="space-y-3">
      {/* 3D Viewport */}
      <div
        ref={viewerRef}
        className="rounded-xl overflow-hidden border border-indigo-700/50 bg-[#1a1a2e]"
        style={{ height: '300px' }}
      />

      {/* Compile controls */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleCompile}
          disabled={compiling || !workerReady}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {compiling ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Compiling...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" />Compile</>
          )}
        </Button>
        {stlData && (
          <Button
            size="sm"
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />Upload STL
          </Button>
        )}
        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />Regenerate
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCode(!showCode)}
          className="ml-auto border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <Code className="w-4 h-4 mr-2" />{showCode ? 'Hide' : 'Show'} Code
        </Button>
      </div>

      {/* Error display */}
      {compileError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <div className="flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <pre className="whitespace-pre-wrap text-xs font-mono">{compileError}</pre>
          </div>
        </div>
      )}

      {/* Parameter sliders */}
      {parameters.length > 0 && (
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parameters</p>
          {parameters.map(param => (
            <div key={param.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-300">{param.displayName}</label>
                {param.type === 'number' && (
                  <span className="text-xs text-indigo-400 font-mono">{param.value}</span>
                )}
              </div>
              {param.description && (
                <p className="text-[10px] text-gray-500">{param.description}</p>
              )}
              {param.options ? (
                <select
                  value={String(param.value)}
                  onChange={(e) => {
                    const numVal = parseFloat(e.target.value);
                    handleParamChange(param.name, isNaN(numVal) ? e.target.value : numVal);
                  }}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                >
                  {param.options.map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              ) : param.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={param.value as boolean}
                  onChange={(e) => handleParamChange(param.name, e.target.checked)}
                  className="accent-indigo-500"
                />
              ) : param.type === 'number' && param.range ? (
                <input
                  type="range"
                  min={param.range.min ?? 0}
                  max={param.range.max ?? (param.defaultValue as number) * 3}
                  step={param.range.step ?? 1}
                  value={param.value as number}
                  onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              ) : param.type === 'number' ? (
                <input
                  type="number"
                  value={param.value as number}
                  onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                />
              ) : (
                <input
                  type="text"
                  value={String(param.value)}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                />
              )}
            </div>
          ))}
          <Button
            size="sm"
            onClick={handleCompile}
            disabled={compiling}
            className="w-full bg-indigo-600/50 hover:bg-indigo-600/70 text-white text-xs"
          >
            {compiling ? 'Compiling...' : 'Apply Changes'}
          </Button>
        </div>
      )}

      {/* Code view (toggle) */}
      {showCode && (
        <div className="rounded-lg bg-gray-900 border border-gray-700 p-3">
          <textarea
            value={currentCode}
            readOnly
            className="w-full h-48 bg-transparent text-xs font-mono text-gray-300 resize-y border-none outline-none"
            spellCheck={false}
          />
        </div>
      )}

      {/* Compile log */}
      {compileLog.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-400">Compile log ({compileLog.length} lines)</summary>
          <pre className="mt-1 p-2 bg-gray-900/50 rounded text-[10px] font-mono max-h-32 overflow-y-auto">
            {compileLog.join('\n')}
          </pre>
        </details>
      )}
    </div>
  );
}
