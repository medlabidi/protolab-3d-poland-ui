import { analyzeFile, estimatePrintJob } from '../file-analysis.service';
import { getPrintParameters } from '../../config/print-parameters';
import {
  generateSimpleASCIISTL,
  generateSimpleBinarySTL,
  saveTestSTLFiles,
  cleanupTestSTLFiles,
} from './stl-test-helpers';
import * as path from 'path';

describe('File Analysis Service', () => {
  const testDir = path.join(__dirname, '__test-files');

  beforeAll(() => {
    saveTestSTLFiles(testDir);
  });

  afterAll(() => {
    cleanupTestSTLFiles(testDir);
  });

  describe('analyzeFile - ASCII STL', () => {
    it('should parse ASCII STL file correctly', async () => {
      const buffer = generateSimpleASCIISTL();
      const result = await analyzeFile(buffer, 'test-cube.stl');

      // Verify result structure
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('fileType');
      expect(result).toHaveProperty('volume_mm3');
      expect(result).toHaveProperty('surface_area_mm2');
      expect(result).toHaveProperty('dimensions_mm');
      expect(result).toHaveProperty('triangleCount');

      // Verify values
      expect(result.filename).toBe('test-cube.stl');
      expect(result.fileType).toBe('STL');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.volume_mm3).toBeGreaterThan(0);
      expect(result.surface_area_mm2).toBeGreaterThan(0);
      expect(result.triangleCount).toBe(12);
    });

    it('should calculate correct volume for cube', async () => {
      const buffer = generateSimpleASCIISTL();
      const result = await analyzeFile(buffer, 'test-cube.stl');

      // 10×10×10 cube = 1000 mm³
      expect(result.volume_mm3).toBeCloseTo(1000, -1); // Allow ±10 tolerance
    });

    it('should calculate correct dimensions for cube', async () => {
      const buffer = generateSimpleASCIISTL();
      const result = await analyzeFile(buffer, 'test-cube.stl');

      // 10×10×10 cube dimensions
      expect(result.dimensions_mm.width).toBeCloseTo(10, 0);
      expect(result.dimensions_mm.height).toBeCloseTo(10, 0);
      expect(result.dimensions_mm.depth).toBeCloseTo(10, 0);
    });

    it('should handle file size tracking', async () => {
      const buffer = generateSimpleASCIISTL();
      const result = await analyzeFile(buffer, 'test-cube.stl');

      // File size should match buffer size
      expect(result.fileSize).toBe(buffer.length);
    });
  });

  describe('analyzeFile - Binary STL', () => {
    it('should parse binary STL file correctly', async () => {
      const buffer = generateSimpleBinarySTL();
      const result = await analyzeFile(buffer, 'test-binary.stl');

      expect(result.fileType).toBe('STL');
      expect(result.triangleCount).toBe(12);
      expect(result.volume_mm3).toBeGreaterThan(0);
    });

    it('should handle binary format vertices correctly', async () => {
      const buffer = generateSimpleBinarySTL();
      const result = await analyzeFile(buffer, 'test-binary.stl');

      // Should have parsed 12 triangles (36 vertices)
      expect(result.triangleCount).toBe(12);
    });
  });

  describe('estimatePrintJob', () => {
    it('should estimate print time based on volume and parameters', async () => {
      const buffer = generateSimpleASCIISTL();
      const metadata = await analyzeFile(buffer, 'test-cube.stl');
      const parameters = getPrintParameters('standard', 'prototype');

      const estimations = estimatePrintJob(
        metadata,
        parameters,
        'PLA',
        1.24 // PLA density
      );

      expect(estimations).toHaveProperty('material_weight_g');
      expect(estimations).toHaveProperty('print_time_minutes');
      expect(estimations).toHaveProperty('layer_count');
      expect(estimations).toHaveProperty('nozzle_travel_mm');

      // Verify values are positive
      expect(estimations.material_weight_g).toBeGreaterThan(0);
      expect(estimations.print_time_minutes).toBeGreaterThan(0);
      expect(estimations.layer_count).toBeGreaterThan(0);
    });

    it('should calculate material weight based on density', async () => {
      const buffer = generateSimpleASCIISTL();
      const metadata = await analyzeFile(buffer, 'test-cube.stl');
      const parameters = getPrintParameters('standard', 'prototype');

      const estimations = estimatePrintJob(
        metadata,
        parameters,
        'PLA',
        1.24
      );

      // 1000 mm³ = 1 cm³
      // With 10% infill (prototype): ~0.1 cm³ + shell
      // 1 cm³ × 1.24 g/cm³ ≈ 1.24 grams (minimum)
      expect(estimations.material_weight_g).toBeGreaterThanOrEqual(1.0);
      expect(estimations.material_weight_g).toBeLessThan(10.0);
    });

    it('should estimate different print times for different qualities', async () => {
      const buffer = generateSimpleASCIISTL();
      const metadata = await analyzeFile(buffer, 'test-cube.stl');

      const draftParams = getPrintParameters('draft', 'prototype');
      const standardParams = getPrintParameters('standard', 'prototype');
      const highParams = getPrintParameters('high', 'prototype');

      const draftEst = estimatePrintJob(metadata, draftParams, 'PLA', 1.24);
      const standardEst = estimatePrintJob(metadata, standardParams, 'PLA', 1.24);
      const highEst = estimatePrintJob(metadata, highParams, 'PLA', 1.24);

      // Higher quality = longer print time (smaller layer height)
      expect(draftEst.print_time_minutes).toBeLessThan(
        standardEst.print_time_minutes
      );
      expect(standardEst.print_time_minutes).toBeLessThan(
        highEst.print_time_minutes
      );
    });

    it('should estimate different weights for different infill densities', async () => {
      const buffer = generateSimpleASCIISTL();
      const metadata = await analyzeFile(buffer, 'test-cube.stl');

      const prototypeParams = getPrintParameters('standard', 'prototype'); // 10% infill
      const functionalParams = getPrintParameters('standard', 'functional'); // 40% infill

      const prototypeEst = estimatePrintJob(metadata, prototypeParams, 'PLA', 1.24);
      const functionalEst = estimatePrintJob(metadata, functionalParams, 'PLA', 1.24);

      // Higher infill = more material
      expect(prototypeEst.material_weight_g).toBeLessThan(
        functionalEst.material_weight_g
      );
    });

    it('should handle different material densities', async () => {
      const buffer = generateSimpleASCIISTL();
      const metadata = await analyzeFile(buffer, 'test-cube.stl');
      const parameters = getPrintParameters('standard', 'prototype');

      const plaEst = estimatePrintJob(metadata, parameters, 'PLA', 1.24);
      const absEst = estimatePrintJob(metadata, parameters, 'ABS', 1.04);

      // PLA has higher density, so same volume = more weight
      expect(plaEst.material_weight_g).toBeGreaterThan(
        absEst.material_weight_g
      );
    });

    it('should calculate layer count from depth and layer height', async () => {
      const buffer = generateSimpleASCIISTL();
      const metadata = await analyzeFile(buffer, 'test-cube.stl');
      const parameters = getPrintParameters('standard', 'prototype');

      const estimations = estimatePrintJob(
        metadata,
        parameters,
        'PLA',
        1.24
      );

      // Depth = 10mm, layer height = 0.2mm
      // Layer count = ceil(10 / 0.2) = 50
      expect(estimations.layer_count).toBeCloseTo(50, 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small files', async () => {
      const smallSTL = `solid tiny
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
  endfacet
endsolid tiny`;

      const buffer = Buffer.from(smallSTL, 'utf-8');
      const result = await analyzeFile(buffer, 'tiny.stl');

      expect(result.volume_mm3).toBeGreaterThanOrEqual(0);
      expect(result.dimensions_mm.width).toBeCloseTo(1, 0);
    });

    it('should handle files with no triangles gracefully', async () => {
      const emptySTL = `solid empty
endsolid empty`;

      const buffer = Buffer.from(emptySTL, 'utf-8');
      const result = await analyzeFile(buffer, 'empty.stl');

      expect(result.volume_mm3).toBe(0);
      expect(result.triangleCount).toBe(0);
    });
  });
});
