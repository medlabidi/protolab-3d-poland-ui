import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';

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
  const supportedFormats = ['stl', 'obj', '3mf', 'glb', 'gltf'];
  if (!extension || !supportedFormats.includes(extension)) {
    return { isValid: false, error: `Unsupported file format: .${extension}. Supported formats: STL, OBJ, GLB, GLTF, 3MF` };
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
    console.log('[STL Loader] Attempting to load from URL:', url);
    
    // First, fetch the file to validate it before parsing
    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream, model/stl, */*'
      },
      credentials: 'include' // Include credentials for authenticated requests
    })
      .then(response => {
        console.log('[STL Loader] Response status:', response.status, response.statusText);
        console.log('[STL Loader] Content-Type:', response.headers.get('content-type'));
        console.log('[STL Loader] Content-Length:', response.headers.get('content-length'));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: HTTP ${response.status} ${response.statusText}`);
        }
        
        // Note: We're removing the content-type check because many servers don't set it correctly
        // The important thing is that we got a 200 response and will attempt to parse as binary
        
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        console.log('[STL Loader] Received buffer size:', arrayBuffer.byteLength, 'bytes');
        
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('File is empty or corrupted');
        }

        if (arrayBuffer.byteLength < MIN_FILE_SIZE_BYTES) {
          throw new Error('File is too small to be a valid 3D model');
        }

        const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          throw new Error(`File is too large (${fileSizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB`);
        }

        // Parse the STL file
        const loader = new STLLoader();
        let geometry: THREE.BufferGeometry;
        
        try {
          console.log('[STL Loader] Parsing STL file...');
          geometry = loader.parse(arrayBuffer);
          console.log('[STL Loader] Successfully parsed STL file');
        } catch (parseError) {
          console.error('[STL Loader] Parse error:', parseError);
          throw new Error('Failed to parse STL file. The file may be corrupted or in an unsupported format');
        }

        // Validate the parsed geometry
        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          console.error('[STL Loader] Validation failed:', validationResult.error);
          throw new Error(validationResult.error || 'Invalid geometry');
        }

        console.log('[STL Loader] Successfully loaded and validated STL file');
        resolve(geometry);
      })
      .catch(error => {
        console.error('[STL Loader] Error loading STL from URL:', url, error);
        if (error instanceof Error) {
          reject(new Error(`Failed to load STL from URL: ${error.message}`));
        } else {
          reject(new Error('Failed to load STL from URL: Unknown error'));
        }
      });
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
    // First, fetch the file to validate it before parsing
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch file: HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        if (!text || text.trim().length === 0) {
          throw new Error('File is empty');
        }

        const textSizeBytes = new Blob([text]).size;
        if (textSizeBytes < MIN_FILE_SIZE_BYTES) {
          throw new Error('File is too small to be a valid 3D model');
        }

        const textSizeMB = textSizeBytes / (1024 * 1024);
        if (textSizeMB > MAX_FILE_SIZE_MB) {
          throw new Error(`File is too large (${textSizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB`);
        }

        // Parse the OBJ file
        const loader = new OBJLoader();
        let object;
        
        try {
          object = loader.parse(text);
        } catch (parseError) {
          console.error('OBJ parse error:', parseError);
          throw new Error('Failed to parse OBJ file. The file may be corrupted or in an unsupported format');
        }

        // Extract geometry from the first mesh found
        let geometry: THREE.BufferGeometry | null = null;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            geometry = child.geometry;
          }
        });
        
        if (!geometry) {
          throw new Error('No valid 3D geometry found in OBJ file');
        }

        // Validate the parsed geometry
        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          throw new Error(validationResult.error || 'Invalid geometry');
        }

        resolve(geometry);
      })
      .catch(error => {
        console.error('Error loading OBJ from URL:', error);
        if (error instanceof Error) {
          reject(new Error(`Failed to load OBJ from URL: ${error.message}`));
        } else {
          reject(new Error('Failed to load OBJ from URL: Unknown error'));
        }
      });
  });
};

export const loadGLBFromUrl = (url: string): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    console.log('[GLB Loader] Attempting to load from URL:', url);
    
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        console.log('[GLB Loader] Successfully loaded GLTF/GLB file');
        
        // Extract geometry from the first mesh found
        let geometry: THREE.BufferGeometry | null = null;
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            geometry = child.geometry;
          }
        });
        
        if (!geometry) {
          reject(new Error('No valid 3D geometry found in GLB/GLTF file'));
          return;
        }

        // Validate the parsed geometry
        const validationResult = validateGeometry(geometry);
        if (!validationResult.isValid) {
          reject(new Error(validationResult.error || 'Invalid geometry'));
          return;
        }

        console.log('[GLB Loader] Successfully validated GLB/GLTF geometry');
        resolve(geometry);
      },
      (progress) => {
        console.log('[GLB Loader] Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('[GLB Loader] Error loading GLB/GLTF from URL:', url, error);
        reject(new Error(`Failed to load GLB/GLTF from URL: ${error.message || 'Unknown error'}`));
      }
    );
  });
};

export const loadModel = async (file: File): Promise<THREE.BufferGeometry | null> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Handle 3MF files - return null to indicate no preview (not an error)
  if (extension === '3mf') {
    return null;
  }
  
  // Validate the file before attempting to parse
  const fileValidation = validateFile(file);
  if (!fileValidation.isValid) {
    throw new Error(fileValidation.error);
  }
  
  switch (extension) {
    case 'stl':
      return loadSTL(file);
    case 'obj':
      return loadOBJ(file);
    default:
      throw new Error(`Unsupported file format: .${extension}. Supported formats: STL, OBJ, 3MF`);
  }
};

export const loadModelFromUrl = async (url: string, fileName: string): Promise<THREE.BufferGeometry> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  console.log('[Model Loader] Loading file with extension:', extension, 'from URL:', url);
  
  switch (extension) {
    case 'stl':
      return loadSTLFromUrl(url);
    case 'obj':
      return loadOBJFromUrl(url);
    case 'glb':
    case 'gltf':
      return loadGLBFromUrl(url);
    case '3mf':
      throw new Error('3MF files are accepted for printing but cannot be previewed in 3D.');
    default:
      throw new Error(`Unsupported file format: .${extension}. Supported formats: STL, OBJ, GLB, GLTF, 3MF`);
  }
};
