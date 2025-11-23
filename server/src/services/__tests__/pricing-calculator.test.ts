import { pricingService } from '../pricing.service';
import { PricingParams } from '../../types/pricing';

describe('calculatePrintPrice', () => {
  // Test 1: Basic PLA White calculation
  it('should calculate correct price for PLA_White', () => {
    const params: PricingParams = {
      materialType: 'PLA',
      color: 'White',
      materialWeightGrams: 50,
      printTimeHours: 2,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    const result = pricingService.calculatePrice(params);

    // Expected calculations:
    // Cmaterial = 39 PLN/kg * (50g / 1000) = 1.95 PLN
    // Cenergy = 2h * 0.27kW * 0.914 PLN/kWh = 0.4936 PLN ≈ 0.49 PLN
    // Clabor = 31.4 PLN/h * (20min / 60) = 10.4667 PLN ≈ 10.47 PLN
    // Cdepreciation = (3483.39 / 5000) * 2 = 1.39336 PLN ≈ 1.39 PLN
    // Cmaintenance = 1.39 * 0.03 = 0.0418 PLN ≈ 0.04 PLN
    // Cinternal = 1.95 + 0.49 + 10.47 + 1.39 + 0.04 = 14.34 PLN
    // vat = 14.34 * 0.23 = 3.3 PLN
    // priceWithoutDelivery = 14.34 + 3.30 = 17.64 PLN

    expect(result.Cmaterial).toBeCloseTo(1.95, 1);
    expect(result.Cenergy).toBeCloseTo(0.49, 1);
    expect(result.Clabor).toBeCloseTo(10.47, 1);
    expect(result.Cdepreciation).toBeCloseTo(1.39, 1);
    expect(result.Cmaintenance).toBeCloseTo(0.04, 1);
    expect(result.Cinternal).toBeCloseTo(14.34, 1);
    expect(result.vat).toBeCloseTo(3.30, 1);
    expect(result.priceWithoutDelivery).toBeCloseTo(17.64, 1);
    expect(result.totalPrice).toBeCloseTo(17.64, 1);
  });

  // Test 2: PLA Red (higher price)
  it('should calculate correct price for PLA_Red', () => {
    const params: PricingParams = {
      materialType: 'PLA',
      color: 'Red',
      materialWeightGrams: 100,
      printTimeHours: 5,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    const result = pricingService.calculatePrice(params);

    // Cmaterial = 49 PLN/kg * (100g / 1000) = 4.90 PLN
    // Cenergy = 5h * 0.27kW * 0.914 = 1.2345 PLN ≈ 1.23 PLN
    // Clabor = 31.4 * (20/60) = 10.47 PLN
    // Cdepreciation = (3483.39 / 5000) * 5 = 3.4834 PLN ≈ 3.48 PLN
    // Cmaintenance = 3.48 * 0.03 = 0.1045 PLN ≈ 0.10 PLN
    // Cinternal = 4.90 + 1.23 + 10.47 + 3.48 + 0.10 = 20.18 PLN
    // vat = 20.18 * 0.23 = 4.6414 PLN ≈ 4.64 PLN
    // priceWithoutDelivery = 20.18 + 4.64 = 24.82 PLN

    expect(result.Cmaterial).toBeCloseTo(4.90, 1);
    expect(result.Cenergy).toBeCloseTo(1.23, 1);
    expect(result.Cinternal).toBeCloseTo(20.18, 1);
    expect(result.vat).toBeCloseTo(4.64, 1);
    expect(result.priceWithoutDelivery).toBeCloseTo(24.82, 1);
  });

  // Test 3: ABS with delivery fee
  it('should calculate correct price for ABS with delivery fee', () => {
    const params: PricingParams = {
      materialType: 'ABS',
      color: 'Black',
      materialWeightGrams: 75,
      printTimeHours: 3,
      laborTimeMinutes: 20,
      deliveryFee: 25,
    };

    const result = pricingService.calculatePrice(params);

    // Cmaterial = 50 PLN/kg * (75g / 1000) = 3.75 PLN
    // Cenergy = 3h * 0.27kW * 0.914 = 0.7413 PLN ≈ 0.74 PLN
    // Clabor = 31.4 * (20/60) = 10.47 PLN
    // Cdepreciation = (3483.39 / 5000) * 3 = 2.0901 PLN ≈ 2.09 PLN
    // Cmaintenance = 2.09 * 0.03 = 0.0627 PLN ≈ 0.06 PLN
    // Cinternal = 3.75 + 0.74 + 10.47 + 2.09 + 0.06 = 17.11 PLN
    // vat = 17.11 * 0.23 = 3.9353 PLN ≈ 3.94 PLN
    // priceWithoutDelivery = 17.11 + 3.94 = 21.05 PLN
    // totalPrice = 21.05 + 25 = 46.05 PLN

    expect(result.Cinternal).toBeCloseTo(17.11, 1);
    expect(result.vat).toBeCloseTo(3.94, 1);
    expect(result.priceWithoutDelivery).toBeCloseTo(21.05, 1);
    expect(result.totalPrice).toBeCloseTo(46.05, 1);
  });

  // Test 4: PETG Black (lowest PETG price)
  it('should calculate correct price for PETG_Black', () => {
    const params: PricingParams = {
      materialType: 'PETG',
      color: 'Black',
      materialWeightGrams: 60,
      printTimeHours: 1.5,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    const result = pricingService.calculatePrice(params);

    // Cmaterial = 30 PLN/kg * (60g / 1000) = 1.80 PLN
    expect(result.Cmaterial).toBeCloseTo(1.80, 1);
  });

  // Test 5: Custom labor time
  it('should calculate labor cost based on custom labor time', () => {
    const params: PricingParams = {
      materialType: 'PLA',
      color: 'White',
      materialWeightGrams: 50,
      printTimeHours: 2,
      laborTimeMinutes: 45,
      deliveryFee: 0,
    };

    const result = pricingService.calculatePrice(params);

    // Clabor = 31.4 * (45/60) = 23.55 PLN
    expect(result.Clabor).toBeCloseTo(23.55, 1);
  });

  // Test 6: Zero material weight
  it('should handle zero material weight', () => {
    const params: PricingParams = {
      materialType: 'PLA',
      color: 'White',
      materialWeightGrams: 0,
      printTimeHours: 1,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    const result = pricingService.calculatePrice(params);

    expect(result.Cmaterial).toBe(0);
    expect(result.Cinternal).toBeGreaterThan(0);
  });

  // Test 7: Invalid material should throw error
  it('should throw error for invalid material', () => {
    const params: PricingParams = {
      materialType: 'InvalidMaterial',
      color: 'White',
      materialWeightGrams: 50,
      printTimeHours: 2,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    expect(() => pricingService.calculatePrice(params)).toThrow(
      'Material price not found for: InvalidMaterial_White'
    );
  });

  // Test 8: Invalid color should throw error
  it('should throw error for invalid color combination', () => {
    const params: PricingParams = {
      materialType: 'PLA',
      color: 'InvalidColor',
      materialWeightGrams: 50,
      printTimeHours: 2,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    expect(() => pricingService.calculatePrice(params)).toThrow(
      'Material price not found for: PLA_InvalidColor'
    );
  });

  // Test 9: All material types
  it('should work with all material types', () => {
    const materials = [
      { type: 'PLA', color: 'White' },
      { type: 'ABS', color: 'Black' },
      { type: 'PETG', color: 'Red' },
    ];

    materials.forEach(({ type, color }) => {
      const params: PricingParams = {
        materialType: type,
        color,
        materialWeightGrams: 50,
        printTimeHours: 2,
        laborTimeMinutes: 20,
        deliveryFee: 0,
      };

      const result = pricingService.calculatePrice(params);
      expect(result.totalPrice).toBeGreaterThan(0);
      expect(result.vat).toBeGreaterThan(0);
    });
  });

  // Test 10: VAT calculation
  it('should correctly calculate VAT as 23% of internal cost', () => {
    const params: PricingParams = {
      materialType: 'PLA',
      color: 'White',
      materialWeightGrams: 100,
      printTimeHours: 4,
      laborTimeMinutes: 20,
      deliveryFee: 0,
    };

    const result = pricingService.calculatePrice(params);

    const expectedVat = result.Cinternal * 0.23;
    expect(result.vat).toBeCloseTo(expectedVat, 1);
  });
});

// Helper function to export from pricing.service.ts
export function calculatePrintPrice(params: PricingParams) {
  const pricingService = require('../pricing.service').pricingService;
  return pricingService.calculatePrice(params);
}
