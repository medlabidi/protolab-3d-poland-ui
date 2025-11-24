import { useState } from 'react';
import axios from 'axios';

export interface PricingParams {
  materialType: string;
  color: string;
  materialWeightGrams: number;
  printTimeHours: number;
  laborTimeMinutes?: number;
  deliveryFee?: number;
}

export interface PricingResult {
  Cmaterial: number;
  Cenergy: number;
  Clabor: number;
  Cdepreciation: number;
  Cmaintenance: number;
  Cinternal: number;
  vat: number;
  priceWithoutDelivery: number;
  totalPrice: number;
}

export const usePricing = () => {
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async (params: PricingParams) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/pricing/calculate`, params);
      setPricing(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate price';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { pricing, loading, error, calculatePrice };
};
