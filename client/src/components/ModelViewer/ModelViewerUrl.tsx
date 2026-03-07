import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { loadModelFromUrl } from './loaders';
import { Loader2, Box as BoxIcon, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModelViewerUrlProps {
  url: string | null;
  fileName: string;
  height?: string;
}

export const ModelViewerUrl = ({ url, fileName, height = '300px' }: ModelViewerUrlProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      animationRef.current = requestAnimationFrame(animate);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load model when URL changes
  useEffect(() => {
    if (!url || !fileName) {
      setError(null);
      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current = null;
      }
      return;
    }

    console.log('[ModelViewer] Loading model:', { url, fileName });

    setLoading(true);
    setError(null);

    // Add timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      setError('Loading timeout: The file is taking too long to load. Please check your connection or try again.');
      setLoading(false);
    }, 30000); // 30 second timeout

    loadModelFromUrl(url, fileName)
      .then((loadedGeometry) => {
        clearTimeout(timeoutId);
        
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
        clearTimeout(timeoutId);
        console.error('Error loading model:', err);
        
        // Provide more user-friendly error messages
        let errorMessage = 'Failed to load model';
        if (err.message) {
          if (err.message.includes('Failed to fetch') || err.message.includes('HTTP')) {
            errorMessage = 'Unable to download the file. Please check your internet connection.';
          } else if (err.message.includes('empty') || err.message.includes('corrupted')) {
            errorMessage = 'The file appears to be empty or corrupted. Please contact support.';
          } else if (err.message.includes('too large')) {
            errorMessage = 'The file is too large to preview.';
          } else if (err.message.includes('Invalid') || err.message.includes('parse')) {
            errorMessage = 'Invalid or corrupted 3D model file.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      });

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [url, fileName]);

  return (
    <div className="relative rounded-lg overflow-hidden border bg-muted" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center max-w-md p-6 bg-background/95 rounded-lg border border-destructive/20">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-sm font-bold text-destructive mb-2">Failed to load 3D preview</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            {url && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File Anyway
                </Button>
                <p className="text-xs text-muted-foreground/70">
                  You can download the file and open it in external software
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!url && !loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <BoxIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No 3D model available</p>
          </div>
        </div>
      )}
    </div>
  );
};
