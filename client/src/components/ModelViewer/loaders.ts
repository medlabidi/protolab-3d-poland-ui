import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';

// File validation constants
const MAX_FILE_SIZE_MB = 50;
const MIN_FILE_SIZE_BYTES = 100; // Minimum reasonable file size for a 3D model
const MIN_VERTEX_COUNT = 3; // Minimum vertices for a valid geometry
const MIN_VOLUME_CM3 = 0.001; // Minimum volume in cm³ (1 mm³)
const MIN_DIMENSION_MM = 0.1; // Minimum dimension in mm

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates file before attempting to parse
 */
export const validateFile = (file: File): ValidationResult => {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file size - empty file
  if (file.size === 0) {
    return { isValid: false, error: 'File is empty. Please upload a valid 3D model file.' };
  }

  // Check file size - too small
  if (file.size < MIN_FILE_SIZE_BYTES) {
    return { isValid: false, error: 'File is too small to be a valid 3D model. The file may be corrupted.' };
  }

  // Check file size - too large
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return { isValid: false, error: `File is too large (${fileSizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.` };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedFormats = ['stl', 'obj', 'step'];
  if (!extension || !supportedFormats.includes(extension)) {
    return { isValid: false, error: `Unsupported file format: .${extension}. Supported formats: STL, OBJ, STEP` };
  }

  return { isValid: true };
};

/**
 * Validates geometry after parsing
 */
export const validateGeometry = (geometry: THREE.BufferGeometry): ValidationResult => {
  // Check if geometry exists
  if (!geometry) {
    return { isValid: false, error: 'Failed to parse 3D model. The file may be corrupted or in an unsupported format.' };
  }

  // Check for position attribute
  const position = geometry.attributes.position;
  if (!position) {
    return { isValid: false, error: 'Invalid 3D model: No vertex data found. The file may be corrupted.' };
  }

  // Check vertex count
  if (position.count < MIN_VERTEX_COUNT) {
    return { isValid: false, error: 'Invalid 3D model: Not enough vertices. The model must have at least 3 vertices.' };
  }

  // Check for NaN or Infinite values in vertices
  const positionArray = position.array;
  for (let i = 0; i < positionArray.length; i++) {
    if (!isFinite(positionArray[i])) {
      return { isValid: false, error: 'Invalid 3D model: Contains invalid vertex coordinates (NaN or Infinity). The file may be corrupted.' };
    }
  }

  // Compute bounding box to check dimensions
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  
  if (!box) {
    return { isValid: false, error: 'Failed to compute model dimensions. The file may be corrupted.' };
  }

  const size = box.getSize(new THREE.Vector3());
  
  // Check for zero dimensions
  if (size.x === 0 && size.y === 0 && size.z === 0) {
    return { isValid: false, error: 'Invalid 3D model: Model has zero dimensions. All vertices may be at the same point.' };
  }

  // Check for extremely small dimensions (less than 0.1mm)
  if (size.x < MIN_DIMENSION_MM && size.y < MIN_DIMENSION_MM && size.z < MIN_DIMENSION_MM) {
    return { isValid: false, error: 'Model is too small to print. All dimensions are less than 0.1mm.' };
  }

  // Calculate volume to check for zero volume
  const volume = calculateVolumeForValidation(geometry);
  const volumeCm3 = volume / 1000; // Convert from mm³ to cm³

  if (volumeCm3 < MIN_VOLUME_CM3) {
    return { 
      isValid: false, 
      error: 'Invalid 3D model: Model has zero or near-zero volume. This could mean the model is not watertight (has holes), is a flat surface, or has inverted normals.' 
    };
  }

  // Check for very large models (warn but allow)
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 300) { // Larger than 30cm
    return { 
      isValid: true, 
      warning: `Model is quite large (${(maxDim / 10).toFixed(1)} cm). Please verify the scale is correct.` 
    };
  }

  return { isValid: true };
};

/**
 * Simple volume calculation for validation purposes
 */
const calculateVolumeForValidation = (geometry: THREE.BufferGeometry): number => {
  const position = geometry.attributes.position;
  let volume = 0;

  if (geometry.index) {
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(position, indices[i]);
      const b = new THREE.Vector3().fromBufferAttribute(position, indices[i + 1]);
      const c = new THREE.Vector3().fromBufferAttribute(position, indices[i + 2]);
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

export const loadSTL = (file: File): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          reject(new Error('Failed to read file: File appears to be empty or corrupted.'));
          return;
        }

        const geometry = loader.parse(arrayBuffer);
        
        // Validate the parsed geometry
        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          reject(new Error(validationResult.error));
          return;
        }

        resolve(geometry);
      } catch (error) {
        if (error instanceof Error) {
          reject(new Error(`Failed to parse STL file: ${error.message}. The file may be corrupted or in an unsupported format.`));
        } else {
          reject(new Error('Failed to parse STL file: Unknown error. The file may be corrupted.'));
        }
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file. The file may be corrupted or inaccessible.'));
    };

    reader.onabort = () => {
      reject(new Error('File reading was aborted.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const loadSTLFromUrl = (url: string): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          reject(new Error(validationResult.error));
          return;
        }
        resolve(geometry);
      },
      undefined,
      (error) => reject(new Error(`Failed to load STL from URL: ${error}`))
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
        
        if (!text || text.trim().length === 0) {
          reject(new Error('Failed to read file: File appears to be empty.'));
          return;
        }

        const object = loader.parse(text);
        
        // Extract geometry from the first mesh found
        let geometry: THREE.BufferGeometry | null = null;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            geometry = child.geometry;
          }
        });
        
        if (!geometry) {
          reject(new Error('No valid 3D geometry found in OBJ file. The file may be empty or contain only unsupported elements.'));
          return;
        }

        // Validate the parsed geometry
        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          reject(new Error(validationResult.error));
          return;
        }

        resolve(geometry);
      } catch (error) {
        if (error instanceof Error) {
          reject(new Error(`Failed to parse OBJ file: ${error.message}. The file may be corrupted.`));
        } else {
          reject(new Error('Failed to parse OBJ file: Unknown error. The file may be corrupted.'));
        }
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file. The file may be corrupted or inaccessible.'));
    };

    reader.onabort = () => {
      reject(new Error('File reading was aborted.'));
    };

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
        
        if (!geometry) {
          reject(new Error('No valid 3D geometry found in OBJ file.'));
          return;
        }

        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          reject(new Error(validationResult.error));
          return;
        }

        resolve(geometry);
      },
      undefined,
      (error) => reject(new Error(`Failed to load OBJ from URL: ${error}`))
    );
  });
};

export const loadModel = async (file: File): Promise<THREE.BufferGeometry> => {
  // First validate the file before attempting to parse
  const fileValidation = validateFile(file);
  if (!fileValidation.isValid) {
    throw new Error(fileValidation.error);
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'stl':
      return loadSTL(file);
    case 'obj':
      return loadOBJ(file);
    case 'step':
      throw new Error('STEP file support coming soon. Please convert to STL or OBJ format for now.');
    default:
      throw new Error(`Unsupported file format: .${extension}. Supported formats: STL, OBJ`);
  }
};

export const loadModelFromUrl = async (url: string, fileName: string): Promise<THREE.BufferGeometry> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'stl':
      return loadSTLFromUrl(url);
    case 'obj':
      return loadOBJFromUrl(url);
    case 'step':
      throw new Error('STEP file support coming soon. Please convert to STL or OBJ format for now.');
    default:
      throw new Error(`Unsupported file format: .${extension}. Supported formats: STL, OBJ`);
  }
};
