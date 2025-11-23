import { PricingParams } from '../types';

export class PricingService {
  calculatePrice(params: PricingParams): number {
    const { materialWeight, printTime, materialRate, timeRate, serviceFee } = params;
    
    let price = serviceFee;
    
    if (materialWeight) {
      price += materialWeight * materialRate;
    }
    
    if (printTime) {
      price += printTime * timeRate;
    }
    
    return Math.round(price * 100) / 100;
  }
  
  estimatePrice(materialRate: number, timeRate: number, serviceFee: number): number {
    return serviceFee;
  }
}

export const pricingService = new PricingService();
