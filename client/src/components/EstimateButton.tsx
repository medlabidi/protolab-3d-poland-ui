import React, { useState } from 'react';
import { usePricing } from '../hooks/usePricing';

interface EstimateButtonProps {
  materialType: string;
  color: string;
  materialWeightGrams: number;
  printTimeHours: number;
  onPricingCalculated?: (pricing: any) => void;
}

export const EstimateButton: React.FC<EstimateButtonProps> = ({
  materialType,
  color,
  materialWeightGrams,
  printTimeHours,
  onPricingCalculated,
}) => {
  const { pricing, loading, error, calculatePrice } = usePricing();
  const [showPricing, setShowPricing] = useState(false);

  const handleEstimate = async () => {
    try {
      const result = await calculatePrice({
        materialType,
        color,
        materialWeightGrams,
        printTimeHours,
        laborTimeMinutes: 20,
        deliveryFee: 0,
      });

      setShowPricing(true);
      onPricingCalculated?.(result);
    } catch (err) {
      console.error('Error calculating price:', err);
    }
  };

  return (
    <div>
      <button
        onClick={handleEstimate}
        disabled={loading || !materialType || !color}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Calculating...' : '💰 Estimate Price'}
      </button>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}

      {showPricing && pricing && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
          }}
        >
          <h4>💰 Price Breakdown</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>Material Cost: {pricing.Cmaterial.toFixed(2)} PLN</li>
            <li>Energy Cost: {pricing.Cenergy.toFixed(2)} PLN</li>
            <li>Labor Cost: {pricing.Clabor.toFixed(2)} PLN</li>
            <li>Depreciation: {pricing.Cdepreciation.toFixed(2)} PLN</li>
            <li>Maintenance: {pricing.Cmaintenance.toFixed(2)} PLN</li>
            <li style={{ borderTop: '1px solid #ccc', paddingTop: '8px', fontWeight: 'bold' }}>
              Internal Cost: {pricing.Cinternal.toFixed(2)} PLN
            </li>
            <li>VAT (23%): {pricing.vat.toFixed(2)} PLN</li>
            <li style={{ borderTop: '2px solid #000', paddingTop: '8px', fontSize: '16px', fontWeight: 'bold' }}>
              Total Price: {pricing.totalPrice.toFixed(2)} PLN
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
