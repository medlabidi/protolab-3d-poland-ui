import { PricingParams, PricingBreakdown } from '../types';
import {
  BASE_MATERIAL_COSTS,
  LABOR_RATES,
  PRICING_CONFIG,
  QUALITY_MULTIPLIER,
  PURPOSE_MULTIPLIER,
} from '../config/pricing';
import { getColorPrice } from '../config/material-colors';

export class PricingService {
  calculatePrice(params: PricingParams): PricingBreakdown {
    const {
      materialWeight,
      printTime,
      materialType,
      color,
      quality,
      purpose,
    } = params;

    // Get color price multiplier
    const colorInfo = getColorPrice(materialType, color);

    // Material cost (base cost × color multiplier)
    const baseMaterialRate =
      BASE_MATERIAL_COSTS[materialType as keyof typeof BASE_MATERIAL_COSTS] ||
      0.02;
    const baseMaterialCost = materialWeight * baseMaterialRate;
    const colorSurcharge = baseMaterialCost * (colorInfo.priceMultiplier - 1);
    const materialCost = baseMaterialCost + colorSurcharge;

    // Labor cost (print time in minutes × labor rate per minute)
    const laborRate =
      LABOR_RATES[quality as keyof typeof LABOR_RATES] || 0.75;
    const baseLaborCost = (printTime / 60) * laborRate * 60; // printTime is in minutes

    // Apply quality and purpose multipliers
    const qualityMult =
      QUALITY_MULTIPLIER[quality as keyof typeof QUALITY_MULTIPLIER] || 1.0;
    const purposeMult =
      PURPOSE_MULTIPLIER[purpose as keyof typeof PURPOSE_MULTIPLIER] || 1.0;

    const laborCost = baseLaborCost * qualityMult * purposeMult;

    // Service fee
    const serviceFee = PRICING_CONFIG.serviceFee;

    // Subtotal before markup
    const subtotal = materialCost + laborCost + serviceFee;

    // Apply markup
    const markup = subtotal * (PRICING_CONFIG.markupPercent / 100);

    // Total
    let total = subtotal + markup;

    // Apply minimum price
    if (total < PRICING_CONFIG.minPrice) {
      total = PRICING_CONFIG.minPrice;
    }

    return {
      materialCost: Math.round(baseMaterialCost * 100) / 100,
      colorSurcharge: Math.round(colorSurcharge * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      serviceFee,
      subtotal: Math.round(subtotal * 100) / 100,
      markup: Math.round(markup * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}

export const pricingService = new PricingService();
