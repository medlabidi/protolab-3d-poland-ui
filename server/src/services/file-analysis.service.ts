import { Buffer } from 'buffer';
import { PrintParameters } from '../config/print-parameters';

export interface FileMetadata {
  filename: string;
  fileSize: number;
  fileType: 'STL' | 'OBJ' | '3MF';
  volume_mm3: number;
  surface_area_mm2: number;
  dimensions_mm: {
    width: number;
    height: number;
    depth: number;
  };
  triangleCount?: number;
  extractedAt: string;
}

export interface EstimationResult {
  metadata: FileMetadata;
  parameters: PrintParameters;
  estimations: {
    material_weight_g: number;
    print_time_minutes: number;
    layer_count: number;
    nozzle_travel_mm: number;
  };
}

// Parse STL (ASCII and binary support)
function parseSTLASCII(buffer: Buffer): { vertices: number[][]; triangles: number } {
  const text = buffer.toString('utf-8');
  const vertexRegex = /vertex\s+([-+]?\d*\.?\d+([eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+([eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+([eE][-+]?\d+)?)/g;

  const vertices: number[][] = [];
  let match;

  while ((match = vertexRegex.exec(text)) !== null) {
    vertices.push([parseFloat(match[1]), parseFloat(match[3]), parseFloat(match[5])]);
  }

  return {
    vertices,
    triangles: vertices.length / 3,
  };
}

// Parse binary STL
function parseSTLBinary(buffer: Buffer): { vertices: number[][]; triangles: number } {
  const triangles = buffer.readUInt32LE(80);
  const vertices: number[][] = [];
  let offset = 84;

  for (let i = 0; i < triangles; i++) {
    // Skip normal vector (12 bytes)
    offset += 12;

    // Read 3 vertices (36 bytes total, 12 bytes each)
    for (let j = 0; j < 3; j++) {
      const x = buffer.readFloatLE(offset);
      const y = buffer.readFloatLE(offset + 4);
      const z = buffer.readFloatLE(offset + 8);
      vertices.push([x, y, z]);
      offset += 12;
    }

    // Skip attribute byte count
    offset += 2;
  }

  return { vertices, triangles };
}

// Calculate bounding box
function calculateBoundingBox(
  vertices: number[][]
): { width: number; height: number; depth: number } {
  if (vertices.length === 0) return { width: 0, height: 0, depth: 0 };

  const xs = vertices.map((v) => v[0]);
  const ys = vertices.map((v) => v[1]);
  const zs = vertices.map((v) => v[2]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ,
  };
}

// Estimate volume via divergence theorem (signed volume)
function estimateVolume(vertices: number[][]): number {
  if (vertices.length < 3) return 0;

  let volume = 0;

  for (let i = 0; i < vertices.length; i += 3) {
    const v1 = vertices[i];
    const v2 = vertices[i + 1];
    const v3 = vertices[i + 2];

    const a = v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) -
              v1[1] * (v2[0] * v3[2] - v2[2] * v3[0]) +
              v1[2] * (v2[0] * v3[1] - v2[1] * v3[0]);

    volume += a;
  }

  return Math.abs(volume) / 6;
}

// Estimate surface area via triangle sum
function estimateSurfaceArea(vertices: number[][]): number {
  if (vertices.length < 3) return 0;

  let area = 0;

  for (let i = 0; i < vertices.length; i += 3) {
    const v1 = vertices[i];
    const v2 = vertices[i + 1];
    const v3 = vertices[i + 2];

    // Cross product
    const vec1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const vec2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

    const cross = [
      vec1[1] * vec2[2] - vec1[2] * vec2[1],
      vec1[2] * vec2[0] - vec1[0] * vec2[2],
      vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ];

    const magnitude = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
    area += magnitude / 2;
  }

  return area;
}

// Estimate print time (simplified)
// Based on: layer count × perimeter time + infill time
function estimatePrintTime(
  metadata: FileMetadata,
  parameters: PrintParameters,
  materialDensity: number
): number {
  const { volume_mm3, surface_area_mm2, dimensions_mm } = metadata;
  const { layer_height, print_speed, infill_density } = parameters;

  // Layer count
  const layerCount = Math.ceil(dimensions_mm.depth / layer_height);

  // Estimate perimeter (rough: surface area / depth)
  const estimatedPerimeter = surface_area_mm2 / dimensions_mm.depth;

  // Perimeter time (mm / mm/s = seconds)
  const perimeterTime = (estimatedPerimeter * layerCount) / print_speed;

  // Infill time (volume × infill density / print speed)
  const infillVolume = volume_mm3 * (infill_density / 100);
  const infillTime = (infillVolume * 0.5) / print_speed; // 0.5 is rough filament cross-section

  // Total in minutes
  return (perimeterTime + infillTime) / 60;
}

// Estimate material weight
function estimateMaterialWeight(
  volume_mm3: number,
  infill_density: number,
  materialDensity: number
): number {
  // mm³ to cm³: divide by 1000
  const volumeCm3 = volume_mm3 / 1000;
  
  // Effective volume: shell + infill
  const effectiveVolume = volumeCm3 * (1 + (infill_density / 100));

  // Weight in grams
  return effectiveVolume * materialDensity;
}

// Main analysis function
export async function analyzeFile(
  fileBuffer: Buffer,
  filename: string
): Promise<FileMetadata> {
  const fileType = getFileType(filename) as 'STL' | 'OBJ' | '3MF';

  let vertices: number[][] = [];
  let triangles = 0;

  try {
    // Determine if ASCII or binary STL
    const isASCII = fileBuffer.toString('utf-8', 0, 5).includes('solid');

    if (fileType === 'STL') {
      const result = isASCII ? parseSTLASCII(fileBuffer) : parseSTLBinary(fileBuffer);
      vertices = result.vertices;
      triangles = result.triangles;
    }
    // TODO: Implement OBJ and 3MF parsers
  } catch (err) {
    console.error(`Failed to parse ${fileType} file:`, err);
  }

  const boundingBox = calculateBoundingBox(vertices);
  const volume = estimateVolume(vertices);
  const surfaceArea = estimateSurfaceArea(vertices);

  const metadata: FileMetadata = {
    filename,
    fileSize: fileBuffer.length,
    fileType,
    volume_mm3: volume,
    surface_area_mm2: surfaceArea,
    dimensions_mm: boundingBox,
    triangleCount: triangles,
    extractedAt: new Date().toISOString(),
  };

  return metadata;
}

// Estimate print job (with parameters)
export function estimatePrintJob(
  metadata: FileMetadata,
  parameters: PrintParameters,
  material: keyof typeof import('../config/print-parameters').MATERIAL_DENSITY,
  materialDensity: number
): EstimationResult['estimations'] {
  const layerCount = Math.ceil(metadata.dimensions_mm.depth / parameters.layer_height);
  const printTime = estimatePrintTime(metadata, parameters, materialDensity);
  const materialWeight = estimateMaterialWeight(
    metadata.volume_mm3,
    parameters.infill_density,
    materialDensity
  );

  // Rough estimate: nozzle travel ≈ surface area × layer count × 0.1
  const nozzleTravelMm = metadata.surface_area_mm2 * layerCount * 0.1;

  return {
    material_weight_g: Math.round(materialWeight * 100) / 100,
    print_time_minutes: Math.round(printTime),
    layer_count: layerCount,
    nozzle_travel_mm: Math.round(nozzleTravelMm),
  };
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase();
  return ext || 'UNKNOWN';
}
