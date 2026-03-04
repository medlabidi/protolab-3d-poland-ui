import { useEffect, useRef, useState, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { use3DModelLoader } from '@/hooks/use3DModelLoader';
import { Loader2, AlertCircle, Box as BoxIcon } from 'lucide-react';

interface ThreeViewerProps {
  modelUrl: string | null;
  fileName: string;
  height?: string;
  autoRotate?: boolean;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Reusable Three.js viewer component for 3D models
 * Handles scene setup, controls, and resource cleanup
 * Memoized to prevent unnecessary re-renders
 */
const ThreeViewerComponent = ({
  modelUrl,
  fileName,
  height = '400px',
  autoRotate = true,
  onError,
  className = '',
}: ThreeViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);

  const [sceneInitialized, setSceneInitialized] = useState(false);

  // Use the 3D model loader hook
  const { geometry, loading, error } = use3DModelLoader(modelUrl, fileName);

  /**
   * Initialize Three.js scene
   */
  useEffect(() => {
    if (!containerRef.current || sceneInitialized) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark background
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / containerHeight, 0.1, 10000);
    camera.position.set(100, 100, 100);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit to 2 for performance
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(100, 100, 100);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-100, -100, -100);
    scene.add(directionalLight2);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;

      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    setSceneInitialized(true);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);

      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Dispose controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }

      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      animationRef.current = null;
    };
  }, [autoRotate]);

  /**
   * Add/update model in scene when geometry is loaded
   */
  useEffect(() => {
    if (!geometry || !sceneRef.current || !cameraRef.current) return;

    // Remove previous mesh if exists
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      if (meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }
      if (meshRef.current.material) {
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach(mat => mat.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }
      meshRef.current = null;
    }

    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: 0x00a8ff,
      shininess: 50,
      flatShading: false,
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;

    // Center and scale the model
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox!;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    mesh.position.sub(center);

    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 100 / maxDim;
    mesh.scale.setScalar(scale);

    // Add to scene
    sceneRef.current.add(mesh);

    // Adjust camera
    cameraRef.current.position.set(100, 100, 100);
    cameraRef.current.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }

    // Cleanup function
    return () => {
      if (meshRef.current) {
        if (sceneRef.current) {
          sceneRef.current.remove(meshRef.current);
        }
        if (meshRef.current.material) {
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(mat => mat.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }
        meshRef.current = null;
      }
    };
  }, [geometry]);

  /**
   * Report errors to parent
   */
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-3" />
          <span className="text-gray-400 text-sm">Loading 3D model...</span>
          <span className="text-gray-500 text-xs mt-1">{fileName}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 border-2 border-red-500 rounded-lg z-10">
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <span className="text-red-400 text-sm font-semibold mb-1">Failed to load model</span>
          <span className="text-red-300 text-xs max-w-md text-center px-4">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!modelUrl && !loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-10">
          <BoxIcon className="w-12 h-12 text-gray-500 mb-3" />
          <span className="text-gray-500 text-sm">No model to display</span>
        </div>
      )}

      {/* Controls hint (only show when model is loaded) */}
      {geometry && !loading && !error && (
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <span>🖱️ Left click + drag: Rotate</span>
            <span>🖱️ Right click + drag: Pan</span>
            <span>🖱️ Scroll: Zoom</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const ThreeViewer = memo(ThreeViewerComponent);
