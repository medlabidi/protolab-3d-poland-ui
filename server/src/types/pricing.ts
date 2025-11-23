export interface PricingParams {
  materialType: string;       // PLA, ABS, PETG
  color: string;              // White, Black, Red, etc.
  materialWeightGrams: number;
  printTimeHours: number;
  laborTimeMinutes?: number;  // Default: 20 minutes
  deliveryFee?: number;       // Optional delivery fee in PLN
}

export interface PricingResult {
  Cmaterial: number;          // Material cost (PLN)
  Cenergy: number;            // Energy cost (PLN)
  Clabor: number;             // Labor cost (PLN)
  Cdepreciation: number;       // Machine depreciation (PLN)
  Cmaintenance: number;        // Maintenance cost (PLN)
  Cinternal: number;          // Total internal cost (PLN)
  vat: number;                // VAT 23% (PLN)
  priceWithoutDelivery: number; // Internal cost + VAT (PLN)
  totalPrice: number;         // Final price with delivery if provided (PLN)
}
