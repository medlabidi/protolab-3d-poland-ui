import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { loadModel } from './loaders';
import { useModelAnalysis, ModelAnalysis } from './useModelAnalysis';
import { Loader2, Box as BoxIcon, AlertTriangle, FileX, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ModelViewerProps {
  file: File | null;
  onAnalysisComplete?: (analysis: ModelAnalysis) => void;
  onError?: (error: string | null) => void;
}

// Categorize errors for better UI
const getErrorInfo = (errorMessage: string): { icon: typeof AlertTriangle; title: string; color: string } => {
  const lowerError = errorMessage.toLowerCase();
  
  // Special case for 3MF files (informational, not an error)
  if (errorMessage.includes('3MF_NO_PREVIEW')) {
    return { icon: BoxIcon, title: '3MF File Accepted', color: 'text-blue-500' };
  }
  
  if (lowerError.includes('empty') || lowerError.includes('no valid 3d geometry')) {
    return { icon: FileX, title: 'Empty or Invalid File', color: 'text-orange-500' };
  }
  if (lowerError.includes('volume') || lowerError.includes('too small')) {
    return { icon: AlertTriangle, title: 'Geometry Too Small', color: 'text-yellow-500' };
  }
  if (lowerError.includes('corrupted') || lowerError.includes('failed to parse')) {
    return { icon: AlertCircle, title: 'Corrupted File', color: 'text-red-500' };
  }
  if (lowerError.includes('size') && (lowerError.includes('large') || lowerError.includes('exceeds'))) {
    return { icon: AlertTriangle, title: 'File Too Large', color: 'text-orange-500' };
  }
  if (lowerError.includes('unsupported') || lowerError.includes('format')) {
    return { icon: FileX, title: 'Unsupported Format', color: 'text-yellow-500' };
  }
  
  return { icon: BoxIcon, title: 'Failed to Load Model', color: 'text-destructive' };
};

export const ModelViewer = ({ file, onAnalysisComplete, onError }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysis = useModelAnalysis(geometry);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(100, 100, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(100, 100, 100);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-100, -100, -100);
    scene.add(directionalLight2);

    // Grid
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Load model when file changes
  useEffect(() => {
    if (!file) {
      setGeometry(null);
      setError(null);
      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current = null;
      }
      return;
    }

    setLoading(true);
    setError(null);

    loadModel(file)
      .then((loadedGeometry) => {
        // Handle 3MF files (null geometry = no preview available)
        if (!loadedGeometry) {
          const is3MF = file.name.toLowerCase().endsWith('.3mf');
          if (is3MF) {
            setGeometry(null);
            setError('3MF_NO_PREVIEW: 3MF files are accepted for printing but cannot be previewed. The file will still be processed for pricing and ordering.');
            onError?.('3MF_NO_PREVIEW');
            setLoading(false);
            return;
          }
        }
        
        setGeometry(loadedGeometry);
        setError(null);
        onError?.(null);

        // Remove old mesh
        if (meshRef.current && sceneRef.current) {
          sceneRef.current.remove(meshRef.current);
        }

        // Create new mesh
        const material = new THREE.MeshPhongMaterial({
          color: 0x2563eb,
          shininess: 30,
          flatShading: false,
        });

        const mesh = new THREE.Mesh(loadedGeometry, material);
        meshRef.current = mesh;
        sceneRef.current?.add(mesh);

        // Center and scale model
        loadedGeometry.computeBoundingBox();
        const box = loadedGeometry.boundingBox!;
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 100 / maxDim;

        mesh.scale.setScalar(scale);
        mesh.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        // Reset camera
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(100, 100, 100);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        setLoading(false);
      })
      .catch((err) => {
        const errorMessage = err.message || 'Failed to load model';
        setError(errorMessage);
        onError?.(errorMessage);
        setLoading(false);
      });
  }, [file]);

  // Notify parent when analysis is complete
  useEffect(() => {
    if (analysis && onAnalysisComplete) {
      onAnalysisComplete(analysis);
    }
  }, [analysis, onAnalysisComplete]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative" style={{ height: '400px' }}>
          <div ref={containerRef} className="w-full h-full" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading 3D model...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center max-w-md p-6">
                {(() => {
                  const errorInfo = getErrorInfo(error);
                  const IconComponent = errorInfo.icon;
                  // Strip technical prefix from error message
                  const displayError = error.replace(/^3MF_NO_PREVIEW:/, '').trim();
                  return (
                    <>
                      <IconComponent className={`w-12 h-12 ${errorInfo.color} mx-auto mb-2`} />
                      <p className={`text-sm font-bold ${errorInfo.color} mb-1`}>{errorInfo.title}</p>
                      <p className="text-xs text-muted-foreground">{displayError}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {!file && !loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <BoxIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Upload a 3D model to preview</p>
              </div>
            </div>
          )}
        </div>

        {analysis && (
          <div className="p-4 bg-muted border-t grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Volume</p>
              <p className="font-bold">{analysis.volumeCm3.toFixed(2)} cm³</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dimensions (cm)</p>
              <p className="text-sm font-mono">
                {analysis.boundingBox.x.toFixed(1)} × {analysis.boundingBox.y.toFixed(1)} × {analysis.boundingBox.z.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Surface Area</p>
              <p className="font-bold">{analysis.surfaceArea.toFixed(1)} cm²</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
