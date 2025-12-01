import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { loadModelFromUrl } from './loaders';
import { Loader2, Box as BoxIcon } from 'lucide-react';

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

    setLoading(true);
    setError(null);

    loadModelFromUrl(url, fileName)
      .then((loadedGeometry) => {
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
        console.error('Error loading model:', err);
        setError(err.message || 'Failed to load model');
        setLoading(false);
      });
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
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center max-w-md p-4">
            <BoxIcon className="w-10 h-10 text-destructive mx-auto mb-2" />
            <p className="text-sm font-bold text-destructive mb-1">Failed to load model</p>
            <p className="text-xs text-muted-foreground">{error}</p>
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
