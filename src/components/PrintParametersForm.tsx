import React, { useState } from 'react';

interface PrintParametersFormProps {
  onAnalyze: (params: {
    quality: string;
    material: string;
    purpose: string;
  }) => void;
  loading?: boolean;
}

export const PrintParametersForm: React.FC<PrintParametersFormProps> = ({
  onAnalyze,
  loading = false,
}) => {
  const [quality, setQuality] = useState<string>('standard');
  const [material, setMaterial] = useState<string>('PLA');
  const [purpose, setPurpose] = useState<string>('prototype');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({ quality, material, purpose });
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Print Parameters</h3>

      <div>
        <label htmlFor="quality">Quality:</label>
        <select
          id="quality"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          disabled={loading}
        >
          <option value="draft">Draft (Fast, 0.3mm layers)</option>
          <option value="standard">Standard (Balanced, 0.2mm layers)</option>
          <option value="high">High (Slow, 0.1mm layers)</option>
        </select>
      </div>

      <div>
        <label htmlFor="material">Material:</label>
        <select
          id="material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          disabled={loading}
        >
          <option value="PLA">PLA (1.24 g/cm³)</option>
          <option value="ABS">ABS (1.04 g/cm³)</option>
          <option value="PETG">PETG (1.27 g/cm³)</option>
          <option value="TPU">TPU (1.21 g/cm³)</option>
          <option value="Resin">Resin (1.1 g/cm³)</option>
        </select>
      </div>

      <div>
        <label htmlFor="purpose">Purpose:</label>
        <select
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          disabled={loading}
        >
          <option value="prototype">Prototype (Low infill, fast)</option>
          <option value="functional">Functional (High infill, strong)</option>
          <option value="aesthetic">Aesthetic (Medium infill, looks good)</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze & Estimate'}
      </button>
    </form>
  );
};
