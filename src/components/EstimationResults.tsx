import React from 'react';

interface PricingBreakdown {
  materialCost: number;
  laborCost: number;
  serviceFee: number;
  subtotal: number;
  markup: number;
  total: number;
}

interface EstimationData {
  metadata: {
    filename: string;
    fileSize: number;
    volume_mm3: number;
    surface_area_mm2: number;
    dimensions_mm: { width: number; height: number; depth: number };
  };
  estimations: {
    material_weight_g: number;
    print_time_minutes: number;
    layer_count: number;
    nozzle_travel_mm: number;
  };
  parameters: {
    layer_height: number;
    print_speed: number;
    infill_density: number;
    infill_pattern: string;
  };
}

interface EstimationResultsProps {
  data: EstimationData;
  pricing?: PricingBreakdown;
}

export const EstimationResults: React.FC<EstimationResultsProps> = ({
  data,
  pricing,
}) => {
  const { metadata, estimations, parameters } = data;

  return (
    <div style={{ padding: '20px', border: '1px solid #0f0', marginTop: '20px' }}>
      <h3>Estimation Results</h3>

      <h4>File Metadata</h4>
      <ul>
        <li>Filename: {metadata.filename}</li>
        <li>Volume: {metadata.volume_mm3.toFixed(2)} mm³</li>
        <li>Surface Area: {metadata.surface_area_mm2.toFixed(2)} mm²</li>
        <li>
          Dimensions: {metadata.dimensions_mm.width.toFixed(1)} ×{' '}
          {metadata.dimensions_mm.height.toFixed(1)} ×{' '}
          {metadata.dimensions_mm.depth.toFixed(1)} mm
        </li>
      </ul>

      <h4>Print Parameters</h4>
      <ul>
        <li>Layer Height: {parameters.layer_height} mm</li>
        <li>Print Speed: {parameters.print_speed} mm/s</li>
        <li>Infill Density: {parameters.infill_density}%</li>
        <li>Infill Pattern: {parameters.infill_pattern}</li>
      </ul>

      <h4>Estimations</h4>
      <ul>
        <li>
          <strong>
            Material Weight: {estimations.material_weight_g.toFixed(2)} g
          </strong>
        </li>
        <li>
          <strong>
            Print Time: {estimations.print_time_minutes} minutes (~
            {(estimations.print_time_minutes / 60).toFixed(1)} hours)
          </strong>
        </li>
        <li>Layer Count: {estimations.layer_count}</li>
        <li>Nozzle Travel: {estimations.nozzle_travel_mm.toFixed(0)} mm</li>
      </ul>

      {pricing && (
        <h4 style={{ color: '#00aa00', fontSize: '18px' }}>
          💰 Price Breakdown
          <div
            style={{
              fontSize: '14px',
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f0f0f0',
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>Material Cost: ${pricing.materialCost.toFixed(2)}</li>
              <li>Labor Cost: ${pricing.laborCost.toFixed(2)}</li>
              <li>Service Fee: ${pricing.serviceFee.toFixed(2)}</li>
              <li style={{ borderTop: '1px solid #ccc', paddingTop: '5px' }}>
                Subtotal: ${pricing.subtotal.toFixed(2)}
              </li>
              <li>Markup ({30}%): ${pricing.markup.toFixed(2)}</li>
              <li
                style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  borderTop: '2px solid #000',
                  paddingTop: '10px',
                  marginTop: '10px',
                }}
              >
                Total: ${pricing.total.toFixed(2)}
              </li>
            </ul>
          </div>
        </h4>
      )}
    </div>
  );
};
