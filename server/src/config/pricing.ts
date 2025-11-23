export const BASE_MATERIAL_COSTS = {
  PLA: 0.02,      // $ per gram (base)
  ABS: 0.025,
  PETG: 0.028,
  TPU: 0.035,
  Resin: 0.05,
};

export const LABOR_RATES = {
  draft: 0.5,     // $ per minute
  standard: 0.75,
  high: 1.0,
};

export const PRICING_CONFIG = {
  serviceFee: 5.0,      // Base service fee in $
  markupPercent: 30,    // Profit margin %
  minPrice: 10.0,       // Minimum order price
};

export const QUALITY_MULTIPLIER = {
  draft: 1.0,
  standard: 1.2,
  high: 1.5,
};

export const PURPOSE_MULTIPLIER = {
  prototype: 1.0,
  functional: 1.3,    // Extra care for functional parts
  aesthetic: 1.2,     // Extra finishing for aesthetic
};
