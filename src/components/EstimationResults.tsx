import React from 'react';

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
}

export const EstimationResults: React.FC<EstimationResultsProps> = ({ data }) => {
  const { metadata, estimations, parameters } = data;

  return (
    <div>
      <h3>Estimation Results</h3>

      <h4>File Metadata</h4>
      <ul>
        <li>Filename: {metadata.filename}</li>
        <li>Volume: {metadata.volume_mm3.toFixed(2)} mm³</li>
        <li>Surface Area: {metadata.surface_area_mm2.toFixed(2)} mm²</li>
        <li>Dimensions: {metadata.dimensions_mm.width.toFixed(1)} × {metadata.dimensions_mm.height.toFixed(1)} × {metadata.dimensions_mm.depth.toFixed(1)} mm</li>
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
        <li><strong>Material Weight: {estimations.material_weight_g.toFixed(2)} g</strong></li>
        <li><strong>Print Time: {estimations.print_time_minutes} minutes (~{(estimations.print_time_minutes / 60).toFixed(1)} hours)</strong></li>
        <li>Layer Count: {estimations.layer_count}</li>
        <li>Nozzle Travel: {estimations.nozzle_travel_mm.toFixed(0)} mm</li>
      </ul>
    </div>
  );
};
