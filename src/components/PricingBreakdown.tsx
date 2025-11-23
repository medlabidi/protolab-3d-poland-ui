import React from 'react';

interface PricingResult {
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

interface PricingBreakdownProps {
  pricing: PricingResult;
  currency?: string;
}

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  pricing,
  currency = 'PLN',
}) => {
  return (
    <div style={{ padding: '20px', border: '2px solid #28a745', marginTop: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#28a745' }}>💰 Detailed Price Breakdown</h3>

      <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Cost Breakdown */}
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
            <h4 style={{ marginTop: 0 }}>Cost Breakdown</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span>Material Cost:</span>
                <strong>{pricing.Cmaterial.toFixed(2)} {currency}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span>Energy Cost:</span>
                <strong>{pricing.Cenergy.toFixed(2)} {currency}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span>Labor Cost:</span>
                <strong>{pricing.Clabor.toFixed(2)} {currency}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span>Machine Depreciation:</span>
                <strong>{pricing.Cdepreciation.toFixed(2)} {currency}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span>Maintenance:</span>
                <strong>{pricing.Cmaintenance.toFixed(2)} {currency}</strong>
              </li>
              <li
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #ddd',
                  fontWeight: 'bold',
                }}
              >
                <span>Internal Cost:</span>
                <span>{pricing.Cinternal.toFixed(2)} {currency}</span>
              </li>
            </ul>
          </div>

          {/* Final Price */}
          <div style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '5px' }}>
            <h4 style={{ marginTop: 0 }}>Final Price</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span>Internal Cost:</span>
                <span>{pricing.Cinternal.toFixed(2)} {currency}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', color: '#d9534f' }}>
                <span>VAT (23%):</span>
                <strong>{pricing.vat.toFixed(2)} {currency}</strong>
              </li>
              <li
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #999',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: '#2e7d32',
                }}
              >
                <span>Price (with VAT):</span>
                <span>{pricing.priceWithoutDelivery.toFixed(2)} {currency}</span>
              </li>
              <li
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1b5e20',
                  borderTop: '2px solid #2e7d32',
                  paddingTop: '12px',
                }}
              >
                <span>Total Price:</span>
                <span>{pricing.totalPrice.toFixed(2)} {currency}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
