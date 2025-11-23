import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a simple ASCII STL file (cube)
 * Used for testing STL parsing
 */
export function generateSimpleASCIISTL(): Buffer {
  const stl = `solid cube
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 0 0
      vertex 10 10 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 10 0
      vertex 0 10 0
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex 0 0 10
      vertex 10 10 10
      vertex 10 0 10
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex 0 0 10
      vertex 0 10 10
      vertex 10 10 10
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex 0 10 0
      vertex 10 10 0
      vertex 10 10 10
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex 0 10 0
      vertex 10 10 10
      vertex 0 10 10
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex 0 0 0
      vertex 10 0 10
      vertex 10 0 0
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex 0 0 0
      vertex 0 0 10
      vertex 10 0 10
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 10 0 0
      vertex 10 10 10
      vertex 10 10 0
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 10 0 0
      vertex 10 0 10
      vertex 10 10 10
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex 0 0 0
      vertex 0 10 0
      vertex 0 10 10
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex 0 0 0
      vertex 0 10 10
      vertex 0 0 10
    endloop
  endfacet
endsolid cube`;

  return Buffer.from(stl, 'utf-8');
}

/**
 * Generate a simple binary STL file (10×10×10 cube)
 * Binary STL format: 80-byte header + 4-byte triangle count + (50 bytes per triangle)
 */
export function generateSimpleBinarySTL(): Buffer {
  const header = Buffer.alloc(80, 0);
  header.write('Binary STL cube 10x10x10', 0, 'utf-8');

  const triangleCount = 12; // 12 triangles for a cube
  const countBuffer = Buffer.alloc(4);
  countBuffer.writeUInt32LE(triangleCount, 0);

  // Define cube vertices
  const vertices = [
    // Bottom face (z=0)
    [0, 0, 0], [10, 0, 0], [10, 10, 0], // triangle 1
    [0, 0, 0], [10, 10, 0], [0, 10, 0], // triangle 2
    // Top face (z=10)
    [0, 0, 10], [10, 10, 10], [10, 0, 10], // triangle 3
    [0, 0, 10], [0, 10, 10], [10, 10, 10], // triangle 4
    // Front face (y=0)
    [0, 0, 0], [10, 0, 10], [10, 0, 0], // triangle 5
    [0, 0, 0], [0, 0, 10], [10, 0, 10], // triangle 6
    // Back face (y=10)
    [0, 10, 0], [10, 10, 0], [10, 10, 10], // triangle 7
    [0, 10, 0], [10, 10, 10], [0, 10, 10], // triangle 8
    // Left face (x=0)
    [0, 0, 0], [0, 10, 0], [0, 10, 10], // triangle 9
    [0, 0, 0], [0, 10, 10], [0, 0, 10], // triangle 10
    // Right face (x=10)
    [10, 0, 0], [10, 10, 10], [10, 10, 0], // triangle 11
    [10, 0, 0], [10, 0, 10], [10, 10, 10], // triangle 12
  ];

  const triangleBuffers: Buffer[] = [];

  for (let i = 0; i < triangleCount; i++) {
    const triangle = Buffer.alloc(50);

    const v1 = vertices[i * 3];
    const v2 = vertices[i * 3 + 1];
    const v3 = vertices[i * 3 + 2];

    // Calculate normal (cross product of (v2-v1) × (v3-v1))
    const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
    const normal = [
      edge1[1] * edge2[2] - edge1[2] * edge2[1],
      edge1[2] * edge2[0] - edge1[0] * edge2[2],
      edge1[0] * edge2[1] - edge1[1] * edge2[0],
    ];

    // Normalize
    const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    const nx = length > 0 ? normal[0] / length : 0;
    const ny = length > 0 ? normal[1] / length : 0;
    const nz = length > 0 ? normal[2] / length : 0;

    // Write normal vector
    triangle.writeFloatLE(nx, 0);
    triangle.writeFloatLE(ny, 4);
    triangle.writeFloatLE(nz, 8);

    // Write vertices
    triangle.writeFloatLE(v1[0], 12);
    triangle.writeFloatLE(v1[1], 16);
    triangle.writeFloatLE(v1[2], 20);

    triangle.writeFloatLE(v2[0], 24);
    triangle.writeFloatLE(v2[1], 28);
    triangle.writeFloatLE(v2[2], 32);

    triangle.writeFloatLE(v3[0], 36);
    triangle.writeFloatLE(v3[1], 40);
    triangle.writeFloatLE(v3[2], 44);

    // Attribute byte count (unused)
    triangle.writeUInt16LE(0, 48);

    triangleBuffers.push(triangle);
  }

  return Buffer.concat([header, countBuffer, ...triangleBuffers]);
}

/**
 * Save test STL files to disk for integration testing
 */
export function saveTestSTLFiles(testDir: string): void {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const asciiPath = path.join(testDir, 'test-ascii.stl');
  const binaryPath = path.join(testDir, 'test-binary.stl');

  fs.writeFileSync(asciiPath, generateSimpleASCIISTL());
  fs.writeFileSync(binaryPath, generateSimpleBinarySTL());
}

/**
 * Clean up test STL files
 */
export function cleanupTestSTLFiles(testDir: string): void {
  const asciiPath = path.join(testDir, 'test-ascii.stl');
  const binaryPath = path.join(testDir, 'test-binary.stl');

  if (fs.existsSync(asciiPath)) fs.unlinkSync(asciiPath);
  if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);
}
