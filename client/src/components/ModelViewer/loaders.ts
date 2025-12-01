import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';

export const loadSTL = (file: File): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const geometry = loader.parse(arrayBuffer);
        resolve(geometry);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const loadSTLFromUrl = (url: string): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => resolve(geometry),
      undefined,
      (error) => reject(error)
    );
  });
};

export const loadOBJ = (file: File): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const object = loader.parse(text);
        
        // Extract geometry from the first mesh found
        let geometry: THREE.BufferGeometry | null = null;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            geometry = child.geometry;
          }
        });
        
        if (geometry) {
          resolve(geometry);
        } else {
          reject(new Error('No geometry found in OBJ file'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const loadOBJFromUrl = (url: string): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader();
    loader.load(
      url,
      (object) => {
        let geometry: THREE.BufferGeometry | null = null;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            geometry = child.geometry;
          }
        });
        
        if (geometry) {
          resolve(geometry);
        } else {
          reject(new Error('No geometry found in OBJ file'));
        }
      },
      undefined,
      (error) => reject(error)
    );
  });
};

export const loadModel = async (file: File): Promise<THREE.BufferGeometry> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'stl':
      return loadSTL(file);
    case 'obj':
      return loadOBJ(file);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
};

export const loadModelFromUrl = async (url: string, fileName: string): Promise<THREE.BufferGeometry> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'stl':
      return loadSTLFromUrl(url);
    case 'obj':
      return loadOBJFromUrl(url);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
};
