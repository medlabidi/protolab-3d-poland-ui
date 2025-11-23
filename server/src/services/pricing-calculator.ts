import { PricingParams, PricingResult } from '../types/pricing';
import { getMaterialPrice } from '../config/material-prices';

// Constants
const MACHINE_POWER_KW = 0.27; // 270W in kW
const ENERGY_PRICE_PLN = 0.914; // PLN per kWh (Krakow)
const HOURLY_LABOR_RATE_PLN = 31.4; // PLN per hour
const DEFAULT_LABOR_TIME_MINUTES = 20;
const MACHINE_COST_PLN = 3483.39;
const MACHINE_LIFESPAN_HOURS = 5000;
const MAINTENANCE_MULTIPLIER = 0.03;
const VAT_RATE = 0.23; // 23% VAT in Poland

export function calculatePrintPrice(params: PricingParams): PricingResult {
  const {
    materialType,
    color,
    materialWeightGrams,
    printTimeHours,
    laborTimeMinutes = DEFAULT_LABOR_TIME_MINUTES,
    deliveryFee = 0,
  } = params;

  // 1. Material Cost
  const materialPricePerKg = getMaterialPrice(materialType, color);
  const Cmaterial = materialPricePerKg * (materialWeightGrams / 1000);

  // 2. Energy Cost
  // Cenergy = T * W * Pe
  const Cenergy = printTimeHours * MACHINE_POWER_KW * ENERGY_PRICE_PLN;

  // 3. Labor Cost
  // Clabor = R * L (where L is in hours)
  const laborTimeHours = laborTimeMinutes / 60;
  const Clabor = HOURLY_LABOR_RATE_PLN * laborTimeHours;

  // 4. Machine Depreciation
  // Cdepreciation = (machineCost / lifespanHours) * printTimeHours
  const Cdepreciation =
    (MACHINE_COST_PLN / MACHINE_LIFESPAN_HOURS) * printTimeHours;

  // 5. Maintenance Cost
  // Cmaintenance = Cdepreciation * 0.03
  const Cmaintenance = Cdepreciation * MAINTENANCE_MULTIPLIER;

  // 6. Total Internal Cost
  const Cinternal = Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance;

  // 7. VAT (23%)
  const vat = Cinternal * VAT_RATE;

  // 8. Price without delivery
  const priceWithoutDelivery = Cinternal + vat;

  // 9. Total price with delivery
  const totalPrice = priceWithoutDelivery + deliveryFee;

  return {
    Cmaterial: Math.round(Cmaterial * 100) / 100,
    Cenergy: Math.round(Cenergy * 100) / 100,
    Clabor: Math.round(Clabor * 100) / 100,
    Cdepreciation: Math.round(Cdepreciation * 100) / 100,
    Cmaintenance: Math.round(Cmaintenance * 100) / 100,
    Cinternal: Math.round(Cinternal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    priceWithoutDelivery: Math.round(priceWithoutDelivery * 100) / 100,
    totalPrice: Math.round((totalPrice) * 100) / 100,
  };
}
