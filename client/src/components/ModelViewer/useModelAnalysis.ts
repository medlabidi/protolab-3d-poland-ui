import { useMemo } from 'react';
import * as THREE from 'three';

export interface ModelAnalysis {
  volumeCm3: number;
  boundingBox: { x: number; y: number; z: number };
  surfaceArea: number;
  weightGrams: number | null;
}

const calculateVolume = (geometry: THREE.BufferGeometry): number => {
  // Compute volume using mesh divergence theorem
  const position = geometry.attributes.position;
  let volume = 0;

  if (geometry.index) {
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(position, indices[i]);
      const b = new THREE.Vector3().fromBufferAttribute(position, indices[i + 1]);
      const c = new THREE.Vector3().fromBufferAttribute(position, indices[i + 2]);

      // Calculate signed volume of tetrahedron
      volume += a.dot(b.cross(c)) / 6;
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(position, i);
      const b = new THREE.Vector3().fromBufferAttribute(position, i + 1);
      const c = new THREE.Vector3().fromBufferAttribute(position, i + 2);

      volume += a.dot(b.cross(c)) / 6;
    }
  }

  return Math.abs(volume);
};

const calculateSurfaceArea = (geometry: THREE.BufferGeometry): number => {
  const position = geometry.attributes.position;
  let area = 0;

  if (geometry.index) {
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(position, indices[i]);
      const b = new THREE.Vector3().fromBufferAttribute(position, indices[i + 1]);
      const c = new THREE.Vector3().fromBufferAttribute(position, indices[i + 2]);

      const ab = new THREE.Vector3().subVectors(b, a);
      const ac = new THREE.Vector3().subVectors(c, a);
      const cross = new THREE.Vector3().crossVectors(ab, ac);
      area += cross.length() / 2;
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(position, i);
      const b = new THREE.Vector3().fromBufferAttribute(position, i + 1);
      const c = new THREE.Vector3().fromBufferAttribute(position, i + 2);

      const ab = new THREE.Vector3().subVectors(b, a);
      const ac = new THREE.Vector3().subVectors(c, a);
      const cross = new THREE.Vector3().crossVectors(ab, ac);
      area += cross.length() / 2;
    }
  }

  return area;
};

export const useModelAnalysis = (geometry: THREE.BufferGeometry | null): ModelAnalysis | null => {
  return useMemo(() => {
    if (!geometry) return null;

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;

    const boundingBox = {
      x: (box.max.x - box.min.x) / 10, // Convert to cm
      y: (box.max.y - box.min.y) / 10,
      z: (box.max.z - box.min.z) / 10,
    };

    // Calculate volume in mm³, then convert to cm³
    const volumeMm3 = calculateVolume(geometry);
    const volumeCm3 = volumeMm3 / 1000;

    // Calculate surface area in mm², then convert to cm²
    const surfaceAreaMm2 = calculateSurfaceArea(geometry);
    const surfaceAreaCm2 = surfaceAreaMm2 / 100;

    // Weight is not calculated here - it depends on material selection
    // Will be calculated in the price calculation when parameters are set

    return {
      volumeCm3,
      boundingBox,
      surfaceArea: surfaceAreaCm2,
      weightGrams: null, // Weight depends on material, calculated later
    };
  }, [geometry]);
};
