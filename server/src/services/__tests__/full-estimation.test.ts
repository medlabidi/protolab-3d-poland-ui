import { analyzeFile, estimatePrintJob } from '../file-analysis.service';
import { pricingService } from '../pricing.service';
import { getPrintParameters } from '../../config/print-parameters';
import { generateSimpleASCIISTL } from './stl-test-helpers';

describe('Full Print Job Estimation (Integration Test)', () => {
  it('should estimate complete print job from file to price', async () => {
    // Step 1: Analyze 3D file
    const fileBuffer = generateSimpleASCIISTL();
    const metadata = await analyzeFile(fileBuffer, 'cube-prototype.stl');

    console.log('Step 1: File Analysis');
    console.log(`  Volume: ${metadata.volume_mm3.toFixed(2)} mm³`);
    console.log(`  Dimensions: ${metadata.dimensions_mm.width.toFixed(1)} × ${metadata.dimensions_mm.height.toFixed(1)} × ${metadata.dimensions_mm.depth.toFixed(1)} mm`);

    // Step 2: Get print parameters
    const parameters = getPrintParameters('standard', 'prototype');

    console.log('\nStep 2: Print Parameters');
    console.log(`  Layer height: ${parameters.layer_height} mm`);
    console.log(`  Infill: ${parameters.infill_density}%`);

    // Step 3: Estimate print job
    const estimations = estimatePrintJob(
      metadata,
      parameters,
      'PLA',
      1.24
    );

    console.log('\nStep 3: Print Estimations');
    console.log(`  Material weight: ${estimations.material_weight_g.toFixed(2)} g`);
    console.log(`  Print time: ${estimations.print_time_minutes} minutes`);
    console.log(`  Layer count: ${estimations.layer_count}`);

    // Step 4: Calculate price
    const pricing = pricingService.calculatePrice({
      materialType: 'PLA',
      color: 'White',
      materialWeightGrams: estimations.material_weight_g,
      printTimeHours: estimations.print_time_minutes / 60,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    });

    console.log('\nStep 4: Pricing');
    console.log(`  Material cost: ${pricing.Cmaterial.toFixed(2)} PLN`);
    console.log(`  Energy cost: ${pricing.Cenergy.toFixed(2)} PLN`);
    console.log(`  Labor cost: ${pricing.Clabor.toFixed(2)} PLN`);
    console.log(`  Total (with VAT): ${pricing.priceWithoutDelivery.toFixed(2)} PLN`);

    // Assertions
    expect(metadata.volume_mm3).toBeGreaterThan(0);
    expect(estimations.material_weight_g).toBeGreaterThan(0);
    expect(estimations.print_time_minutes).toBeGreaterThan(0);
    expect(pricing.priceWithoutDelivery).toBeGreaterThan(0);
  });

  it('should handle different material and quality combinations', async () => {
    const fileBuffer = generateSimpleASCIISTL();
    const metadata = await analyzeFile(fileBuffer, 'test.stl');

    const combinations: Array<{
      material: 'PLA' | 'ABS' | 'PETG' | 'Resin' | 'TPU';
      color: string;
      quality: 'draft' | 'standard' | 'high';
      purpose: 'prototype' | 'functional' | 'aesthetic';
    }> = [
      { material: 'PLA', color: 'White', quality: 'draft', purpose: 'prototype' },
      { material: 'ABS', color: 'Black', quality: 'standard', purpose: 'functional' },
      { material: 'PETG', color: 'Red', quality: 'high', purpose: 'aesthetic' },
    ];

    combinations.forEach(({ material, color, quality, purpose }) => {
      const parameters = getPrintParameters(quality, purpose);
      const densities: Record<string, number> = {
        PLA: 1.24,
        ABS: 1.04,
        PETG: 1.27,
      };

      const estimations = estimatePrintJob(
        metadata,
        parameters,
        material,
        densities[material]
      );

      const pricing = pricingService.calculatePrice({
        materialType: material,
        color,
        materialWeightGrams: estimations.material_weight_g,
        printTimeHours: estimations.print_time_minutes / 60,
        laborTimeMinutes: 20,
        deliveryFee: 0,
      });

      expect(estimations.material_weight_g).toBeGreaterThan(0);
      expect(pricing.totalPrice).toBeGreaterThan(0);
    });
  });
});
