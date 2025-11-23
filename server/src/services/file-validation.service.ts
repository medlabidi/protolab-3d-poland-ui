import { FileMetadata } from './file-analysis.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FileValidationService {
  /**
   * Validate 3D file health and geometry
   */
  validateFile(metadata: FileMetadata): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Check if file is empty
    if (metadata.fileSize === 0) {
      errors.push('File is empty (0 bytes)');
      return { isValid: false, errors, warnings };
    }

    // 2. Check if file type is recognized
    if (!['STL', 'OBJ', '3MF'].includes(metadata.fileType)) {
      errors.push(`Unsupported file type: ${metadata.fileType}`);
      return { isValid: false, errors, warnings };
    }

    // 3. Check if triangles were parsed
    if (metadata.triangleCount === undefined || metadata.triangleCount === 0) {
      errors.push('No valid geometry found in file (0 triangles). File may be corrupted or empty.');
      return { isValid: false, errors, warnings };
    }

    // 4. Check if volume is reasonable (not zero or invalid)
    if (metadata.volume_mm3 <= 0) {
      errors.push(
        'Invalid geometry detected: Volume is zero or negative. File may have open geometry or be self-intersecting.'
      );
      return { isValid: false, errors, warnings };
    }

    // 5. Check if dimensions are reasonable
    if (
      metadata.dimensions_mm.width <= 0 ||
      metadata.dimensions_mm.height <= 0 ||
      metadata.dimensions_mm.depth <= 0
    ) {
      errors.push(
        'Invalid dimensions detected: Width, height, or depth is zero. File may be flat or degenerate.'
      );
      return { isValid: false, errors, warnings };
    }

    // 6. Check for extremely small objects (< 1mm³)
    if (metadata.volume_mm3 < 1) {
      warnings.push(
        `Very small object detected (${metadata.volume_mm3.toFixed(3)} mm³). May be difficult to print.`
      );
    }

    // 7. Check for extremely large objects (> 1,000,000 mm³ = 1 liter)
    if (metadata.volume_mm3 > 1000000) {
      warnings.push(
        `Very large object detected (${(metadata.volume_mm3 / 1000000).toFixed(2)} liters). May exceed printer capacity.`
      );
    }

    // 8. Check for non-manifold geometry (surface area vs volume ratio)
    const volumeToAreaRatio = metadata.volume_mm3 / (metadata.surface_area_mm2 + 0.001);
    if (volumeToAreaRatio < 0.01) {
      warnings.push(
        'Thin or complex geometry detected. File may have open edges or be non-manifold. Check geometry in CAD software.'
      );
    }

    // 9. Check surface area is reasonable
    if (metadata.surface_area_mm2 <= 0) {
      errors.push('Invalid surface area calculated. File geometry may be corrupted.');
      return { isValid: false, errors, warnings };
    }

    // 10. Check file size vs triangle count (sanity check)
    // ASCII STL: ~250 bytes per triangle; Binary: ~50 bytes per triangle
    const minExpectedSize = metadata.triangleCount * 40; // conservative estimate
    if (metadata.fileSize < minExpectedSize) {
      warnings.push(
        `File size (${metadata.fileSize} bytes) seems small for ${metadata.triangleCount} triangles. File may be truncated.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate human-readable error message
   */
  getErrorMessage(validation: ValidationResult): string {
    if (validation.isValid) {
      return 'File is valid ✓';
    }

    let message = 'File validation failed:\n\n';
    message += validation.errors.map((e) => `❌ ${e}`).join('\n');

    if (validation.warnings.length > 0) {
      message += '\n\nWarnings:\n';
      message += validation.warnings.map((w) => `⚠️  ${w}`).join('\n');
    }

    return message;
  }
}

export const fileValidationService = new FileValidationService();
